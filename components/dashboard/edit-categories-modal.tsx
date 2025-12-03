'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { UserProfile } from '@/hooks/use-user-profile'
import { Skeleton } from '@/components/ui/skeleton'

interface Category {
  id: number
  name: string
}

interface EditCategoriesModalProps {
  isOpen: boolean
  onClose: () => void
  profile: UserProfile
  currentCategoryIds: number[]
  onSuccess?: (nextCategoryIds: number[]) => void
}

export default function EditCategoriesModal({ 
  isOpen, 
  onClose, 
  profile, 
  currentCategoryIds,
  onSuccess 
}: EditCategoriesModalProps) {
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>(currentCategoryIds)
  const [availableCategories, setAvailableCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [maxLimitError, setMaxLimitError] = useState(false)

  // Fetch categories and current category IDs when modal opens
  useEffect(() => {
    if (!isOpen) return

    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)
        const supabase = createClient()

        // Fetch all available categories
        const { data: categoriesData, error: categoriesError } = await supabase
          .from('categories')
          .select('id, name')
          .order('name', { ascending: true })

        if (categoriesError) {
          throw new Error(categoriesError.message)
        }

        setAvailableCategories(categoriesData || [])

        // Fetch current category IDs for this artist
        const { data: artistCategoriesData, error: artistCategoriesError } = await supabase
          .from('artist_categories')
          .select('category_id')
          .eq('artist_id', profile.id)

        if (artistCategoriesError) {
          throw new Error(artistCategoriesError.message)
        }

        const fetchedCategoryIds = artistCategoriesData?.map((ac: { category_id: number }) => ac.category_id) || []
        setSelectedCategoryIds(fetchedCategoryIds)
      } catch (err) {
        console.error('Error fetching categories:', err)
        setError(err instanceof Error ? err.message : 'Failed to load categories. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [isOpen, profile.id])

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedCategoryIds(currentCategoryIds)
      setError(null)
      setMaxLimitError(false)
    }
  }, [isOpen, currentCategoryIds])

  if (!isOpen) return null

  const handleCategoryToggle = (categoryId: number) => {
    setMaxLimitError(false)
    
    setSelectedCategoryIds(prev => {
      if (prev.includes(categoryId)) {
        // Remove category
        return prev.filter(id => id !== categoryId)
      } else {
        // Add category - check max limit
        if (prev.length >= 5) {
          setMaxLimitError(true)
          // Clear error after 3 seconds
          setTimeout(() => setMaxLimitError(false), 3000)
          return prev
        }
        return [...prev, categoryId]
      }
    })
  }

  const getCategoryName = (categoryId: number): string => {
    const category = availableCategories.find(c => c.id === categoryId)
    return category?.name || `Category ${categoryId}`
  }

  const handleSave = async () => {
    // Check if unchanged
    const originalSet = new Set(currentCategoryIds)
    const nextSet = new Set(selectedCategoryIds)
    const hasChanges = 
      currentCategoryIds.length !== selectedCategoryIds.length ||
      currentCategoryIds.some(id => !nextSet.has(id)) ||
      selectedCategoryIds.some(id => !originalSet.has(id))

    if (!hasChanges) {
      onClose()
      return
    }

    // Validate at least one category
    if (selectedCategoryIds.length === 0) {
      setError('Please select at least one category.')
      return
    }

    try {
      setSaving(true)
      setError(null)

      const supabase = createClient()

      // Compute differences
      const original = new Set(currentCategoryIds)
      const next = new Set(selectedCategoryIds)
      const toAdd = [...next].filter(id => !original.has(id))
      const toRemove = [...original].filter(id => !next.has(id))

      // Insert new rows
      if (toAdd.length > 0) {
        const insertPayload = toAdd.map(categoryId => ({
          artist_id: profile.id,
          category_id: categoryId,
        }))

        const { error: insertError } = await supabase
          .from('artist_categories')
          .insert(insertPayload)

        if (insertError) {
          throw new Error(`Failed to add categories: ${insertError.message}`)
        }
      }

      // Delete removed rows
      if (toRemove.length > 0) {
        const { error: deleteError } = await supabase
          .from('artist_categories')
          .delete()
          .eq('artist_id', profile.id)
          .in('category_id', toRemove)

        if (deleteError) {
          throw new Error(`Failed to remove categories: ${deleteError.message}`)
        }
      }

      // Revalidate the artist profile page cache
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
          // Log but don't fail - revalidation is best effort
          console.warn('Failed to revalidate cache:', revalidateError)
        }
      }

      // Success - call onSuccess and close
      if (onSuccess) {
        onSuccess(selectedCategoryIds)
      }
      onClose()
    } catch (err) {
      console.error('Error saving categories:', err)
      setError(err instanceof Error ? err.message : 'Failed to save categories. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setSelectedCategoryIds(currentCategoryIds)
    setError(null)
    setMaxLimitError(false)
    onClose()
  }

  const selectedCategories = selectedCategoryIds
    .map(id => ({
      id,
      name: getCategoryName(id)
    }))
    .filter(cat => cat.name)

  const hasChanges = (() => {
    const originalSet = new Set(currentCategoryIds)
    const nextSet = new Set(selectedCategoryIds)
    return (
      currentCategoryIds.length !== selectedCategoryIds.length ||
      currentCategoryIds.some(id => !nextSet.has(id)) ||
      selectedCategoryIds.some(id => !originalSet.has(id))
    )
  })()

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
          <h2 className="text-xl font-semibold text-gray-900">Edit Categories</h2>
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

        {/* Sticky Selected Categories Section */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-4 flex-shrink-0">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-700">Selected Categories</h3>
            <div className="text-sm text-gray-500">
              {loading ? (
                <Skeleton className="h-4 w-20" />
              ) : (
                `${selectedCategoryIds.length} of 5 selected`
              )}
            </div>
          </div>
          {loading ? (
            <div className="flex flex-wrap gap-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-6 w-20 rounded-full" />
              ))}
            </div>
          ) : selectedCategories.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {selectedCategories.map((category) => (
                <span
                  key={category.id}
                  className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 text-xs font-medium px-3 py-1 rounded-full"
                >
                  {category.name}
                  <button
                    onClick={() => handleCategoryToggle(category.id)}
                    disabled={saving}
                    className="ml-1 text-amber-600 hover:text-amber-800 disabled:opacity-50"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-500 italic">No categories selected yet</p>
          )}
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="space-y-4">
              {/* Skeleton for description */}
              <div className="space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
              
              {/* Skeleton for category grid */}
              <div>
                <Skeleton className="h-5 w-32 mb-3" />
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-4">
                  Select the categories that best describe your artistic work. You can choose up to 5 categories.
                </p>
                
                {/* Max Limit Error */}
                {maxLimitError && (
                  <div className="mb-4 bg-amber-50 border border-amber-200 rounded-lg p-3">
                    <p className="text-sm text-amber-800">You can select up to 5 categories.</p>
                  </div>
                )}

                {/* Error Message */}
                {error && (
                  <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                )}

                {/* Available Categories */}
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Available Categories</h3>
                  {availableCategories.length === 0 ? (
                    <p className="text-sm text-gray-500">No categories available.</p>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {availableCategories.map((category) => {
                        const isSelected = selectedCategoryIds.includes(category.id)
                        return (
                          <button
                            key={category.id}
                            onClick={() => handleCategoryToggle(category.id)}
                            disabled={saving || (!isSelected && selectedCategoryIds.length >= 5)}
                            className={`
                              px-3 py-2 text-sm rounded-lg border transition-colors text-left
                              ${isSelected
                                ? 'bg-amber-50 border-amber-200 text-amber-800'
                                : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                              }
                              disabled:opacity-50 disabled:cursor-not-allowed
                            `}
                          >
                            {category.name}
                          </button>
                        )
                      })}
                    </div>
                  )}
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
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 flex-shrink-0">
            <button
              onClick={handleCancel}
              disabled={saving}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={selectedCategoryIds.length === 0 || !hasChanges || saving}
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
