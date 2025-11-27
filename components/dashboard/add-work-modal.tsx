'use client'

import React, { useState, useCallback, useRef, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { UserProfile } from '@/hooks/use-user-profile'
import Toast from '@/components/ui/toast'
import { sanitizeAndTrim } from '@/lib/utils/sanitize'
import { ImageWorkFields, type ImageWorkFieldsHandle } from './works/image-work-fields'
import { VideoWorkFields, type VideoWorkFieldsHandle } from './works/video-work-fields'
import { AudioWorkFields, type AudioWorkFieldsHandle } from './works/audio-work-fields'

interface AddWorkModalProps {
  isOpen: boolean
  onClose: () => void
  profile: UserProfile
  onSuccess?: () => void
}

type MediaTab = 'image' | 'video' | 'audio'

export default function AddWorkModal({ isOpen, onClose, profile, onSuccess }: AddWorkModalProps) {
  // Form state
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [mediaTab, setMediaTab] = useState<MediaTab>('image')

  // Media validity state
  const [isImageValid, setIsImageValid] = useState(false)
  const [isVideoValid, setIsVideoValid] = useState(false)
  const [isAudioValid, setIsAudioValid] = useState(false)

  // General state
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [showToast, setShowToast] = useState(false)

  // Refs for child components
  const imageWorkFieldsRef = useRef<ImageWorkFieldsHandle>(null)
  const videoWorkFieldsRef = useRef<VideoWorkFieldsHandle>(null)
  const audioWorkFieldsRef = useRef<AudioWorkFieldsHandle>(null)

  const supabase = useMemo(() => createClient(), [])

  if (!isOpen) return null

  const handleSave = async () => {
    // Validate title and description
    if (!title.trim() || title.length > 200) {
      setError('Title is required and must be 200 characters or less.')
      return
    }

    if (!description.trim() || description.length > 500) {
      setError('Description is required and must be 500 characters or less.')
      return
    }

    try {
      setSaving(true)
      setError(null)

      if (mediaTab === 'image') {
        if (!isImageValid) {
          setError('Please upload an image and adjust the crop before saving.')
          setSaving(false)
          return
        }

        const imageData = await imageWorkFieldsRef.current?.getImageData()
        if (!imageData) {
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
          })

        if (uploadError) {
          throw new Error(`Upload failed: ${uploadError.message}`)
        }

        // Insert into database
        const { error: insertError } = await supabase
          .from('artworks_min')
          .insert({
            artist_id: profile.id,
            title: sanitizeAndTrim(title),
            description: sanitizeAndTrim(description),
            thumb_url: imageData.storagePath,
            src_url: imageData.storagePath,
            media_type: 'image',
            media_source: 'upload',
            visibility: 'public',
          })

        if (insertError) {
          // Attempt cleanup
          await supabase.storage
            .from('media')
            .remove([imageData.storagePath])
            .catch(() => {})
          throw new Error(`Failed to save work: ${insertError.message}`)
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

        // Insert into database
        const { error: insertError } = await supabase
          .from('artworks_min')
          .insert({
            artist_id: profile.id,
            title: sanitizeAndTrim(title),
            description: sanitizeAndTrim(description),
            thumb_url: null,
            src_url: videoData.url,
            media_type: 'video',
            media_source: videoData.mediaSource,
            visibility: 'public',
          })

        if (insertError) {
          throw new Error(`Failed to save work: ${insertError.message}`)
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

        // Insert into database
        const { error: insertError } = await supabase
          .from('artworks_min')
          .insert({
            artist_id: profile.id,
            title: sanitizeAndTrim(title),
            description: sanitizeAndTrim(description),
            thumb_url: null,
            src_url: audioData.url,
            media_type: 'audio',
            media_source: audioData.mediaSource,
            visibility: 'public',
          })

        if (insertError) {
          throw new Error(`Failed to save work: ${insertError.message}`)
        }
      }

      // Revalidate cache
      if (profile.handle) {
        try {
          await fetch('/api/revalidate', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              handle: profile.handle,
              artistId: profile.id,
              tags: [`artist:${profile.handle}`, `artist-works:${profile.id}`],
            }),
          })
        } catch (revalidateError) {
          console.warn('Failed to revalidate cache:', revalidateError)
        }
      }

      // Success
      setShowToast(true)
      onSuccess?.()
      setTimeout(() => {
        handleCancel()
      }, 1500)
    } catch (err) {
      console.error('Error saving work:', err)
      setError(err instanceof Error ? err.message : 'Failed to save work. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    // Clear child components
    imageWorkFieldsRef.current?.clear()
    videoWorkFieldsRef.current?.clear()
    audioWorkFieldsRef.current?.clear()

    // Reset state
    setTitle('')
    setDescription('')
    setMediaTab('image')
    setIsImageValid(false)
    setIsVideoValid(false)
    setIsAudioValid(false)
    setError(null)
    onClose()
  }

  const canSave = () => {
    if (!title.trim() || title.length > 200) return false
    if (!description.trim() || description.length > 500) return false

    if (mediaTab === 'image') {
      return isImageValid
    } else if (mediaTab === 'video') {
      return isVideoValid
    } else if (mediaTab === 'audio') {
      return isAudioValid
    } else {
      return false
    }
  }

  return (
    <>
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
          <h2 className="text-xl font-semibold text-gray-900">Add New Work</h2>
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
          <div className="space-y-6">
            {/* Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                Work Title *
              </label>
              <input
                id="title"
                type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter a descriptive title for your work"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sunroad-amber-500 focus:border-transparent"
                  maxLength={200}
                  disabled={saving}
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
                  onChange={(e) => setDescription(e.target.value)}
                rows={4}
                placeholder="Describe your work, the inspiration behind it, techniques used, etc."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sunroad-amber-500 focus:border-transparent resize-none"
                  maxLength={500}
                  disabled={saving}
              />
              <div className="flex justify-between items-center mt-2">
                  <p className={`text-xs ${description.length > 500 ? 'text-red-600' : 'text-gray-500'}`}>
                    {description.length}/500 characters
                </p>
              </div>
            </div>

              {/* Media Type Tabs */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Media Type *
                </label>
                <div className="flex gap-2 border-b border-gray-200">
                  <button
                    type="button"
                    onClick={() => {
                      videoWorkFieldsRef.current?.clear()
                      audioWorkFieldsRef.current?.clear()
                      setMediaTab('image')
                    }}
                    disabled={saving}
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
                    }}
                    disabled={saving}
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
                    }}
                    disabled={saving}
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
                  saving={saving}
                  profileId={profile.id}
                  onChangeValidity={setIsImageValid}
                  onClear={() => setIsImageValid(false)}
                />
              )}

              {mediaTab === 'video' && (
                <VideoWorkFields
                  ref={videoWorkFieldsRef}
                  saving={saving}
                  onChangeValidity={setIsVideoValid}
                  onClear={() => setIsVideoValid(false)}
                />
              )}

              {mediaTab === 'audio' && (
                <AudioWorkFields
                  ref={audioWorkFieldsRef}
                  saving={saving}
                  onChangeValidity={setIsAudioValid}
                  onClear={() => setIsAudioValid(false)}
                />
              )}

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            {/* Guidelines */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <h3 className="text-sm font-medium text-amber-800 mb-2">Work Guidelines</h3>
              <ul className="text-xs text-amber-700 space-y-1">
                <li>• Use high-quality images that showcase your work well</li>
                <li>• Write descriptive titles that help people understand your work</li>
                <li>• Include details about medium, size, and creation process in description</li>
                <li>• Make sure you have rights to share the work</li>
              </ul>
            </div>
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
              disabled={!canSave() || saving}
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
                'Add Work'
              )}
          </button>
        </div>
      </div>
    </div>

      <Toast
        message="Work added successfully!"
        isVisible={showToast}
        onClose={() => setShowToast(false)}
      />
    </>
  )
}
