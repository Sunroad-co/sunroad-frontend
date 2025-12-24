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

type CropMode = 'landscape' | 'portrait' | 'square'

interface CropModeConfig {
  label: string
  aspect: number
  outputWidth: number
  outputHeight: number
  icon: React.ReactNode
}

const CROP_MODES: Record<CropMode, CropModeConfig> = {
  landscape: {
    label: 'Landscape',
    aspect: 4 / 3,
    outputWidth: 1200,
    outputHeight: 900,
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
      </svg>
    ),
  },
  portrait: {
    label: 'Portrait',
    aspect: 3 / 4,
    outputWidth: 900,
    outputHeight: 1200,
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h2a1 1 0 011 1v14a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM9 5a1 1 0 011-1h6a1 1 0 011 1v14a1 1 0 01-1 1h-6a1 1 0 01-1-1V5zM18 5a1 1 0 011-1h2a1 1 0 011 1v14a1 1 0 01-1 1h-2a1 1 0 01-1-1V5z" />
      </svg>
    ),
  },
  square: {
    label: 'Square',
    aspect: 1,
    outputWidth: 1200,
    outputHeight: 1200,
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v14a1 1 0 01-1 1H5a1 1 0 01-1-1V5z" />
      </svg>
    ),
  },
}

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
    const [cropMode, setCropMode] = useState<CropMode>('landscape')
    
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

      const modeConfig = CROP_MODES[cropMode]
      // Use predefined output dimensions for fixed aspect modes
      const outputWidth = modeConfig.outputWidth
      const outputHeight = modeConfig.outputHeight

      const croppedBlob = await getCroppedImg(
        decodedCanvas,
        croppedAreaPixels,
        outputWidth,
        outputHeight,
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
    }, [selectedFile, decodedCanvas, croppedAreaPixels, cropMode, profileId])

    const clear = useCallback(() => {
      setSelectedFile(null)
      setPreviewUrl(null)
      setDecodedCanvas(null)
      setCrop({ x: 0, y: 0 })
      setZoom(1)
      setCroppedAreaPixels(null)
      setCropMode('landscape')
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
        setCropMode('landscape') // Reset to default mode when new file is selected
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
        
        // Calculate output dimensions preserving crop aspect ratio
        // For preview, use a reasonable max dimension (smaller than final output for performance)
        const previewMaxDim = 800
        const cropAspect = pixelCrop.width / pixelCrop.height
        let outputWidth: number
        let outputHeight: number

        if (pixelCrop.width >= pixelCrop.height) {
          // Landscape or square: constrain width
          outputWidth = Math.min(pixelCrop.width, previewMaxDim)
          outputHeight = Math.round(outputWidth / cropAspect)
        } else {
          // Portrait: constrain height
          outputHeight = Math.min(pixelCrop.height, previewMaxDim)
          outputWidth = Math.round(outputHeight * cropAspect)
        }
        
        const blob = await getCroppedImg(
          canvas,
          pixelCrop,
          outputWidth,
          outputHeight,
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

    // Handle crop mode change - reset crop position but keep zoom reasonable
    const handleCropModeChange = useCallback((newMode: CropMode) => {
      setCropMode(newMode)
      // Reset crop position to center, keep zoom if reasonable (between 1 and 2)
      setCrop({ x: 0, y: 0 })
      if (zoom > 2) {
        setZoom(2)
      } else if (zoom < 1) {
        setZoom(1)
      }
      // Clear cropped area pixels so user must crop again
      setCroppedAreaPixels(null)
    }, [zoom])

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

            {/* Crop Mode Selector */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Aspect Ratio
              </label>
              <div className="flex flex-wrap gap-2">
                {(Object.keys(CROP_MODES) as CropMode[]).map((mode) => {
                  const modeConfig = CROP_MODES[mode]
                  const isActive = cropMode === mode
                  return (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => handleCropModeChange(mode)}
                      disabled={saving}
                      className={`
                        flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all
                        ${
                          isActive
                            ? 'bg-sunroad-amber-100 text-sunroad-amber-800 border-2 border-sunroad-amber-400 shadow-sm'
                            : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-sunroad-amber-300 hover:bg-sunroad-amber-50'
                        }
                        disabled:opacity-50 disabled:cursor-not-allowed
                      `}
                    >
                      {modeConfig.icon}
                      <span>{modeConfig.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="relative w-full h-64 sm:h-80 bg-gray-100 rounded-lg overflow-hidden">
              {/* @ts-expect-error - react-easy-crop props are correctly typed but dynamic import causes type issues */}
              <Cropper
                image={previewUrl}
                crop={crop}
                zoom={zoom}
                aspect={CROP_MODES[cropMode].aspect}
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

