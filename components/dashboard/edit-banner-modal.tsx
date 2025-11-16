'use client'

import { useState } from 'react'
import Image from 'next/image'
import { getMediaUrl } from '@/lib/media'

interface EditBannerModalProps {
  isOpen: boolean
  onClose: () => void
  currentBanner?: string
}

export default function EditBannerModal({ isOpen, onClose, currentBanner }: EditBannerModalProps) {
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
    console.log('Saving banner:', selectedFile)
    onClose()
  }

  const handleCancel = () => {
    setSelectedFile(null)
    setPreviewUrl(null)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Edit Banner Image</h2>
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
          {/* Current Banner Preview */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Current Banner
            </label>
            <div className="relative h-32 rounded-lg overflow-hidden bg-gray-100">
              {(() => {
                const bannerSrc = getMediaUrl(currentBanner);
                return bannerSrc ? (
                  <Image
                    src={bannerSrc}
                    alt="Current banner"
                    fill
                    className="object-cover"
                  />
                ) : null;
              })()}
            </div>
          </div>

          {/* File Upload */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload New Banner
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-sunroad-amber-400 transition-colors">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
                id="banner-upload"
              />
              <label
                htmlFor="banner-upload"
                className="cursor-pointer flex flex-col items-center"
              >
                <svg className="w-8 h-8 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <span className="text-sm text-gray-600">
                  {selectedFile ? selectedFile.name : 'Click to upload or drag and drop'}
                </span>
                <span className="text-xs text-gray-500 mt-1">PNG, JPG, GIF up to 10MB</span>
              </label>
            </div>
          </div>

          {/* Preview */}
          {previewUrl && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Preview
              </label>
              <div className="relative h-32 rounded-lg overflow-hidden bg-gray-100">
                <Image
                  src={previewUrl}
                  alt="Banner preview"
                  fill
                  className="object-cover"
                />
              </div>
            </div>
          )}

          {/* Guidelines */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
            <h3 className="text-sm font-medium text-amber-800 mb-2">Banner Guidelines</h3>
            <ul className="text-xs text-amber-700 space-y-1">
              <li>• Recommended size: 1200x400 pixels</li>
              <li>• Use high-quality images for best results</li>
              <li>• Avoid text-heavy images as they may be hard to read</li>
              <li>• Consider how your profile picture will look over the banner</li>
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
