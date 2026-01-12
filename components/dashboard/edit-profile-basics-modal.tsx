'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { UserProfile } from '@/hooks/use-user-profile'
import { sanitizeAndTrim } from '@/lib/utils/sanitize'
import { revalidateCache } from '@/lib/revalidate-client'
import { useCategories } from '@/hooks/use-categories'
import { useFeature } from '@/hooks/use-feature'
import { useDashboardSnapshot } from '@/hooks/use-dashboard-snapshot'
import { useClickOutside } from '@/hooks/use-click-outside'
import { useLocationAutocomplete, GeoapifySuggestion } from '@/hooks/use-location-autocomplete'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Loader2, X, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface EditProfileBasicsModalProps {
  isOpen: boolean
  onClose: () => void
  profile: UserProfile
  currentCategoryIds: number[]
  currentLocationId: number | null
  currentLocationFormatted: string | null
  onSuccess?: () => void
}

export default function EditProfileBasicsModal({
  isOpen,
  onClose,
  profile,
  currentCategoryIds,
  currentLocationId,
  currentLocationFormatted,
  onSuccess,
}: EditProfileBasicsModalProps) {
  const [displayName, setDisplayName] = useState(profile.display_name)
  const [locationQuery, setLocationQuery] = useState('')
  const [selectedLocation, setSelectedLocation] = useState<GeoapifySuggestion | null>(null)
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false)
  const [isEditingLocation, setIsEditingLocation] = useState(false)
  const [locationCleared, setLocationCleared] = useState(false)
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>(currentCategoryIds)
  const [categorySearchQuery, setCategorySearchQuery] = useState('')
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [displayNameError, setDisplayNameError] = useState<string | null>(null)
  const [locationError, setLocationError] = useState<string | null>(null)
  const [categoryError, setCategoryError] = useState<string | null>(null)

  const locationRef = useRef<HTMLDivElement>(null)
  const categoryRef = useRef<HTMLDivElement>(null)
  const categoryInputRef = useRef<HTMLInputElement>(null)
  const locationInputRef = useRef<HTMLInputElement>(null)

  const { categories, loading: categoriesLoading, error: categoriesError } = useCategories()
  const { allowed: canAddCategory, limit: maxCategories } = useFeature('add_category')
  const { refresh: refreshSnapshot } = useDashboardSnapshot()
  
  // Use SWR hook for location autocomplete
  const { suggestions: locationSuggestions, isLoading: isSearchingLocations } = useLocationAutocomplete(
    locationQuery,
    isEditingLocation
  )

  // Initialize state when modal opens
  useEffect(() => {
    if (isOpen) {
      setDisplayName(profile.display_name)
      setLocationQuery(currentLocationFormatted || '')
      setSelectedLocation(null)
      setIsEditingLocation(false)
      setLocationCleared(false)
      setSelectedCategoryIds(currentCategoryIds)
      setCategorySearchQuery('')
      // Open category dropdown by default when categories are loaded
      setShowCategoryDropdown(!categoriesLoading && categories.length > 0)
      setShowLocationSuggestions(false)
      setError(null)
      setDisplayNameError(null)
      setLocationError(null)
      setCategoryError(null)
    }
  }, [isOpen, profile.display_name, currentCategoryIds, currentLocationFormatted, categoriesLoading, categories.length])

  // Open category dropdown when categories finish loading
  useEffect(() => {
    if (isOpen && !categoriesLoading && categories.length > 0 && !showCategoryDropdown) {
      setShowCategoryDropdown(true)
    }
  }, [isOpen, categoriesLoading, categories.length, showCategoryDropdown])

  // Handle Escape key - close location dropdown first, then modal
  useEffect(() => {
    if (!isOpen) return

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !saving) {
        if (showLocationSuggestions) {
          setShowLocationSuggestions(false)
          e.preventDefault()
        } else {
          handleCancel()
        }
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, saving, showLocationSuggestions])

  // Open dropdown when suggestions arrive during active typing
  useEffect(() => {
    if (isEditingLocation && locationQuery.trim().length >= 2 && locationSuggestions.length > 0) {
      setShowLocationSuggestions(true)
    }
  }, [isEditingLocation, locationQuery, locationSuggestions.length])
  
  // Close suggestions when clicking outside
  useClickOutside([locationRef], () => {
    setShowLocationSuggestions(false)
  })

  useClickOutside([categoryRef], () => {
    setShowCategoryDropdown(false)
  })

  // Close location dropdown when category input is focused
  useEffect(() => {
    const categoryInput = categoryInputRef.current
    if (!categoryInput) return

    const handleCategoryFocus = () => {
      setShowLocationSuggestions(false)
    }

    categoryInput.addEventListener('focus', handleCategoryFocus)
    return () => categoryInput.removeEventListener('focus', handleCategoryFocus)
  }, [])

  // Filter categories based on search query
  const filteredCategories = categorySearchQuery.trim()
    ? categories.filter(cat =>
        cat.name.toLowerCase().includes(categorySearchQuery.toLowerCase())
      )
    : categories

  const handleLocationSelect = (suggestion: GeoapifySuggestion) => {
    setSelectedLocation(suggestion)
    setLocationQuery(suggestion.properties.formatted)
    setShowLocationSuggestions(false)
    setIsEditingLocation(false)
    setLocationCleared(false)
    setLocationError(null)
  }

  const handleLocationClear = () => {
    setSelectedLocation(null)
    setLocationQuery('')
    setShowLocationSuggestions(false)
    setIsEditingLocation(true)
    setLocationCleared(true)
    setLocationError('Location is required')
    // Focus input after clearing
    setTimeout(() => {
      locationInputRef.current?.focus()
    }, 0)
  }

  const handleLocationChange = () => {
    setIsEditingLocation(true)
    setLocationError(null)
    // Focus input
    setTimeout(() => {
      locationInputRef.current?.focus()
    }, 0)
  }

  const handleLocationInputChange = (value: string) => {
    setLocationQuery(value)
    setIsEditingLocation(true)
    // Clear selected location if user is typing something different
    if (selectedLocation && value !== selectedLocation.properties.formatted) {
      setSelectedLocation(null)
    }
    // If user changed query away from current location, mark as cleared if query doesn't match
    if (currentLocationFormatted && value.trim() !== currentLocationFormatted.trim()) {
      setLocationCleared(true)
      if (!selectedLocation) {
        setLocationError('Please select a location from the suggestions')
      } else {
        setLocationError(null)
      }
    } else if (value.trim() === currentLocationFormatted?.trim()) {
      // User typed back to original location
      setLocationCleared(false)
      setLocationError(null)
    } else if (!value.trim()) {
      // Empty query
      setLocationCleared(true)
      setLocationError('Location is required')
    } else if (!currentLocationFormatted) {
      // No current location - user must select a suggestion
      setLocationCleared(true)
      if (!selectedLocation) {
        setLocationError('Please select a location from the suggestions')
      } else {
        setLocationError(null)
      }
    } else {
      // User is typing, clear error if they have a selection
      if (selectedLocation) {
        setLocationError(null)
      } else if (locationCleared) {
        setLocationError('Please select a location from the suggestions')
      }
    }
    // Show dropdown when user is typing (will show results when they arrive)
    if (value.trim().length >= 2) {
      setShowLocationSuggestions(true)
    }
  }

  const handleLocationInputFocus = () => {
    setIsEditingLocation(true)
    // Show dropdown if we have suggestions for current query
    if (locationQuery.trim().length >= 2 && locationSuggestions.length > 0) {
      setShowLocationSuggestions(true)
    }
  }

  const handleCategoryToggle = (categoryId: number) => {
    setCategoryError(null)
    if (selectedCategoryIds.includes(categoryId)) {
      setSelectedCategoryIds(selectedCategoryIds.filter(id => id !== categoryId))
    } else {
      if (maxCategories !== null && selectedCategoryIds.length >= maxCategories) {
        setCategoryError(`You can select up to ${maxCategories} categories.`)
        return
      }
      setSelectedCategoryIds([...selectedCategoryIds, categoryId])
    }
  }

  const handleCategoryRemove = (categoryId: number) => {
    setCategoryError(null)
    setSelectedCategoryIds(selectedCategoryIds.filter(id => id !== categoryId))
  }

  // Get or create location using RPC
  const getOrCreateLocationId = async (suggestion: GeoapifySuggestion): Promise<number | null> => {
    const supabase = createClient()

    // Extract city from formatted if city property is missing
    const city = suggestion.properties.city || 
      (suggestion.properties.formatted?.split(',')[0]?.trim() || null)

    // Call RPC to get or create location (trim all string parameters)
    const { data: locationId, error: rpcError } = await supabase.rpc('get_or_create_location_id', {
      p_city: city ? city.trim() : null,
      p_state: suggestion.properties.state ? suggestion.properties.state.trim() : null,
      p_zip: suggestion.properties.postcode ?? null,
      p_country_code: 'us',
      p_formatted: suggestion.properties.formatted ? suggestion.properties.formatted.trim() : null,
      p_lat: suggestion.properties.lat ?? null,
      p_lon: suggestion.properties.lon ?? null,
      p_place_id: suggestion.properties.place_id || null,
    })

    if (rpcError) {
      throw new Error(`Failed to get or create location: ${rpcError.message}`)
    }

    if (!locationId) {
      throw new Error('Failed to get or create location: no ID returned')
    }

    return locationId as number
  }

  const handleSave = async () => {
    // Validation - must match isValid logic exactly
    const sanitizedDisplayName = sanitizeAndTrim(displayName)
    if (!sanitizedDisplayName || sanitizedDisplayName.length === 0) {
      setDisplayNameError('Display name is required')
      return
    }
    setDisplayNameError(null)

    // Location validation: selectedLocation != null OR (!locationCleared && currentLocationId != null)
    // Also: if isEditingLocation is true AND user changed query away from currentLocationFormatted, require selectedLocation
    const locationQueryChanged = isEditingLocation && 
      currentLocationFormatted && 
      locationQuery.trim() !== currentLocationFormatted.trim()
    
    const isLocationValid = selectedLocation !== null || 
      (!locationCleared && currentLocationId !== null)
    
    if (!isLocationValid || (locationQueryChanged && !selectedLocation)) {
      setLocationError('Location is required')
      return
    }
    setLocationError(null)

    if (selectedCategoryIds.length === 0) {
      setCategoryError('Please select at least one category')
      return
    }
    setCategoryError(null)

    // Check if anything changed
    const displayNameChanged = sanitizedDisplayName !== profile.display_name
    const locationChanged = selectedLocation !== null
    const categoriesChanged = 
      currentCategoryIds.length !== selectedCategoryIds.length ||
      currentCategoryIds.some(id => !selectedCategoryIds.includes(id)) ||
      selectedCategoryIds.some(id => !currentCategoryIds.includes(id))

    if (!displayNameChanged && !locationChanged && !categoriesChanged) {
      onClose()
      return
    }

    try {
      setSaving(true)
      setError(null)

      const supabase = createClient()

      // Update display name if changed
      if (displayNameChanged) {
        const { error: updateError } = await supabase
          .from('artists_min')
          .update({ display_name: sanitizedDisplayName })
          .eq('id', profile.id)

        if (updateError) {
          throw new Error(`Failed to update display name: ${updateError.message}`)
        }
      }

      // Update location if changed
      if (locationChanged && selectedLocation) {
        const locationId = await getOrCreateLocationId(selectedLocation)
        if (locationId) {
          const { error: updateError } = await supabase
            .from('artists_min')
            .update({ location_id: locationId })
            .eq('id', profile.id)

          if (updateError) {
            throw new Error(`Failed to update location: ${updateError.message}`)
          }
        }
      }

      // Update categories if changed
      if (categoriesChanged) {
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
            const errorMsg = insertError.message.toLowerCase()
            if (errorMsg.includes('limit') || errorMsg.includes('maximum') || errorMsg.includes('exceeded')) {
              refreshSnapshot()
              throw new Error(insertError.message)
            }
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
      }

      // Revalidate cache
      if (profile.handle) {
        await revalidateCache({
          handle: profile.handle,
          artistId: profile.id,
          tags: [`artist:${profile.handle}`, `artist-works:${profile.id}`],
        })
      }

      // Refresh snapshot to update limits/usage
      refreshSnapshot()

      // Success - call onSuccess and close
      if (onSuccess) {
        onSuccess()
      }
      onClose()
    } catch (err) {
      console.error('Error saving profile basics:', err)
      setError(err instanceof Error ? err.message : 'Failed to save changes. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setDisplayName(profile.display_name)
    setLocationQuery(currentLocationFormatted || '')
    setSelectedLocation(null)
    setIsEditingLocation(false)
    setLocationCleared(false)
    setSelectedCategoryIds(currentCategoryIds)
    setCategorySearchQuery('')
    setShowLocationSuggestions(false)
    setError(null)
    setDisplayNameError(null)
    setLocationError(null)
    setCategoryError(null)
    onClose()
  }

  if (!isOpen) return null

  // Validation logic
  const sanitizedDisplayName = sanitizeAndTrim(displayName)
  const isDisplayNameValid = sanitizedDisplayName.length > 0
  const isCategoriesValid = selectedCategoryIds.length > 0
  
  // Location validation: selectedLocation != null OR (!locationCleared && currentLocationId != null)
  // Also: if isEditingLocation is true AND user changed query away from currentLocationFormatted, require selectedLocation
  const locationQueryChanged = isEditingLocation && 
    currentLocationFormatted && 
    locationQuery.trim() !== currentLocationFormatted.trim()
  
  const isLocationValid = selectedLocation !== null || 
    (!locationCleared && currentLocationId !== null)
  
  // If user changed the query away from current location, they must select a suggestion
  const isLocationValidWithEditCheck = isLocationValid && 
    (!locationQueryChanged || selectedLocation !== null)

  const isValid = isDisplayNameValid && isLocationValidWithEditCheck && isCategoriesValid

  const hasChanges = 
    sanitizedDisplayName !== profile.display_name ||
    selectedLocation !== null ||
    locationCleared ||
    currentCategoryIds.length !== selectedCategoryIds.length ||
    currentCategoryIds.some(id => !selectedCategoryIds.includes(id)) ||
    selectedCategoryIds.some(id => !currentCategoryIds.includes(id))

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={(e) => {
        // Close on backdrop click
        if (e.target === e.currentTarget && !saving) {
          handleCancel()
        }
      }}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
          <h2 className="text-xl font-semibold text-gray-900">Edit Profile Basics</h2>
          <button
            onClick={handleCancel}
            disabled={saving}
            className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Display Name */}
          <div className="grid gap-2">
            <Label htmlFor="display-name" className="font-body">
              Display Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="display-name"
              type="text"
              placeholder="Your name"
              value={displayName}
              onChange={(e) => {
                setDisplayName(e.target.value)
                setDisplayNameError(null)
              }}
              disabled={saving}
              maxLength={100}
              className={cn("h-12 font-body", displayNameError && "border-red-500 focus-visible:ring-red-500")}
            />
            {displayNameError && (
              <p className="text-xs text-red-500 font-body">{displayNameError}</p>
            )}
          </div>

          {/* Location - Always editable */}
          <div className="grid gap-2 mb-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="location" className="font-body">
                Location <span className="text-red-500">*</span>
              </Label>
              {currentLocationFormatted && !isEditingLocation && (
                <button
                  type="button"
                  onClick={handleLocationChange}
                  disabled={saving}
                  className="text-xs text-sunroad-amber-600 hover:text-sunroad-amber-700 transition-colors disabled:opacity-50 font-medium"
                  aria-label="Change location"
                >
                  Change
                </button>
              )}
              {isEditingLocation && locationQuery && (
                <button
                  type="button"
                  onClick={handleLocationClear}
                  disabled={saving}
                  className="text-xs text-sunroad-brown-500 hover:text-sunroad-brown-700 transition-colors disabled:opacity-50"
                  aria-label="Clear location"
                >
                  Clear
                </button>
              )}
            </div>
            <div className="relative" ref={locationRef}>
              <Input
                ref={locationInputRef}
                id="location"
                type="text"
                placeholder="Search for your city..."
                value={locationQuery}
                onChange={(e) => handleLocationInputChange(e.target.value)}
                onFocus={handleLocationInputFocus}
                disabled={saving || (!isEditingLocation && !!currentLocationFormatted)}
                className={cn(
                  "h-12 pr-10 font-body", 
                  locationError && "border-red-500 focus-visible:ring-red-500",
                  !isEditingLocation && !!currentLocationFormatted && "bg-gray-50 cursor-not-allowed"
                )}
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {isSearchingLocations && (
                  <Loader2 className="h-4 w-4 animate-spin text-sunroad-brown-500" />
                )}
              </div>
              {showLocationSuggestions && isEditingLocation && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-sunroad-amber-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                  {locationSuggestions.length > 0 ? (
                    locationSuggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => handleLocationSelect(suggestion)}
                        className="w-full text-left px-4 py-2 hover:bg-sunroad-amber-50 focus:bg-sunroad-amber-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-sunroad-amber-600 focus-visible:ring-offset-1"
                      >
                        <p className="text-sm text-sunroad-brown-900">{suggestion.properties.formatted}</p>
                      </button>
                    ))
                  ) : (
                    <div className="px-4 py-2 text-sm text-sunroad-brown-600">
                      No results found
                    </div>
                  )}
                </div>
              )}
            </div>
            {locationError && (
              <p className="text-xs text-red-500 font-body">{locationError}</p>
            )}
          </div>

          {/* Categories */}
          <div className="grid gap-2">
            <Label htmlFor="categories" className="font-body">
              Categories <span className="text-red-500">*</span>
            </Label>
            
            <div className="relative" ref={categoryRef}>
              <div
                onClick={() => {
                  if (!saving && !categoriesLoading && !categoriesError) {
                    categoryInputRef.current?.focus()
                  }
                }}
                className={cn(
                  "flex h-12 max-h-12 w-full items-center gap-2 rounded-md border border-input bg-transparent px-3 py-0 text-base shadow-sm transition-colors overflow-hidden",
                  "focus-within:outline-none focus-within:ring-1 focus-within:ring-ring",
                  categoryError && "border-red-500 focus-within:ring-red-500",
                  (saving || categoriesLoading) && "opacity-60"
                )}
              >
                <div className="flex flex-wrap items-center gap-1.5 flex-1 min-w-0 h-full">
                  {selectedCategoryIds.map((categoryId) => {
                    const category = categories.find(c => c.id === categoryId)
                    return (
                      <div
                        key={categoryId}
                        className="inline-flex items-center gap-1 px-2 py-0.5 bg-sunroad-amber-100 border border-sunroad-amber-300 text-sunroad-amber-800 rounded-full text-xs font-medium flex-shrink-0"
                      >
                        <span className="whitespace-nowrap">{category?.name || `Category ${categoryId}`}</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleCategoryRemove(categoryId)
                          }}
                          disabled={saving}
                          className="ml-0.5 hover:bg-sunroad-amber-200 rounded-full p-0.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sunroad-amber-600 focus-visible:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed"
                          aria-label={`Remove ${category?.name || 'category'}`}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    )
                  })}
                  
                  <input
                    ref={categoryInputRef}
                    id="categories"
                    type="text"
                    placeholder={selectedCategoryIds.length === 0 ? "Search categories..." : ""}
                    value={categorySearchQuery}
                    onChange={(e) => {
                      setCategorySearchQuery(e.target.value)
                      setShowCategoryDropdown(true)
                    }}
                    onFocus={() => {
                      if (!categoriesLoading && !categoriesError) {
                        setShowCategoryDropdown(true)
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Backspace' && categorySearchQuery === '' && selectedCategoryIds.length > 0) {
                        e.preventDefault()
                        handleCategoryRemove(selectedCategoryIds[selectedCategoryIds.length - 1])
                      }
                    }}
                    disabled={saving || categoriesLoading || !!categoriesError || (maxCategories !== null && selectedCategoryIds.length >= maxCategories)}
                    className={cn(
                      "flex-1 min-w-[120px] bg-transparent border-0 outline-none text-sm md:text-base font-body",
                      "placeholder:text-muted-foreground",
                      "disabled:cursor-not-allowed"
                    )}
                  />
                </div>
                
                {categoriesLoading && (
                  <div className="flex-shrink-0">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  </div>
                )}
              </div>

              {/* Category Dropdown */}
              {showCategoryDropdown && !categoriesLoading && !categoriesError && (
                <div className="absolute z-10 w-full mt-2 border border-sunroad-amber-200 rounded-md bg-white shadow-lg overflow-hidden">
                  <div className="max-h-60 overflow-y-auto p-3">
                    {filteredCategories.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {filteredCategories.map((category) => {
                          const isSelected = selectedCategoryIds.includes(category.id)
                          const isDisabled = !isSelected && maxCategories !== null && selectedCategoryIds.length >= maxCategories
                          return (
                            <button
                              key={category.id}
                              type="button"
                              onClick={() => handleCategoryToggle(category.id)}
                              disabled={isDisabled || saving}
                              className={cn(
                                "px-3 py-1.5 text-sm rounded-full border transition-colors font-medium",
                                isSelected
                                  ? "bg-sunroad-amber-100 border-sunroad-amber-500 text-sunroad-amber-800"
                                  : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50",
                                isDisabled && "opacity-50 cursor-not-allowed"
                              )}
                            >
                              {category.name}
                            </button>
                          )
                        })}
                      </div>
                    ) : (
                      <div className="text-center text-gray-500 text-sm py-4">
                        No categories match &quot;{categorySearchQuery}&quot;
                      </div>
                    )}
                  </div>
                </div>
              )}

              {categoriesError && (
                <div className="mt-2 bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-800 mb-2">{categoriesError}</p>
                  <p className="text-xs text-red-600">
                    Unable to load categories. Please refresh the page or contact support.
                  </p>
                </div>
              )}
            </div>

            {categoryError && (
              <p className="text-xs text-red-500 font-body">{categoryError}</p>
            )}
            
            {!categoryError && (
              <p className="text-xs text-muted-foreground font-body">
                {maxCategories !== null 
                  ? `Select up to ${maxCategories} categories (${selectedCategoryIds.length} selected)`
                  : `Select categories that best describe your creative work (${selectedCategoryIds.length} selected)`
                }
              </p>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
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
            disabled={!isValid || !hasChanges || saving}
            className="px-4 py-2 bg-sunroad-amber-600 text-white rounded-lg hover:bg-sunroad-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
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

