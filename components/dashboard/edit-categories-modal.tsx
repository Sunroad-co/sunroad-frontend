'use client'

import { useState } from 'react'

interface EditCategoriesModalProps {
  isOpen: boolean
  onClose: () => void
  currentCategories: string[]
}

const AVAILABLE_CATEGORIES = [
  'Painting', 'Digital Art', 'Photography', 'Sculpture', 'Drawing', 'Mixed Media',
  'Ceramics', 'Textiles', 'Printmaking', 'Installation', 'Performance', 'Video Art',
  'Graphic Design', 'Illustration', 'Street Art', 'Abstract', 'Realism', 'Portrait',
  'Landscape', 'Still Life', 'Conceptual', 'Contemporary', 'Traditional', 'Experimental'
]

export default function EditCategoriesModal({ isOpen, onClose, currentCategories }: EditCategoriesModalProps) {
  const [selectedCategories, setSelectedCategories] = useState<string[]>(currentCategories)

  if (!isOpen) return null

  const handleCategoryToggle = (category: string) => {
    setSelectedCategories(prev => 
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    )
  }

  const handleSave = () => {
    // TODO: Implement save logic
    console.log('Saving categories:', selectedCategories)
    onClose()
  }

  const handleCancel = () => {
    setSelectedCategories(currentCategories)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Edit Categories</h2>
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
            <p className="text-sm text-gray-600 mb-4">
              Select the categories that best describe your artistic work. You can choose multiple categories.
            </p>
            
            {/* Selected Categories */}
            {selectedCategories.length > 0 && (
              <div className="mb-4">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Selected Categories</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedCategories.map((category) => (
                    <span
                      key={category}
                      className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 text-xs font-medium px-3 py-1 rounded-full"
                    >
                      {category}
                      <button
                        onClick={() => handleCategoryToggle(category)}
                        className="ml-1 text-amber-600 hover:text-amber-800"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Available Categories */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">Available Categories</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {AVAILABLE_CATEGORIES.map((category) => (
                  <button
                    key={category}
                    onClick={() => handleCategoryToggle(category)}
                    className={`
                      px-3 py-2 text-sm rounded-lg border transition-colors text-left
                      ${selectedCategories.includes(category)
                        ? 'bg-amber-50 border-amber-200 text-amber-800'
                        : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                      }
                    `}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Tips */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-blue-800 mb-2">Category Tips</h3>
            <ul className="text-xs text-blue-700 space-y-1">
              <li>• Choose categories that accurately represent your work</li>
              <li>• You can select up to 5 categories</li>
              <li>• Categories help people discover your work</li>
              <li>• You can change these anytime</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200">
          <div className="text-sm text-gray-500">
            {selectedCategories.length} of 5 categories selected
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleCancel}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={selectedCategories.length === 0}
              className="px-4 py-2 bg-sunroad-amber-600 text-white rounded-lg hover:bg-sunroad-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
