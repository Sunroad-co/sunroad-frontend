'use client'

import React, { useState, useCallback, useRef, useEffect, forwardRef, useImperativeHandle } from 'react'
import dynamic from 'next/dynamic'
import type { Area, Point } from 'react-easy-crop'
import { getCroppedImg } from '@/lib/image-crop'
import { decodeAndDownscale } from '@/lib/utils/decode-and-downscale'
import { validateImageFile } from '@/lib/utils/image-validation'
import CropperSkeleton from '../cropper-skeleton'
import styles from '../EditAvatarModal.module.css'

// Dynamically import Cropper to reduce initial bundle size
const Cropper = dynamic(
  () => import('react-easy-crop'),
  { 
    ssr: false,
    loading: () => <CropperSkeleton aspectRatio="rectangular" />
  }
)

const MAX_IMAGE_SIZE = 8 * 1024 * 1024 // 8MB
const WORK_IMAGE_WIDTH = 1200
const WORK_IMAGE_HEIGHT = 900
const WORK_IMAGE_ASPECT = WORK_IMAGE_WIDTH / WORK_IMAGE_HEIGHT // 4:3

export interface ImageWorkFieldsProps {
  saving: boolean
  profileId: string
  onChangeValidity: (isValid: boolean) => void
  onClear: () => void
  initialUrl?: string
}

export interface ImageWorkFieldsHandle {
  getImageData: () => Promise<{ storagePath: string; file: File } | null>
  clear: () => void
}

