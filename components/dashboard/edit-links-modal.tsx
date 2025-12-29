'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { UserProfile } from '@/hooks/use-user-profile'
import { revalidateCache } from '@/lib/revalidate-client'

interface EditLinksModalProps {
  isOpen: boolean
  onClose: () => void
  currentLinks: {
    website?: string
    instagram?: string
    facebook?: string
  }
  profile: UserProfile
  onSuccess?: () => void
}

export default function EditLinksModal({ isOpen, onClose, currentLinks, profile, onSuccess }: EditLinksModalProps) {
  const [links, setLinks] = useState({
    website: currentLinks.website || '',
    instagram: currentLinks.instagram || '',
    facebook: currentLinks.facebook || ''
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Reset state when modal opens/closes or currentLinks changes
  useEffect(() => {
    if (isOpen) {
      setLinks({
        website: currentLinks.website || '',
        instagram: currentLinks.instagram || '',
        facebook: currentLinks.facebook || ''
      })
      setError(null)
    }
  }, [isOpen, currentLinks])

  if (!isOpen) return null

  const handleSave = async () => {
    // Check if unchanged
    const hasChanges = 
      links.website !== (currentLinks.website || '') ||
      links.instagram !== (currentLinks.instagram || '') ||
      links.facebook !== (currentLinks.facebook || '')

    if (!hasChanges) {
      onClose()
      return
    }

    // Validate URLs if provided
    const urlPattern = /^https?:\/\/.+/i
    if (links.website && !urlPattern.test(links.website)) {
      setError('Website URL must start with http:// or https://')
      return
    }
    if (links.instagram && !urlPattern.test(links.instagram)) {
      setError('Instagram URL must start with http:// or https://')
      return
    }
    if (links.facebook && !urlPattern.test(links.facebook)) {
      setError('Facebook URL must start with http:// or https://')
      return
    }

    try {
      setSaving(true)
      setError(null)

      const supabase = createClient()

      const { error: updateError } = await supabase
        .from('artists_min')
        .update({
          website_url: links.website.trim() || null,
          instagram_url: links.instagram.trim() || null,
          facebook_url: links.facebook.trim() || null,
        })
        .eq('id', profile.id)

      if (updateError) {
        throw new Error(updateError.message)
      }

      // Revalidate the artist profile page cache
      if (profile.handle) {
        await revalidateCache({
          handle: profile.handle,
          artistId: profile.id,
          tags: [`artist:${profile.handle}`, `artist-works:${profile.id}`],
        })
      }

      // Success - call onSuccess and close
      if (onSuccess) {
        onSuccess()
      }
      onClose()
    } catch (err) {
      console.error('Error saving links:', err)
      setError(err instanceof Error ? err.message : 'Failed to save links. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setLinks({
      website: currentLinks.website || '',
      instagram: currentLinks.instagram || '',
      facebook: currentLinks.facebook || ''
    })
    setError(null)
    onClose()
  }

  const hasChanges = 
    links.website !== (currentLinks.website || '') ||
    links.instagram !== (currentLinks.instagram || '') ||
    links.facebook !== (currentLinks.facebook || '')

  const handleLinkChange = (platform: keyof typeof links, value: string) => {
    setLinks(prev => ({
      ...prev,
      [platform]: value
    }))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Edit Social Links</h2>
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
          <div className="space-y-6">
            {/* Website */}
            <div>
              <label htmlFor="website" className="block text-sm font-medium text-gray-700 mb-2">
                Website
              </label>
              <div className="flex items-center">
                <div className="flex-shrink-0 w-10 h-10 bg-amber-800 text-white rounded-l-lg flex items-center justify-center">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8m7.5-6.923c-.67.204-1.335.82-1.887 1.855A8 8 0 0 0 5.145 4H7.5zM4.09 4a9.3 9.3 0 0 1 .64-1.539 7 7 0 0 1 .597-.933A7.03 7.03 0 0 0 2.255 4zm-.582 3.5c.03-.877.138-1.718.312-2.5H1.674a7 7 0 0 0-.656 2.5zM4.847 5a12.5 12.5 0 0 0-.338 2.5H7.5V5zM8.5 5v2.5h2.99a12.5 12.5 0 0 0-.337-2.5zM4.51 8.5a12.5 12.5 0 0 0 .337 2.5H7.5V8.5zm3.99 0V11h2.653c.187-.765.306-1.608.338-2.5zM5.145 12q.208.58.468 1.068c.552 1.035 1.218 1.65 1.887 1.855V12zm.182 2.472a7 7 0 0 1-.597-.933A9.3 9.3 0 0 1 4.09 12H2.255a7 7 0 0 0 3.072 2.472" />
                  </svg>
                </div>
                <input
                  id="website"
                  type="url"
                  value={links.website}
                  onChange={(e) => handleLinkChange('website', e.target.value)}
                  placeholder="https://yourwebsite.com"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-r-lg focus:outline-none focus:ring-2 focus:ring-sunroad-amber-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Instagram */}
            <div>
              <label htmlFor="instagram" className="block text-sm font-medium text-gray-700 mb-2">
                Instagram
              </label>
              <div className="flex items-center">
                <div className="flex-shrink-0 w-10 h-10 bg-amber-800 text-white rounded-l-lg flex items-center justify-center">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M7 2C4.2 2 2 4.2 2 7v10c0 2.8 2.2 5 5 5h10c2.8 0 5-2.2 5-5V7c0-2.8-2.2-5-5-5H7zm10 2c1.6 0 3 1.4 3 3v10c0 1.6-1.4 3-3 3H7c-1.6 0-3-1.4-3-3V7c0-1.6 1.4-3 3-3h10zm-5 3a5 5 0 100 10 5 5 0 000-10zm0 2a3 3 0 110 6 3 3 0 010-6zm4.8-2.9a1.1 1.1 0 100 2.2 1.1 1.1 0 000-2.2z"/>
                  </svg>
                </div>
                <input
                  id="instagram"
                  type="url"
                  value={links.instagram}
                  onChange={(e) => handleLinkChange('instagram', e.target.value)}
                  placeholder="https://instagram.com/yourusername"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-r-lg focus:outline-none focus:ring-2 focus:ring-sunroad-amber-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Facebook */}
            <div>
              <label htmlFor="facebook" className="block text-sm font-medium text-gray-700 mb-2">
                Facebook
              </label>
              <div className="flex items-center">
                <div className="flex-shrink-0 w-10 h-10 bg-amber-800 text-white rounded-l-lg flex items-center justify-center">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M22 12a10 10 0 10-11.5 9.9v-7h-2v-3h2v-2.3c0-2 1.2-3.1 3-3.1.9 0 1.8.1 1.8.1v2h-1c-1 0-1.3.6-1.3 1.2V12h2.2l-.4 3h-1.8v7A10 10 0 0022 12"/>
                  </svg>
                </div>
                <input
                  id="facebook"
                  type="url"
                  value={links.facebook}
                  onChange={(e) => handleLinkChange('facebook', e.target.value)}
                  placeholder="https://facebook.com/yourusername"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-r-lg focus:outline-none focus:ring-2 focus:ring-sunroad-amber-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Tips */}
          <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-green-800 mb-2">Link Tips</h3>
            <ul className="text-xs text-green-700 space-y-1">
              <li>• Use full URLs (https://) for all links</li>
              <li>• Make sure your profiles are public and accessible</li>
              <li>• Keep your social media profiles updated</li>
              <li>• You can leave fields empty if you don&apos;t use that platform</li>
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
            disabled={!hasChanges || saving}
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
