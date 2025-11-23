'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import Image from 'next/image'
import Cropper from 'react-easy-crop'
import type { Area, Point } from 'react-easy-crop'
import { getMediaUrl } from '@/lib/media'
import { createClient } from '@/lib/supabase/client'
import { getCroppedImg } from '@/lib/image-crop'
import { UserProfile } from '@/hooks/use-user-profile'
import Toast from '@/components/ui/toast'

interface EditAvatarModalProps {
  isOpen: boolean
  onClose: () => void
  currentAvatar?: string | null
  profile: UserProfile
  onSuccess?: () => void
}

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const OUTPUT_SIZE = 600 // Square output size

export default function EditAvatarModal({ 
  isOpen, 
  onClose, 
  currentAvatar, 
  profile,
  onSuccess 
}: EditAvatarModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null) // Stable data URL for cropping
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)
  const [croppedPreviewUrl, setCroppedPreviewUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [showToast, setShowToast] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const previewCleanupRef = useRef<string | null>(null)
  const previewTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      if (previewUrl) {
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
    }
  }, [previewUrl, croppedPreviewUrl])

  if (!isOpen) return null

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file (PNG, JPG, etc.)')
      return
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      setError('File size must be less than 5MB. Please choose a smaller image.')
      return
    }

    setError(null)
    setSelectedFile(file)
    
    // Create blob URL for display in cropper
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
    
    // Create data URL for stable cropping operations
    const reader = new FileReader()
    reader.onload = (e) => {
      if (e.target?.result) {
        setImageDataUrl(e.target.result as string)
      }
    }
    reader.readAsDataURL(file)
    
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
  }

  const generateCroppedPreview = useCallback(async (imageSrc: string, pixelCrop: Area) => {
    try {
      // Clean up previous preview URL (but wait until new one is ready)
      const prevUrl = previewCleanupRef.current
      
      const blob = await getCroppedImg(imageSrc, pixelCrop, OUTPUT_SIZE)
      const url = URL.createObjectURL(blob)
      
      // Revoke the old URL now that we have a new one
      if (prevUrl) {
        URL.revokeObjectURL(prevUrl)
      }
      
      previewCleanupRef.current = url
      setCroppedPreviewUrl(url)
    } catch (err) {
      console.error('Error generating preview:', err)
    }
  }, [])

  const onCropComplete = useCallback((croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels)
    
    // Debounce preview generation to avoid too many calls
    if (previewTimeoutRef.current) {
      clearTimeout(previewTimeoutRef.current)
    }
    
    previewTimeoutRef.current = setTimeout(() => {
      // Use data URL for stable cropping operations
      if (imageDataUrl) {
        generateCroppedPreview(imageDataUrl, croppedAreaPixels)
      }
    }, 150) // 150ms debounce
  }, [imageDataUrl, generateCroppedPreview])

  const handleZoomChange = (newZoom: number) => {
    setZoom(newZoom)
  }

  const handleSave = async () => {
    if (!selectedFile || !imageDataUrl || !croppedAreaPixels) {
      setError('Please upload an image and adjust the crop before saving.')
      return
    }

    try {
      setSaving(true)
      setError(null)

      // Generate cropped image blob using stable data URL
      const croppedBlob = await getCroppedImg(imageDataUrl, croppedAreaPixels, OUTPUT_SIZE)
      
      // Use single timestamp for filename and path
      const timestamp = Date.now()
      const fileName = `${timestamp}-avatar.jpg`
      
      // Create file from blob
      const croppedFile = new File([croppedBlob], fileName, {
        type: 'image/jpeg',
      })

      const supabase = createClient()

      // Upload to Supabase Storage
      const storagePath = `avatars/${profile.id}/${fileName}`
      const { error: uploadError } = await supabase.storage
        .from('media')
        .upload(storagePath, croppedFile, {
          contentType: 'image/jpeg',
          upsert: false,
        })

      if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`)
      }

      // Update database
      const { error: updateError } = await supabase
        .from('artists_min')
        .update({ avatar_url: storagePath })
        .eq('id', profile.id)

      if (updateError) {
        // Attempt to clean up uploaded file
        await supabase.storage
          .from('media')
          .remove([storagePath])
          .catch(() => {
            // Ignore cleanup errors
          })
        
        throw new Error(`Failed to update profile: ${updateError.message}`)
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
      console.error('Error saving avatar:', err)
      setError(err instanceof Error ? err.message : 'Failed to save avatar. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    // Clean up object URLs
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
    }
    if (croppedPreviewUrl) {
      URL.revokeObjectURL(croppedPreviewUrl)
    }
    if (previewCleanupRef.current) {
      URL.revokeObjectURL(previewCleanupRef.current)
      previewCleanupRef.current = null
    }
    if (previewTimeoutRef.current) {
      clearTimeout(previewTimeoutRef.current)
      previewTimeoutRef.current = null
    }
    
    setSelectedFile(null)
    setPreviewUrl(null)
    setImageDataUrl(null)
    setCroppedPreviewUrl(null)
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
        <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
            <h2 className="text-xl font-semibold text-gray-900">Edit Profile Picture</h2>
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
            {/* Current Avatar */}
            <div className="mb-6 text-center">
              <label className="block text-sm font-medium text-gray-700 mb-4">
                Current Profile Picture
              </label>
              <div className="relative w-24 h-24 mx-auto rounded-full overflow-hidden bg-gray-100 border-4 border-white shadow-lg">
                {(() => {
                  const avatarSrc = getMediaUrl(currentAvatar);
                  return avatarSrc ? (
                    <Image
                      src={avatarSrc}
                      alt="Current avatar"
                      width={96}
                      height={96}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-300 flex items-center justify-center text-2xl text-gray-600">
                      ?
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* File Upload */}
            {/* File input - always rendered but hidden, so ref is always available */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
              id="avatar-upload"
              disabled={saving}
            />
            
            {!previewUrl && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload New Picture
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-sunroad-amber-400 transition-colors">
                  <label
                    htmlFor="avatar-upload"
                    className={`cursor-pointer flex flex-col items-center ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <svg className="w-8 h-8 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <span className="text-sm text-gray-600">
                      {selectedFile ? selectedFile.name : 'Click to upload or drag and drop'}
                    </span>
                    <span className="text-xs text-gray-500 mt-1">PNG, JPG, GIF up to 5MB</span>
                  </label>
                </div>
              </div>
            )}

            {/* Cropper */}
            {previewUrl && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <label className="block text-sm font-medium text-gray-700">
                    Crop Your Picture
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
                <div className="relative w-full h-64 sm:h-80 bg-gray-100 rounded-lg overflow-hidden">
                  <Cropper
                    image={previewUrl}
                    crop={crop}
                    zoom={zoom}
                    aspect={1}
                    onCropChange={setCrop}
                    onZoomChange={handleZoomChange}
                    onCropComplete={onCropComplete}
                    cropShape="round"
                    showGrid={false}
                  />
                </div>
                
                {/* Zoom Control */}
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Zoom: {Math.round(zoom * 100)}%
                  </label>
                  <input
                    type="range"
                    min={1}
                    max={3}
                    step={0.1}
                    value={zoom}
                    onChange={(e) => handleZoomChange(Number(e.target.value))}
                    className="w-full"
                    disabled={saving}
                  />
                </div>
              </div>
            )}

            {/* Preview */}
            {croppedPreviewUrl && (
              <div className="mb-6 text-center">
                <label className="block text-sm font-medium text-gray-700 mb-4">
                  Preview
                </label>
                <div className="relative w-24 h-24 mx-auto rounded-full overflow-hidden bg-gray-100 border-4 border-white shadow-lg">
                  <Image
                    src={croppedPreviewUrl}
                    alt="Avatar preview"
                    width={96}
                    height={96}
                    className="w-full h-full object-cover"
                  />
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
              <h3 className="text-sm font-medium text-amber-800 mb-2">Profile Picture Guidelines</h3>
              <ul className="text-xs text-amber-700 space-y-1">
                <li>• Recommended size: 400x400 pixels (square)</li>
                <li>• Use a clear, well-lit photo of yourself</li>
                <li>• Avoid group photos or images with text</li>
                <li>• Make sure your face is clearly visible</li>
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
              disabled={!selectedFile || !imageDataUrl || !croppedAreaPixels || saving}
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
        message="Profile picture updated successfully!"
        isVisible={showToast}
        onClose={() => setShowToast(false)}
      />
    </>
  )
}
