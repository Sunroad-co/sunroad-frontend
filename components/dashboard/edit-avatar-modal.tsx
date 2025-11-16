'use client'

import { useState } from 'react'
import Image from 'next/image'
import { getMediaUrl } from '@/lib/media'

interface EditAvatarModalProps {
  isOpen: boolean
  onClose: () => void
  currentAvatar?: string | null
}

export default function EditAvatarModal({ isOpen, onClose, currentAvatar }: EditAvatarModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  if (!isOpen) return null

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
    }
  }

  const handleSave = () => {
    // TODO: Implement save logic
    console.log('Saving avatar:', selectedFile)
    onClose()
  }

  const handleCancel = () => {
    setSelectedFile(null)
    setPreviewUrl(null)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Edit Profile Picture</h2>
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
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload New Picture
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-sunroad-amber-400 transition-colors">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
                id="avatar-upload"
              />
              <label
                htmlFor="avatar-upload"
                className="cursor-pointer flex flex-col items-center"
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

          {/* Preview */}
          {previewUrl && (
            <div className="mb-6 text-center">
              <label className="block text-sm font-medium text-gray-700 mb-4">
                Preview
              </label>
              <div className="relative w-24 h-24 mx-auto rounded-full overflow-hidden bg-gray-100 border-4 border-white shadow-lg">
                <Image
                  src={previewUrl}
                  alt="Avatar preview"
                  width={96}
                  height={96}
                  className="w-full h-full object-cover"
                />
              </div>
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
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
          <button
            onClick={handleCancel}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!selectedFile}
            className="px-4 py-2 bg-sunroad-amber-600 text-white rounded-lg hover:bg-sunroad-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  )
}
