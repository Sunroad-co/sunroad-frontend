'use client'

import React, { useState, useRef, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { revalidateCache } from '@/lib/revalidate-client'
import { UserProfile, Work } from '@/hooks/use-user-profile'
import Toast from '@/components/ui/toast'
import ConfirmDialog from '@/components/ui/confirm-dialog'
import { sanitizeAndTrim } from '@/lib/utils/sanitize'
import { ImageWorkFields, type ImageWorkFieldsHandle } from './works/image-work-fields'
import { VideoWorkFields, type VideoWorkFieldsHandle } from './works/video-work-fields'
import { AudioWorkFields, type AudioWorkFieldsHandle } from './works/audio-work-fields'
import { MediaPreview } from './work-card'

interface EditWorkModalProps {
  isOpen: boolean
  onClose: () => void
  profile: UserProfile
  work: Work
  onSuccess?: () => void
}

type MediaTab = 'image' | 'video' | 'audio'

export default function EditWorkModal({ isOpen, onClose, profile, work, onSuccess }: EditWorkModalProps) {
  // Form state
  const [title, setTitle] = useState(work.title)
  const [description, setDescription] = useState(work.description || '')
  const [mediaTab, setMediaTab] = useState<MediaTab>(work.media_type)

  // Media validity state
  const [isImageValid, setIsImageValid] = useState(false)
  const [isVideoValid, setIsVideoValid] = useState(false)
  const [isAudioValid, setIsAudioValid] = useState(false)

  // Confirmation modals
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  // General state
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  
  // Refs for child components
  const imageWorkFieldsRef = useRef<ImageWorkFieldsHandle>(null)
  const videoWorkFieldsRef = useRef<VideoWorkFieldsHandle>(null)
  const audioWorkFieldsRef = useRef<AudioWorkFieldsHandle>(null)

  const supabase = useMemo(() => createClient(), [])

  // Track original values to detect changes
  const [originalTitle, setOriginalTitle] = useState(work.title)
  const [originalDescription, setOriginalDescription] = useState(work.description || '')
  const [originalMediaType, setOriginalMediaType] = useState<MediaTab>(work.media_type)
  const [originalMediaUrl, setOriginalMediaUrl] = useState(work.src_url || '')

  // Reset state when work changes
  useEffect(() => {
    if (isOpen) {
      setTitle(work.title)
      setDescription(work.description || '')
      setMediaTab(work.media_type)
      setHasUnsavedChanges(false)
    setError(null)
      setIsImageValid(false)
      setIsVideoValid(false)
      setIsAudioValid(false)
      
      // Store original values for change detection
      setOriginalTitle(work.title)
      setOriginalDescription(work.description || '')
      setOriginalMediaType(work.media_type)
      setOriginalMediaUrl(work.src_url || '')
    }
  }, [isOpen, work])

  // Track unsaved changes
  const handleTitleChange = (value: string) => {
    setTitle(value)
    setHasUnsavedChanges(true)
  }

  const handleDescriptionChange = (value: string) => {
    setDescription(value)
    setHasUnsavedChanges(true)
  }

  const handleImageValidityChange = (isValid: boolean) => {
    setIsImageValid(isValid)
    if (isValid) {
      setHasUnsavedChanges(true)
    }
  }

  const handleVideoValidityChange = (isValid: boolean) => {
    setIsVideoValid(isValid)
    if (isValid) {
      setHasUnsavedChanges(true)
    }
  }

  const handleAudioValidityChange = (isValid: boolean) => {
    setIsAudioValid(isValid)
    if (isValid) {
      setHasUnsavedChanges(true)
    }
  }

  if (!isOpen) return null

  const handleSave = async () => {
    try {
      // Validate title and description
      if (!title.trim() || title.length > 200) {
        setError('Title is required and must be 200 characters or less.')
        return
      }

      if (!description.trim() || description.length > 500) {
        setError('Description is required and must be 500 characters or less.')
        return
      }

      setSaving(true)
      setError(null)

      if (mediaTab === 'image') {
        const imageData = await imageWorkFieldsRef.current?.getImageData()
        
        if (imageData) {
          // New image was selected - require validation
          if (!isImageValid) {
            setError('Please upload an image and adjust the crop before saving.')
            setSaving(false)
            return
          }

          // Upload to Supabase Storage
          const { error: uploadError } = await supabase.storage
            .from('media')
            .upload(imageData.storagePath, imageData.file, {
              contentType: 'image/jpeg',
              upsert: false,
              cacheControl: '31536000',
            })

          if (uploadError) {
            throw new Error(`Upload failed: ${uploadError.message}`)
          }

          // Update database with new image
        const { error: updateError } = await supabase
          .from('artworks_min')
          .update({
              title: sanitizeAndTrim(title),
              description: sanitizeAndTrim(description),
              media_type: 'image',
              media_source: 'upload',
              thumb_url: imageData.storagePath,
              src_url: imageData.storagePath,
          })
          .eq('id', work.id)

        if (updateError) {
            // Attempt cleanup
            await supabase.storage
              .from('media')
              .remove([imageData.storagePath])
              .catch(() => {})
          throw new Error(`Failed to update work: ${updateError.message}`)
        }

          // Attempt to remove old image if it was an uploaded image
          if (work.media_source === 'upload') {
            const pathsToRemove: string[] = []
            if (work.thumb_url && work.thumb_url.startsWith('artworks/')) {
              pathsToRemove.push(work.thumb_url)
            }
            if (work.src_url && work.src_url.startsWith('artworks/') && work.src_url !== work.thumb_url) {
            pathsToRemove.push(work.src_url)
          }
            if (pathsToRemove.length > 0) {
          await supabase.storage
            .from('media')
            .remove(pathsToRemove)
            .catch(() => {
              // Ignore cleanup errors
            })
            }
          }
        } else {
          // No new image selected - just update title/description (keep existing image)
          // Only allow this if the work is already an image
          if (work.media_type !== 'image') {
            setError('Please upload an image to change the media type to image.')
            setSaving(false)
            return
          }

          const { error: updateError } = await supabase
            .from('artworks_min')
            .update({
              title: sanitizeAndTrim(title),
              description: sanitizeAndTrim(description),
            })
            .eq('id', work.id)

          if (updateError) {
            throw new Error(`Failed to update work: ${updateError.message}`)
          }
        }

      } else if (mediaTab === 'video') {
        if (!isVideoValid) {
          setError('Please enter a valid video URL and wait for the preview to load.')
          setSaving(false)
          return
        }

        const videoData = videoWorkFieldsRef.current?.getVideoData()
        if (!videoData) {
          setError('Please enter a valid video URL and wait for the preview to load.')
          setSaving(false)
          return
        }

        // Update database
        const { error: updateError } = await supabase
          .from('artworks_min')
          .update({
            title: sanitizeAndTrim(title),
            description: sanitizeAndTrim(description),
            media_type: 'video',
            media_source: videoData.mediaSource,
            src_url: videoData.url,
            thumb_url: null,
          })
          .eq('id', work.id)

        if (updateError) {
          throw new Error(`Failed to update work: ${updateError.message}`)
        }

        // Attempt to remove old image if previous media was an uploaded image
        if (work.media_source === 'upload') {
          const pathsToRemove: string[] = []
          if (work.thumb_url && work.thumb_url.startsWith('artworks/')) {
            pathsToRemove.push(work.thumb_url)
          }
          if (work.src_url && work.src_url.startsWith('artworks/') && work.src_url !== work.thumb_url) {
            pathsToRemove.push(work.src_url)
          }
          if (pathsToRemove.length > 0) {
          await supabase.storage
            .from('media')
            .remove(pathsToRemove)
            .catch(() => {
              // Ignore cleanup errors
            })
          }
        }

      } else if (mediaTab === 'audio') {
        if (!isAudioValid) {
          setError('Please enter a valid audio URL and wait for the preview to load.')
          setSaving(false)
          return
        }

        const audioData = audioWorkFieldsRef.current?.getAudioData()
        if (!audioData) {
          setError('Please enter a valid audio URL and wait for the preview to load.')
          setSaving(false)
          return
        }

        // Update database
        const { error: updateError } = await supabase
          .from('artworks_min')
          .update({
            title: sanitizeAndTrim(title),
            description: sanitizeAndTrim(description),
            media_type: 'audio',
            media_source: audioData.mediaSource,
            src_url: audioData.url,
            thumb_url: null,
          })
          .eq('id', work.id)

        if (updateError) {
          throw new Error(`Failed to update work: ${updateError.message}`)
        }

        // Attempt to remove old image if previous media was an uploaded image
        if (work.media_source === 'upload') {
          const pathsToRemove: string[] = []
          if (work.thumb_url && work.thumb_url.startsWith('artworks/')) {
            pathsToRemove.push(work.thumb_url)
          }
          if (work.src_url && work.src_url.startsWith('artworks/') && work.src_url !== work.thumb_url) {
            pathsToRemove.push(work.src_url)
          }
          if (pathsToRemove.length > 0) {
            await supabase.storage
              .from('media')
              .remove(pathsToRemove)
              .catch(() => {
                // Ignore cleanup errors
              })
          }
        }
      }

      // Revalidate cache
      if (profile.handle) {
        await revalidateCache({
          handle: profile.handle,
          artistId: profile.id,
          tags: [`artist:${profile.handle}`, `artist-works:${profile.id}`],
        })
      }

      // Success
      setToastMessage('Work updated successfully!')
      setShowToast(true)
      setHasUnsavedChanges(false)
      onSuccess?.()
      setTimeout(() => {
        handleCancel()
      }, 1500)
    } catch (err) {
      console.error('Error saving work:', err)
      // Ensure error doesn't break the component
      try {
        setError(err instanceof Error ? err.message : 'Failed to save work. Please try again.')
      } catch (errorStateErr) {
        console.error('Error setting error state:', errorStateErr)
        // Fallback - show error in console
        alert('Failed to save work. Please try again.')
      }
    } finally {
      try {
        setSaving(false)
      } catch (finallyErr) {
        console.error('Error in finally block:', finallyErr)
      }
    }
  }

  const handleDelete = async () => {
    try {
      setDeleting(true)
      setError(null)

      // If it's an uploaded image, attempt to remove from storage
      if (work.media_source === 'upload') {
        const pathsToRemove: string[] = []
        if (work.thumb_url && work.thumb_url.startsWith('artworks/')) {
          pathsToRemove.push(work.thumb_url)
        }
        if (work.src_url && work.src_url.startsWith('artworks/') && work.src_url !== work.thumb_url) {
          pathsToRemove.push(work.src_url)
        }

        if (pathsToRemove.length > 0) {
          await supabase.storage
            .from('media')
            .remove(pathsToRemove)
            .catch(() => {
              // Ignore cleanup errors
            })
        }
      }

      // Delete from database
      const { error: deleteError } = await supabase
        .from('artworks_min')
        .delete()
        .eq('id', work.id)

      if (deleteError) {
        throw new Error(`Failed to delete work: ${deleteError.message}`)
      }

      // Revalidate cache
      if (profile.handle) {
        await revalidateCache({
          handle: profile.handle,
          artistId: profile.id,
          tags: [`artist:${profile.handle}`, `artist-works:${profile.id}`],
        })
      }

      // Success
      setToastMessage('Work deleted successfully!')
      setShowToast(true)
      setHasUnsavedChanges(false)
      onSuccess?.()
      setTimeout(() => {
        handleCancel()
      }, 1500)
    } catch (err) {
      console.error('Error deleting work:', err)
      setError(err instanceof Error ? err.message : 'Failed to delete work. Please try again.')
    } finally {
      setDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  const handleCancel = () => {
    // Clear child components
    imageWorkFieldsRef.current?.clear()
    videoWorkFieldsRef.current?.clear()
    audioWorkFieldsRef.current?.clear()

    // Reset state
    setTitle(work.title)
    setDescription(work.description || '')
    setMediaTab(work.media_type)
    setIsImageValid(false)
    setIsVideoValid(false)
    setIsAudioValid(false)
    setHasUnsavedChanges(false)
    setError(null)
    setShowDiscardConfirm(false)
    setShowDeleteConfirm(false)

    onClose()
  }

  const handleCloseClick = () => {
    if (hasUnsavedChanges) {
      setShowDiscardConfirm(true)
    } else {
      handleCancel()
    }
  }

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true)
  }

  // Check if there are any changes
  const hasChanges = () => {
    const titleChanged = title.trim() !== originalTitle.trim()
    const descriptionChanged = description.trim() !== originalDescription.trim()
    const mediaTypeChanged = mediaTab !== originalMediaType
    
    // Check if media URL changed
    let mediaUrlChanged = false
    if (mediaTab === 'video') {
      // Get current URL directly from the component (regardless of validity)
      const currentUrl = videoWorkFieldsRef.current?.getCurrentUrl() || ''
      // If switching to video tab, any URL entry is a change
      // If already on video, check if URL changed
      if (originalMediaType !== 'video') {
        // Switching to video - any valid URL entry is a change
        // Use isVideoValid to detect if user has entered and validated a URL
        mediaUrlChanged = isVideoValid
      } else {
        // Already video - check if URL changed (compare trimmed URLs)
        const trimmedCurrent = currentUrl.trim()
        const trimmedOriginal = (originalMediaUrl || '').trim()
        mediaUrlChanged = trimmedCurrent !== trimmedOriginal && trimmedCurrent !== ''
      }
    } else if (mediaTab === 'audio') {
      // Get current URL directly from the component (regardless of validity)
      const currentUrl = audioWorkFieldsRef.current?.getCurrentUrl() || ''
      // If switching to audio tab, any URL entry is a change
      // If already on audio, check if URL changed
      if (originalMediaType !== 'audio') {
        // Switching to audio - any valid URL entry is a change
        // Use isAudioValid to detect if user has entered and validated a URL
        mediaUrlChanged = isAudioValid
      } else {
        // Already audio - check if URL changed (compare trimmed URLs)
        const trimmedCurrent = currentUrl.trim()
        const trimmedOriginal = (originalMediaUrl || '').trim()
        mediaUrlChanged = trimmedCurrent !== trimmedOriginal && trimmedCurrent !== ''
      }
    } else if (mediaTab === 'image') {
      // For images, if isImageValid is true, a new image was selected
      // If originalMediaType is image and isImageValid is false, keeping existing image
      if (originalMediaType === 'image') {
        mediaUrlChanged = isImageValid // New image selected
      } else {
        // Changing to image - must have valid new image
        mediaUrlChanged = isImageValid
      }
    }
    
    return titleChanged || descriptionChanged || mediaTypeChanged || mediaUrlChanged
  }

  const canSave = () => {
    // Must have changes to save
    if (!hasChanges()) {
      return false
    }

    // Validate title and description
    if (!title.trim() || title.length > 200) return false
    if (!description.trim() || description.length > 500) return false

    // Validate media based on current tab
    if (mediaTab === 'image') {
      // If changing media type to image, must have valid new image
      if (originalMediaType !== 'image') {
        return isImageValid
      }
      // If keeping image type but selected new image, must be valid
      if (isImageValid) {
        return true // New image selected and valid
      }
      // Keeping existing image, just updating title/description - valid (no media change)
      return true
    } else if (mediaTab === 'video') {
      // Check if video URL changed - use getCurrentUrl to get URL regardless of validity
      const currentUrl = videoWorkFieldsRef.current?.getCurrentUrl() || ''
      const trimmedCurrent = currentUrl.trim()
      const trimmedOriginal = (originalMediaUrl || '').trim()
      const videoUrlChanged = trimmedCurrent !== trimmedOriginal
      
      // If keeping same video URL and same media type, consider valid (no need to re-validate preview)
      if (originalMediaType === 'video' && !videoUrlChanged && trimmedCurrent !== '') {
        return true
      }
      
      // New/changed video - must have valid video (validation + preview ready)
      return isVideoValid
    } else if (mediaTab === 'audio') {
      // Check if audio URL changed - use getCurrentUrl to get URL regardless of validity
      const currentUrl = audioWorkFieldsRef.current?.getCurrentUrl() || ''
      const trimmedCurrent = currentUrl.trim()
      const trimmedOriginal = (originalMediaUrl || '').trim()
      const audioUrlChanged = trimmedCurrent !== trimmedOriginal
      
      // If keeping same audio URL and same media type, consider valid (no need to re-validate preview)
      if (originalMediaType === 'audio' && !audioUrlChanged && trimmedCurrent !== '') {
        return true
      }
      
      // New/changed audio - must have valid audio (validation + preview ready)
      return isAudioValid
    } else {
      return false
    }
  }

  const getMediaTypeLabel = () => {
    switch (work.media_type) {
      case 'image':
        return 'Image'
      case 'video':
        return 'Video'
      case 'audio':
        return 'Audio'
      default:
        return 'Unknown'
    }
  }

  return (
    <>
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
          <h2 className="text-xl font-semibold text-gray-900">Edit Work</h2>
          <button
              onClick={handleCloseClick}
              disabled={saving || deleting}
              className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="space-y-6">
              {/* Media Type Badge */}
            <div>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                  Media Type: {getMediaTypeLabel()}
                </span>
            </div>

            {/* Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                Work Title *
              </label>
              <input
                id="title"
                type="text"
                  value={title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="Enter a descriptive title for your work"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sunroad-amber-500 focus:border-transparent"
                  maxLength={200}
                  disabled={saving || deleting}
              />
                <p className="text-xs text-gray-500 mt-1">{title.length}/200 characters</p>
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
              </label>
              <textarea
                id="description"
                  value={description}
                  onChange={(e) => handleDescriptionChange(e.target.value)}
                rows={4}
                placeholder="Describe your work, the inspiration behind it, techniques used, etc."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sunroad-amber-500 focus:border-transparent resize-none"
                  maxLength={500}
                  disabled={saving || deleting}
              />
              <div className="flex justify-between items-center mt-2">
                  <p className={`text-xs ${description.length > 500 ? 'text-red-600' : 'text-gray-500'}`}>
                    {description.length}/500 characters
                </p>
              </div>
            </div>

              {/* Current Media Preview */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Media
                      </label>
                <div className="relative w-full h-48 rounded-lg overflow-hidden bg-gray-100">
                  <MediaPreview work={work} variant="modal" />
                      </div>
                    </div>

              {/* Media Type Tabs */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Change Media Type *
              </label>
                <div className="flex gap-2 border-b border-gray-200">
                  <button
                    type="button"
                    onClick={() => {
                      videoWorkFieldsRef.current?.clear()
                      audioWorkFieldsRef.current?.clear()
                      setMediaTab('image')
                      setIsVideoValid(false)
                      setIsAudioValid(false)
                    }}
                      disabled={saving || deleting}
                    className={`px-4 py-2 text-sm font-medium transition-colors ${
                      mediaTab === 'image'
                        ? 'border-b-2 border-sunroad-amber-600 text-sunroad-amber-600'
                        : 'text-gray-600 hover:text-gray-900'
                    } disabled:opacity-50`}
                  >
                    Image
                  </button>
                          <button
                            type="button"
                    onClick={() => {
                      imageWorkFieldsRef.current?.clear()
                      audioWorkFieldsRef.current?.clear()
                      setMediaTab('video')
                      setIsImageValid(false)
                      setIsAudioValid(false)
                    }}
                            disabled={saving || deleting}
                    className={`px-4 py-2 text-sm font-medium transition-colors ${
                      mediaTab === 'video'
                        ? 'border-b-2 border-sunroad-amber-600 text-sunroad-amber-600'
                        : 'text-gray-600 hover:text-gray-900'
                    } disabled:opacity-50`}
                          >
                    Video
                          </button>
                  <button
                    type="button"
                    onClick={() => {
                      imageWorkFieldsRef.current?.clear()
                      videoWorkFieldsRef.current?.clear()
                      setMediaTab('audio')
                      setIsImageValid(false)
                      setIsVideoValid(false)
                    }}
                            disabled={saving || deleting}
                    className={`px-4 py-2 text-sm font-medium transition-colors ${
                      mediaTab === 'audio'
                        ? 'border-b-2 border-sunroad-amber-600 text-sunroad-amber-600'
                        : 'text-gray-600 hover:text-gray-900'
                    } disabled:opacity-50`}
                  >
                    Sound
                          </button>
                        </div>
                        </div>

              {/* Media Content */}
              {mediaTab === 'image' && (
                <ImageWorkFields
                  ref={imageWorkFieldsRef}
                  saving={saving || deleting}
                  profileId={profile.id}
                  onChangeValidity={handleImageValidityChange}
                  onClear={() => setIsImageValid(false)}
                />
              )}

              {mediaTab === 'video' && (
                <VideoWorkFields
                  key={`video-${mediaTab}`}
                  ref={videoWorkFieldsRef}
                  saving={saving || deleting}
                  onChangeValidity={handleVideoValidityChange}
                  onClear={() => setIsVideoValid(false)}
                  initialUrl={work.media_type === 'video' ? work.src_url ?? '' : ''}
                  initialMediaSource={
                    work.media_type === 'video' && (work.media_source === 'youtube' || work.media_source === 'vimeo' || work.media_source === 'mux' || work.media_source === 'other_url')
                      ? work.media_source
                      : undefined
                  }
                />
              )}

              {mediaTab === 'audio' && (
                <AudioWorkFields
                  key={`audio-${mediaTab}`}
                  ref={audioWorkFieldsRef}
                  saving={saving || deleting}
                  onChangeValidity={handleAudioValidityChange}
                  onClear={() => setIsAudioValid(false)}
                  initialUrl={work.media_type === 'audio' ? work.src_url ?? '' : ''}
                  initialMediaSource={
                    work.media_type === 'audio' && (work.media_source === 'spotify' || work.media_source === 'soundcloud')
                      ? work.media_source
                      : undefined
                  }
                />
              )}

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-sm text-red-800">{error}</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t border-gray-200 sticky bottom-0 bg-white">
          <button
              onClick={handleDeleteClick}
              disabled={saving || deleting}
              className="px-4 py-2 text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {deleting ? (
                <>
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Deleting...</span>
                </>
              ) : (
                'Delete Work'
              )}
          </button>
          <div className="flex gap-3">
            <button
                onClick={handleCloseClick}
                disabled={saving || deleting}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
                disabled={!canSave() || saving || deleting}
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
      </div>

      {/* Discard Changes Confirmation Modal */}
      <ConfirmDialog
        isOpen={showDiscardConfirm}
        title="Discard Changes?"
        message="You have unsaved changes. Are you sure you want to close without saving?"
        confirmLabel="Discard Changes"
        cancelLabel="Keep Editing"
        confirmVariant="danger"
        onConfirm={handleCancel}
        onCancel={() => setShowDiscardConfirm(false)}
        isLoading={saving || deleting}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Delete Work?"
        message="Are you sure you want to delete this work? This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        confirmVariant="danger"
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
        isLoading={deleting}
        loadingLabel="Deleting..."
      />

      <Toast
        message={toastMessage}
        isVisible={showToast}
        onClose={() => setShowToast(false)}
      />
    </>
  )
}
