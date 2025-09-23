'use client'

import { useState } from 'react'

interface EditBioModalProps {
  isOpen: boolean
  onClose: () => void
  currentBio: string
}

export default function EditBioModal({ isOpen, onClose, currentBio }: EditBioModalProps) {
  const [bio, setBio] = useState(currentBio)

  if (!isOpen) return null

  const handleSave = () => {
    // TODO: Implement save logic
    console.log('Saving bio:', bio)
    onClose()
  }

  const handleCancel = () => {
    setBio(currentBio)
    onClose()
  }

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
              <p className="text-xs text-gray-500">
                {bio.length}/500 characters
              </p>
              <p className="text-xs text-gray-500">
                {500 - bio.length} remaining
              </p>
            </div>
          </div>

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
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={bio.length > 500}
            className="px-4 py-2 bg-sunroad-amber-600 text-white rounded-lg hover:bg-sunroad-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  )
}
