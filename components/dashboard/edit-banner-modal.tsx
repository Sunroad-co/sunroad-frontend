'use client'

import { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import Image from 'next/image'
import dynamic from 'next/dynamic'
import type { Area, Point } from 'react-easy-crop'
import SRImage from '@/components/media/SRImage'
import { createClient } from '@/lib/supabase/client'
import { revalidateCache } from '@/lib/revalidate-client'
import { getCroppedImg, generateJpegFromCanvas } from '@/lib/image-crop'
import { toThumbKey } from '@/lib/utils/storage'
import { decodeAndDownscale } from '@/lib/utils/decode-and-downscale'
import { validateImageFile } from '@/lib/utils/image-validation'
import { buildCleanupPathsWithThumbFallback } from '@/lib/media'
import { UserProfile } from '@/hooks/use-user-profile'
import Toast from '@/components/ui/toast'
import CropperSkeleton from './cropper-skeleton'
import styles from './EditAvatarModal.module.css'

// Dynamically import Cropper to reduce initial bundle size
const Cropper = dynamic(
  () => import('react-easy-crop'),
  { 
    ssr: false,
    loading: () => <CropperSkeleton aspectRatio="rectangular" />
  }
)

interface EditBannerModalProps {
  isOpen: boolean
  onClose: () => void
  currentBanner?: string | null
  profile: UserProfile
  onSuccess?: () => void
}

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const BANNER_WIDTH = 1200
const BANNER_HEIGHT = 400
const BANNER_ASPECT = BANNER_WIDTH / BANNER_HEIGHT // 3:1
const BANNER_THUMB_WIDTH = 640 // Banner thumbnail width

export default function EditBannerModal({ 
  isOpen, 
  onClose, 
  currentBanner, 
  profile,
  onSuccess 
}: EditBannerModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [decodedCanvas, setDecodedCanvas] = useState<HTMLCanvasElement | null>(null) // Decoded and downscaled canvas
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)
  const [croppedPreviewUrl, setCroppedPreviewUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false)
  const [showToast, setShowToast] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const previewCleanupRef = useRef<string | null>(null)
  const previewTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  
  // Memoize Supabase client to avoid recreating on every render
  const supabase = useMemo(() => createClient(), [])

  // Cleanup object URLs and abort controllers on unmount
  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl)
      }
      if (croppedPreviewUrl) {
        URL.revokeObjectURL(croppedPreviewUrl)
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
  }, [previewUrl, croppedPreviewUrl])

  if (!isOpen) return null

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file size first
    if (file.size > MAX_FILE_SIZE) {
      setError('File size must be less than 10MB. Please choose a smaller image.')
      return
    }

    // Validate MIME type and reject HEIC/HEIF
    const validation = validateImageFile(file)
    if (!validation.isValid) {
      setError(validation.error || 'Please select a valid image file.')
      return
    }

    setError(null)
    setSelectedFile(file)

    try {
      // Decode and downscale the image (handles EXIF orientation)
      const canvas = await decodeAndDownscale(file, { maxDim: 2000 })
      setDecodedCanvas(canvas)

      // Create data URL from canvas for the cropper
      const dataUrl = canvas.toDataURL('image/jpeg', 0.92)
      setPreviewUrl(dataUrl)

      setCrop({ x: 0, y: 0 })
      setZoom(1)
      setCroppedAreaPixels(null)
      setCroppedPreviewUrl(null)
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
      setError("We couldn't process that image. Please try JPEG/PNG/WebP and keep size reasonable (≤10MB).")
      setSelectedFile(null)
    }
  }

  const generateCroppedPreview = useCallback(async (canvas: HTMLCanvasElement, pixelCrop: Area) => {
    // Cancel any previous preview generation
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    abortControllerRef.current = new AbortController()
    const signal = abortControllerRef.current.signal

    try {
      setIsGeneratingPreview(true)
      // Clean up previous preview URL (but wait until new one is ready)
      const prevUrl = previewCleanupRef.current
      
      const blob = await getCroppedImg(
        canvas,
        pixelCrop,
        BANNER_WIDTH,
        BANNER_HEIGHT,
        {
          mime: 'image/jpeg',
          quality: 0.82,
          background: '#fff'
        }
      )

      // Check if aborted
      if (signal.aborted) return

      const url = URL.createObjectURL(blob)
      
      // Revoke the old URL now that we have a new one
      if (prevUrl) {
        URL.revokeObjectURL(prevUrl)
      }
      
      // Check if aborted before setting state
      if (signal.aborted) {
        URL.revokeObjectURL(url)
        return
      }

      previewCleanupRef.current = url
      setCroppedPreviewUrl(url)
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
    
    // Debounce preview generation to avoid too many calls
    if (previewTimeoutRef.current) {
      clearTimeout(previewTimeoutRef.current)
    }
    
    previewTimeoutRef.current = setTimeout(() => {
      // Use decoded canvas for cropping
      if (decodedCanvas) {
        generateCroppedPreview(decodedCanvas, croppedAreaPixels)
      }
    }, 150) // 150ms debounce
  }, [decodedCanvas, generateCroppedPreview])

  const handleZoomChange = (newZoom: number) => {
    setZoom(newZoom)
  }

  const handleSave = async () => {
    if (!selectedFile || !decodedCanvas || !croppedAreaPixels) {
      setError('Please upload an image and adjust the crop before saving.')
      return
    }

    try {
      setSaving(true)
      setError(null)

      // Generate full-size cropped image blob
      const fullBlob = await getCroppedImg(
        decodedCanvas,
        croppedAreaPixels,
        BANNER_WIDTH,
        BANNER_HEIGHT,
        {
          mime: 'image/jpeg',
          quality: 0.82,
          background: '#fff'
        }
      )

      // Calculate thumbnail height maintaining aspect ratio
      const thumbHeight = Math.round(BANNER_THUMB_WIDTH / BANNER_ASPECT)

      // Generate thumbnail blob
      const thumbBlob = await generateJpegFromCanvas(
        decodedCanvas,
        croppedAreaPixels,
        BANNER_THUMB_WIDTH,
        thumbHeight,
        0.82
      )
      
      // Use single timestamp for filename
      const timestamp = Date.now()
      const fileName = `${timestamp}-banner.jpg`
      
      // Create files from blobs (thumb uses same filename)
      const fullFile = new File([fullBlob], fileName, {
        type: 'image/jpeg',
      })
      const thumbFile = new File([thumbBlob], fileName, {
        type: 'image/jpeg',
      })

      // Upload both files to Supabase Storage
      const fullPath = `banners/${profile.id}/${fileName}`
      const thumbPath = toThumbKey(fullPath)

      if (!thumbPath) {
        throw new Error('Failed to generate thumbnail storage path')
      }

      const [fullUploadResult, thumbUploadResult] = await Promise.all([
        supabase.storage
          .from('media')
          .upload(fullPath, fullFile, {
            contentType: 'image/jpeg',
            upsert: false,
            cacheControl: '31536000',
          }),
        supabase.storage
          .from('media')
          .upload(thumbPath, thumbFile, {
            contentType: 'image/jpeg',
            upsert: false,
            cacheControl: '31536000',
          })
      ])

      if (fullUploadResult.error) {
        throw new Error(`Upload failed: ${fullUploadResult.error.message}`)
      }
      if (thumbUploadResult.error) {
        // Cleanup full upload if thumb fails
        await supabase.storage
          .from('media')
          .remove([fullPath])
          .catch(() => {})
        throw new Error(`Thumbnail upload failed: ${thumbUploadResult.error.message}`)
      }

      // Store old paths for cleanup (use raw DB keys, not props that may be full URLs)
      const oldBannerKey = profile.banner_url
      const oldBannerThumbKey = profile.banner_thumb_url

      // Update database with both paths
      const { error: updateError } = await supabase
        .from('artists_min')
        .update({ 
          banner_url: fullPath,
          banner_thumb_url: thumbPath
        })
        .eq('id', profile.id)

      if (updateError) {
        // Attempt to clean up uploaded files
        await Promise.all([
          supabase.storage
            .from('media')
            .remove([fullPath])
            .catch(() => {}),
          supabase.storage
            .from('media')
            .remove([thumbPath])
            .catch(() => {})
        ])
        
        throw new Error(`Failed to update profile: ${updateError.message}`)
      }

      // Cleanup old files after successful DB update
      // Use buildCleanupPathsWithThumbFallback to ensure thumb is deleted even if thumb_url is missing
      const pathsToRemove = buildCleanupPathsWithThumbFallback(oldBannerKey, oldBannerThumbKey)
      if (pathsToRemove.length > 0) {
        await supabase.storage
          .from('media')
          .remove(pathsToRemove)
          .catch((err) => {
            console.error('Error cleaning up old banner files:', err)
          })
      }

      // Revalidate the artist profile page cache
      if (profile.handle) {
        await revalidateCache({
          handle: profile.handle,
          artistId: profile.id,
          tags: [`artist:${profile.handle}`, `artist-works:${profile.id}`],
        })
      }

      // Success - trigger refetch and close
      if (onSuccess) {
        onSuccess()
      }
      
      setShowToast(true)
      
      // Keep modal open slightly longer so toast is visible before closing
      setTimeout(() => {
        handleCancel()
      }, 1500)
    } catch (err) {
      console.error('Error saving banner:', err)
      setError(err instanceof Error ? err.message : 'Failed to save banner. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    // Clean up object URLs (only revoke blob: URLs, not data: URLs)
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl)
    }
    if (croppedPreviewUrl && croppedPreviewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(croppedPreviewUrl)
    }
    if (previewCleanupRef.current && previewCleanupRef.current.startsWith('blob:')) {
      URL.revokeObjectURL(previewCleanupRef.current)
    }
    previewCleanupRef.current = null
    if (previewTimeoutRef.current) {
      clearTimeout(previewTimeoutRef.current)
      previewTimeoutRef.current = null
    }
    
    setSelectedFile(null)
    setPreviewUrl(null)
    setDecodedCanvas(null)
    setCroppedPreviewUrl(null)
    
    // Abort any ongoing preview generation
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
    setCrop({ x: 0, y: 0 })
    setZoom(1)
    setCroppedAreaPixels(null)
    setError(null)
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    
    onClose()
  }

  return (
    <>
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
          <h2 className="text-xl font-semibold text-gray-900">Edit Banner Image</h2>
          <button
            onClick={handleCancel}
              disabled={saving}
              className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
            {/* Current Banner + Preview Side by Side */}
          <div className="mb-6">
              <div className="flex items-center justify-center gap-4 sm:gap-6">
                {/* Current Banner */}
                <div className={`relative rounded-lg overflow-hidden bg-gray-100 border-2 border-gray-200 shadow-md transition-all duration-500 ${
                  croppedPreviewUrl 
                    ? 'w-32 h-11 sm:w-40 sm:h-14' 
                    : 'w-48 h-16 sm:w-64 sm:h-20'
                }`}>
              {currentBanner ? (
                <SRImage
                  src={currentBanner}
                  alt="Current banner"
                  fill
                  className="object-cover"
                  mode="raw"
                  sizes="(max-width: 640px) 128px, 256px"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-sunroad-amber-200 to-sunroad-amber-300 flex items-center justify-center">
                  <div className="text-center text-sunroad-brown-700 text-xs">No banner</div>
                </div>
              )}
                </div>

                {/* Arrow (only shown when preview exists) */}
                {croppedPreviewUrl && (
                  <div className="flex-shrink-0 animate-in fade-in slide-in-from-left-5 duration-500">
                    <svg 
                      className="w-6 h-6 sm:w-8 sm:h-8 text-sunroad-amber-600" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={2} 
                        d="M13 7l5 5m0 0l-5 5m5-5H6" 
                      />
                    </svg>
                  </div>
                )}

                {/* Preview */}
                {croppedPreviewUrl && (
                  <div className="relative w-48 h-16 sm:w-64 sm:h-20 rounded-lg overflow-hidden bg-gray-100 border-2 border-gray-200 shadow-md animate-in fade-in slide-in-from-right-5 duration-500">
                    <Image
                      src={croppedPreviewUrl}
                      alt="Banner preview"
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
            </div>
          </div>

          {/* File Upload */}
            {/* File input - always rendered but hidden, so ref is always available */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileChange}
                className="hidden"
                id="banner-upload"
                disabled={saving}
              />
            
            {!previewUrl && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload New Banner
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-sunroad-amber-400 transition-colors">
              <label
                htmlFor="banner-upload"
                    className={`cursor-pointer flex flex-col items-center ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <svg className="w-8 h-8 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <span className="text-sm text-gray-600">
                  {selectedFile ? selectedFile.name : 'Click to upload or drag and drop'}
                </span>
                    <span className="text-xs text-gray-500 mt-1">JPEG, PNG, or WebP up to 10MB</span>
              </label>
            </div>
          </div>
            )}

            {/* Cropper */}
          {previewUrl && (
            <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <label className="block text-sm font-medium text-gray-700">
                    Crop Your Banner
                  </label>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-sm text-sunroad-amber-600 hover:text-sunroad-amber-700 hover:underline transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={saving}
                  >
                    Choose a different image
                  </button>
                </div>
                <div className="relative w-full h-48 sm:h-64 bg-gray-100 rounded-lg overflow-hidden">
                  {/* @ts-expect-error - react-easy-crop props are correctly typed but dynamic import causes type issues */}
                  <Cropper
                    image={previewUrl}
                    crop={crop}
                    zoom={zoom}
                    aspect={BANNER_ASPECT}
                    onCropChange={setCrop}
                    onZoomChange={handleZoomChange}
                    onCropComplete={onCropComplete}
                    cropShape="rect"
                    showGrid={false}
                  />
                </div>
                
                {/* Zoom Control - Styled Slider */}
                <div className="mt-6">
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-medium text-gray-700 tracking-wide">
                      Zoom
              </label>
                    <span className="text-sm text-gray-500 font-mono tracking-tight">
                      {Math.round(zoom * 100)}%
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      type="range"
                      min={1}
                      max={3}
                      step={0.1}
                      value={zoom}
                      onChange={(e) => handleZoomChange(Number(e.target.value))}
                      className={styles.zoomSlider}
                      disabled={saving}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Guidelines */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-amber-800 mb-2">Banner Guidelines</h3>
            <ul className="text-xs text-amber-700 space-y-1">
                <li>• Recommended size: 1200x400 pixels (3:1 ratio)</li>
              <li>• Use high-quality images for best results</li>
              <li>• Avoid text-heavy images as they may be hard to read</li>
              <li>• Consider how your profile picture will look over the banner</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 sticky bottom-0 bg-white">
          <button
            onClick={handleCancel}
              disabled={saving}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
            <button
              onClick={handleSave}
              disabled={!selectedFile || !decodedCanvas || !croppedAreaPixels || saving || isGeneratingPreview}
              className="px-4 py-2 bg-sunroad-amber-600 text-white rounded-lg hover:bg-sunroad-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {saving ? (
                <>
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Saving...</span>
                </>
              ) : (
                'Save Changes'
              )}
          </button>
        </div>
      </div>
    </div>

      <Toast
        message="Banner image updated successfully!"
        isVisible={showToast}
        onClose={() => setShowToast(false)}
      />
    </>
  )
}
