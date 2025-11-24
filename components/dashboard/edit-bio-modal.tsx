'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { UserProfile } from '@/hooks/use-user-profile'

interface EditBioModalProps {
  isOpen: boolean
  onClose: () => void
  currentBio: string
  profile: UserProfile
  onSuccess?: (nextBio: string) => void
}

export default function EditBioModal({ isOpen, onClose, currentBio, profile, onSuccess }: EditBioModalProps) {
  const [bio, setBio] = useState(currentBio)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Reset state when modal opens/closes or currentBio changes
  useEffect(() => {
    if (isOpen) {
      setBio(currentBio)
      setError(null)
    }
  }, [isOpen, currentBio])

  if (!isOpen) return null

  const handleSave = async () => {
    // Validation
    if (bio.length > 800) {
      setError('Bio must be 800 characters or less.')
      return
    }

    // Check if unchanged
    if (bio === currentBio) {
      onClose()
      return
    }

    try {
      setSaving(true)
      setError(null)

      const supabase = createClient()

      const { error: updateError } = await supabase
        .from('artists_min')
        .update({ bio: bio.trim() || null })
        .eq('id', profile.id)

      if (updateError) {
        throw new Error(updateError.message)
      }

      // Success - call onSuccess and close
      if (onSuccess) {
        onSuccess(bio.trim() || '')
      }
      onClose()
    } catch (err) {
      console.error('Error saving bio:', err)
      setError(err instanceof Error ? err.message : 'Failed to save bio. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setBio(currentBio)
    setError(null)
    onClose()
  }

  const hasChanges = bio !== currentBio
  const isValid = bio.length <= 800

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Edit Bio</h2>
          <button
            onClick={handleCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="mb-4">
            <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-2">
              About You
            </label>
            <textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sunroad-amber-500 focus:border-transparent resize-none"
              placeholder="Tell people about yourself, your art, and what inspires you..."
            />
            <div className="flex justify-between items-center mt-2">
              <p className={`text-xs ${bio.length > 800 ? 'text-red-600' : 'text-gray-500'}`}>
                {bio.length}/800 characters
              </p>
              <p className={`text-xs ${bio.length > 800 ? 'text-red-600' : 'text-gray-500'}`}>
                {800 - bio.length} remaining
              </p>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Tips */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-blue-800 mb-2">Bio Tips</h3>
            <ul className="text-xs text-blue-700 space-y-1">
              <li>• Share your artistic journey and inspiration</li>
              <li>• Mention your preferred mediums and techniques</li>
              <li>• Include any notable achievements or exhibitions</li>
              <li>• Keep it personal and authentic</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
          <button
            onClick={handleCancel}
            disabled={saving}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!isValid || !hasChanges || saving}
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
  )
}