export const ImageWorkFields = forwardRef<ImageWorkFieldsHandle, ImageWorkFieldsProps>(
  ({ saving, profileId, onChangeValidity, onClear, initialUrl }, ref) => {
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [previewUrl, setPreviewUrl] = useState<string | null>(null)
    const [decodedCanvas, setDecodedCanvas] = useState<HTMLCanvasElement | null>(null)
    const [crop, setCrop] = useState<Point>({ x: 0, y: 0 })
    const [zoom, setZoom] = useState(1)
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)
    const [isGeneratingPreview, setIsGeneratingPreview] = useState(false)
    
    const fileInputRef = useRef<HTMLInputElement>(null)
    const previewCleanupRef = useRef<string | null>(null)
    const previewTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const abortControllerRef = useRef<AbortController | null>(null)

    // Initialize with initialUrl if provided (for edit mode)
    // Note: For images, we don't pre-populate the cropper with existing image
    // User must select a new file to replace it
    // This keeps the component simple and avoids loading existing images into cropper

    const getImageData = useCallback(async (): Promise<{ storagePath: string; file: File } | null> => {
      if (!selectedFile || !decodedCanvas || !croppedAreaPixels) {
        return null
      }

      const croppedBlob = await getCroppedImg(
        decodedCanvas,
        croppedAreaPixels,
        WORK_IMAGE_WIDTH,
        WORK_IMAGE_HEIGHT,
        {
          mime: 'image/jpeg',
          quality: 0.82,
          background: '#fff'
        }
      )

      const timestamp = Date.now()
      const fileName = `${timestamp}-work.jpg`
      const storagePath = `artworks/${profileId}/${fileName}`

      const croppedFile = new File([croppedBlob], fileName, {
        type: 'image/jpeg',
      })

      return { storagePath, file: croppedFile }
    }, [selectedFile, decodedCanvas, croppedAreaPixels, profileId])

    const clear = useCallback(() => {
      setSelectedFile(null)
      setPreviewUrl(null)
      setDecodedCanvas(null)
      setCrop({ x: 0, y: 0 })
      setZoom(1)
      setCroppedAreaPixels(null)
      if (previewCleanupRef.current) {
        URL.revokeObjectURL(previewCleanupRef.current)
        previewCleanupRef.current = null
      }
      if (previewTimeoutRef.current) {
        clearTimeout(previewTimeoutRef.current)
        previewTimeoutRef.current = null
      }
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      onChangeValidity(false)
      onClear()
    }, [onChangeValidity, onClear])

    useImperativeHandle(ref, () => ({
      getImageData,
      clear
    }))

    // Update parent validity
    useEffect(() => {
      const isValid = !!(selectedFile && decodedCanvas && croppedAreaPixels && !isGeneratingPreview)
      onChangeValidity(isValid)
    }, [selectedFile, decodedCanvas, croppedAreaPixels, isGeneratingPreview, onChangeValidity])

    // Cleanup on unmount
    useEffect(() => {
      return () => {
        if (previewUrl && previewUrl.startsWith('blob:')) {
          URL.revokeObjectURL(previewUrl)
        }
        if (previewCleanupRef.current) {
          URL.revokeObjectURL(previewCleanupRef.current)
        }
        if (previewTimeoutRef.current) {
          clearTimeout(previewTimeoutRef.current)
        }
        if (abortControllerRef.current) {
          abortControllerRef.current.abort()
        }
      }
    }, [previewUrl])

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      if (!file) return

      if (file.size > MAX_IMAGE_SIZE) {
        onChangeValidity(false)
        return
      }

      const validation = validateImageFile(file)
      if (!validation.isValid) {
        onChangeValidity(false)
        return
      }

      setSelectedFile(file)

      try {
        const canvas = await decodeAndDownscale(file, { maxDim: 2000 })
        setDecodedCanvas(canvas)

        const dataUrl = canvas.toDataURL('image/jpeg', 0.92)
        setPreviewUrl(dataUrl)

        setCrop({ x: 0, y: 0 })
        setZoom(1)
        setCroppedAreaPixels(null)
        if (previewCleanupRef.current) {
          URL.revokeObjectURL(previewCleanupRef.current)
          previewCleanupRef.current = null
        }
        if (previewTimeoutRef.current) {
          clearTimeout(previewTimeoutRef.current)
          previewTimeoutRef.current = null
        }
      } catch (err) {
        console.error('Error decoding image:', err)
        setSelectedFile(null)
        setPreviewUrl(null)
        setDecodedCanvas(null)
        onChangeValidity(false)
      }
    }

    const generateCroppedPreview = useCallback(async (canvas: HTMLCanvasElement, pixelCrop: Area) => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
      abortControllerRef.current = new AbortController()
      const signal = abortControllerRef.current.signal

      try {
        setIsGeneratingPreview(true)
        const prevUrl = previewCleanupRef.current
        
        const blob = await getCroppedImg(
          canvas,
          pixelCrop,
          WORK_IMAGE_WIDTH,
          WORK_IMAGE_HEIGHT,
          {
            mime: 'image/jpeg',
            quality: 0.82,
            background: '#fff'
          }
        )

        if (signal.aborted) return

        const url = URL.createObjectURL(blob)
        
        if (prevUrl) {
          URL.revokeObjectURL(prevUrl)
        }
        
        if (signal.aborted) {
          URL.revokeObjectURL(url)
          return
        }

        previewCleanupRef.current = url
      } catch (err) {
        if (signal.aborted) return
        console.error('Error generating preview:', err)
      } finally {
        if (!signal.aborted) {
          setIsGeneratingPreview(false)
        }
      }
    }, [])

    const onCropComplete = useCallback((croppedArea: Area, croppedAreaPixels: Area) => {
      setCroppedAreaPixels(croppedAreaPixels)
      
      if (previewTimeoutRef.current) {
        clearTimeout(previewTimeoutRef.current)
      }
      
      previewTimeoutRef.current = setTimeout(() => {
        if (decodedCanvas) {
          generateCroppedPreview(decodedCanvas, croppedAreaPixels)
        }
      }, 150)
    }, [decodedCanvas, generateCroppedPreview])

    return (
      <div className="space-y-6">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileChange}
          className="hidden"
          id="work-image-upload"
          disabled={saving}
        />

        {!previewUrl && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Work Image *
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-sunroad-amber-400 transition-colors">
              <label
                htmlFor="work-image-upload"
                className={`cursor-pointer flex flex-col items-center ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <svg className="w-8 h-8 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <span className="text-sm text-gray-600">
                  {selectedFile ? selectedFile.name : 'Click to upload or drag and drop'}
                </span>
                <span className="text-xs text-gray-500 mt-1">JPEG, PNG, or WebP up to 8MB</span>
              </label>
            </div>
          </div>
        )}

        {previewUrl && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <label className="block text-sm font-medium text-gray-700">
                Crop Your Image
              </label>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-sm text-sunroad-amber-600 hover:text-sunroad-amber-700 hover:underline transition-colors disabled:opacity-50"
                disabled={saving}
              >
                Choose a different image
              </button>
            </div>
            <div className="relative w-full h-64 sm:h-80 bg-gray-100 rounded-lg overflow-hidden">
              {/* @ts-expect-error - react-easy-crop props are correctly typed but dynamic import causes type issues */}
              <Cropper
                image={previewUrl}
                crop={crop}
                zoom={zoom}
                aspect={WORK_IMAGE_ASPECT}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
                cropShape="rect"
                showGrid={false}
              />
            </div>

            <div className="mt-6">
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-medium text-gray-700 tracking-wide">
                  Zoom
                </label>
                <span className="text-sm text-gray-500 font-mono tracking-tight">
                  {Math.round(zoom * 100)}%
                </span>
              </div>
              <input
                type="range"
                min={1}
                max={3}
                step={0.1}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className={styles.zoomSlider}
                disabled={saving}
              />
            </div>
          </div>
        )}
      </div>
    )
  }
)

ImageWorkFields.displayName = 'ImageWorkFields'

