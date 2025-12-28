'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useLocationSearch, type Location } from '@/hooks/use-location-search'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import Toast from '@/components/ui/toast'

export interface NearMeCoords {
  lat: number
  lon: number
}

interface WhereFilterPillProps {
  selectedLocation: Location | null
  onChange: (location: Location | null) => void
  embedded?: boolean
  onActiveChange?: (isActive: boolean) => void
  isActive?: boolean
  showLabel?: boolean
  // Near-me props
  isNearMe?: boolean
  onNearMeChange?: (isNearMe: boolean, coords?: NearMeCoords | null) => void
  nearMeCoords?: NearMeCoords | null
}

export default function WhereFilterPill({
  selectedLocation,
  onChange,
  embedded = false,
  onActiveChange,
  isActive = true,
  showLabel = true,
  isNearMe = false,
  onNearMeChange,
  nearMeCoords
}: WhereFilterPillProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [locationQuery, setLocationQuery] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [activeIndex, setActiveIndex] = useState(-1)
  const [isGettingLocation, setIsGettingLocation] = useState(false)
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [toastVisible, setToastVisible] = useState(false)

  // Only enable location search when dropdown is open
  const { locations, loading, error, retry, query, setQuery } = useLocationSearch({ 
    debounceMs: 300, 
    limit: 25,
    enabled: isOpen
  })

  // Reset locationQuery when dropdown opens
  useEffect(() => {
    if (isOpen) {
      setLocationQuery('')
      setActiveIndex(-1)
    }
  }, [isOpen])

  // Sync locationQuery with hook's query (only when dropdown is open)
  useEffect(() => {
    if (isOpen) {
      setQuery(locationQuery)
    }
  }, [locationQuery, setQuery, isOpen])

  // Close dropdown when segment becomes inactive (for embedded mode)
  useEffect(() => {
    if (embedded && !isActive && isOpen) {
      setIsOpen(false)
      onActiveChange?.(false)
      setLocationQuery('')
      setActiveIndex(-1)
      // Don't blur input or focus anything - let the new active segment handle focus
    }
  }, [embedded, isActive, isOpen, onActiveChange])

  // Handle click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(target) &&
        buttonRef.current &&
        !buttonRef.current.contains(target) &&
        inputRef.current &&
        !inputRef.current.contains(target)
      ) {
        setIsOpen(false)
        onActiveChange?.(false)
        setLocationQuery('')
        setActiveIndex(-1)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, onActiveChange])

  // Geolocation cache key
  const GEOLOCATION_CACHE_KEY = 'sunroad_geolocation'
  const GEOLOCATION_CACHE_TTL = 60 * 60 * 1000 // 1 hour

  // Get cached geolocation
  const getCachedGeolocation = useCallback((): NearMeCoords | null => {
    if (typeof window === 'undefined') return null
    try {
      const cached = sessionStorage.getItem(GEOLOCATION_CACHE_KEY)
      if (!cached) return null
      const { coords, timestamp } = JSON.parse(cached)
      const now = Date.now()
      if (now - timestamp < GEOLOCATION_CACHE_TTL) {
        return coords
      }
      // Cache expired, remove it
      sessionStorage.removeItem(GEOLOCATION_CACHE_KEY)
      return null
    } catch {
      return null
    }
  }, [])

  // Cache geolocation
  const cacheGeolocation = useCallback((coords: NearMeCoords) => {
    if (typeof window === 'undefined') return
    try {
      sessionStorage.setItem(GEOLOCATION_CACHE_KEY, JSON.stringify({
        coords,
        timestamp: Date.now()
      }))
    } catch {
      // Ignore storage errors
    }
  }, [])

  // Show toast
  const showToast = useCallback((message: string) => {
    setToastMessage(message)
    setToastVisible(true)
  }, [])

  // Handle "Near me" click
  const handleNearMeClick = useCallback(async () => {
    if (isGettingLocation) return

    // Check for cached location first
    const cached = getCachedGeolocation()
    if (cached) {
      onNearMeChange?.(true, cached)
      onChange(null) // Clear location selection
      setIsOpen(false)
      onActiveChange?.(false)
      setLocationQuery('')
      setActiveIndex(-1)
      return
    }

    // Check if geolocation is available
    if (!navigator.geolocation) {
      showToast('Geolocation is not supported by your browser')
      return
    }

    setIsGettingLocation(true)

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Geolocation request timed out'))
        }, 10000) // 10 second timeout

        navigator.geolocation.getCurrentPosition(
          (pos) => {
            clearTimeout(timeout)
            resolve(pos)
          },
          (err) => {
            clearTimeout(timeout)
            reject(err)
          },
          {
            enableHighAccuracy: false,
            timeout: 10000,
            maximumAge: 60000 // Accept cached position up to 1 minute old
          }
        )
      })

      const coords: NearMeCoords = {
        lat: position.coords.latitude,
        lon: position.coords.longitude
      }

      // Cache the coordinates
      cacheGeolocation(coords)

      // Activate near-me mode
      onNearMeChange?.(true, coords)
      onChange(null) // Clear location selection
      setIsOpen(false)
      onActiveChange?.(false)
      setLocationQuery('')
      setActiveIndex(-1)
    } catch (error) {
      let errorMessage = 'Unable to get your location'
      if (error instanceof Error) {
        if (error.message.includes('denied') || error.message.includes('permission')) {
          errorMessage = 'Location access denied. Please enable location permissions in your browser settings.'
        } else if (error.message.includes('timeout')) {
          errorMessage = 'Location request timed out. Please try again.'
        } else if (error.message.includes('unavailable')) {
          errorMessage = 'Location is unavailable. Please try again later.'
        }
      }
      showToast(errorMessage)
      // Keep dropdown open and usable
    } finally {
      setIsGettingLocation(false)
    }
  }, [isGettingLocation, getCachedGeolocation, onNearMeChange, onChange, onActiveChange, cacheGeolocation, showToast])

  const handleSelect = (location: Location) => {
    onChange(location)
    // Clear near-me when selecting a location
    onNearMeChange?.(false, null)
    setIsOpen(false)
    onActiveChange?.(false)
    setLocationQuery('')
    setActiveIndex(-1)
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    onChange(null)
    onNearMeChange?.(false, null)
    // Don't clear locationQuery or open dropdown
    // Just clear the selection
  }

  // Format location for compact display (pill label)
  const getCompactLocationLabel = (location: Location): string => {
    // Prefer: city + ", " + state_code (US)
    if (location.city && location.state_code) {
      return `${location.city}, ${location.state_code}`
    }
    // Fallback: city, state
    if (location.city && location.state) {
      return `${location.city}, ${location.state}`
    }
    // Last resort: formatted (but should be truncated)
    return location.formatted
  }

  const getButtonLabel = () => {
    if (isNearMe) {
      return 'Near me'
    }
    if (!selectedLocation) {
      return showLabel ? 'Where' : 'Location'
    }
    return getCompactLocationLabel(selectedLocation)
  }

  const getSubtitle = () => {
    if (isNearMe) {
      return 'Near me'
    }
    if (!selectedLocation) {
      return 'Location'
    }
    return getCompactLocationLabel(selectedLocation)
  }

  const handleButtonClick = () => {
    const newIsOpen = !isOpen
    setIsOpen(newIsOpen)
    onActiveChange?.(newIsOpen)
    if (newIsOpen) {
      setActiveIndex(-1)
      // Only focus input if we're actually opening the location dropdown
      // Don't focus if user is clicking on a different segment
      setTimeout(() => {
        if (isActive && newIsOpen) {
          inputRef.current?.focus()
        }
      }, 50)
    }
  }

  const handleDropdownMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
  }

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false)
      onActiveChange?.(false)
      buttonRef.current?.focus()
      setLocationQuery('')
      setActiveIndex(-1)
      return
    }

    if (!isOpen) return

    // Check if "Near me" option is visible (when query is empty)
    const showNearMe = !locationQuery.trim()
    const totalOptions = showNearMe ? locations.length + 1 : locations.length

    if (e.key === 'Enter') {
      e.preventDefault()
      if (activeIndex === -1 && showNearMe) {
        // "Near me" is selected (index -1)
        handleNearMeClick()
      } else if (activeIndex >= 0 && activeIndex < locations.length) {
        handleSelect(locations[activeIndex])
      } else if (showNearMe) {
        // Select "Near me" if no active index and it's visible
        handleNearMeClick()
      } else if (locations.length > 0) {
        // Select first location if no active index
        handleSelect(locations[0])
      }
      return
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((prev) => {
        if (prev === -1) {
          // Move from "Near me" to first location
          return 0
        }
        const nextIndex = prev < locations.length - 1 ? prev + 1 : (showNearMe ? -1 : 0)
        return nextIndex
      })
      return
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((prev) => {
        if (prev === 0 && showNearMe) {
          // Move from first location to "Near me"
          return -1
        }
        const nextIndex = prev > 0 ? prev - 1 : (showNearMe ? -1 : locations.length - 1)
        return nextIndex
      })
      return
    }
  }

  // Scroll active option into view
  useEffect(() => {
    if (activeIndex >= 0 && dropdownRef.current) {
      const activeElement = dropdownRef.current.querySelector(`[data-location-index="${activeIndex}"]`)
      if (activeElement) {
        activeElement.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
        })
      }
    }
  }, [activeIndex])

  // Display locations - show "Top locations" when query is empty, otherwise show search results
  const displayLocations = locations
  const showTopLocationsLabel = !locationQuery.trim() && locations.length > 0

  return (
    <div className={`${embedded ? '' : 'relative'} w-full`}>
      {!showLabel && embedded ? (
        // Embedded mode without label - render as clickable subtitle text
        <div className="w-full flex items-center gap-1 min-w-0">
          <button
            ref={buttonRef}
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              handleButtonClick()
            }}
            className="flex-1 text-left text-sm text-gray-500 hover:text-gray-700 transition-colors min-w-0"
            aria-expanded={isOpen}
            aria-haspopup="listbox"
            onKeyDown={handleKeyDown}
          >
            <span 
              className={cn(
                "block min-w-0 truncate whitespace-nowrap",
                (selectedLocation || isNearMe) && "text-amber-800 font-medium"
              )}
              title={selectedLocation ? selectedLocation.formatted : undefined}
            >
              {getSubtitle()}
            </span>
          </button>
          {(selectedLocation || isNearMe) && (
            <button
              type="button"
              onClick={handleClear}
              onMouseDown={(e) => {
                e.stopPropagation()
                e.preventDefault()
              }}
              className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Clear location"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      ) : (
        // Regular button mode
    <button
          ref={buttonRef}
      type="button"
          onClick={handleButtonClick}
          onKeyDown={handleKeyDown}
          className={cn(
            'inline-flex items-center gap-1 text-sm transition-colors w-full min-w-0',
        embedded
          ? 'h-full rounded-none border-0 bg-transparent px-4 py-3 text-left'
              : 'rounded-full border bg-white min-w-[100px] px-3 py-2 justify-center',
            (selectedLocation || isNearMe)
              ? embedded
                ? 'text-amber-800 font-medium'
                : 'border-amber-300 bg-amber-50 text-amber-800 font-medium'
              : embedded
              ? 'text-gray-700'
              : 'border-gray-200 text-gray-700 hover:border-gray-300'
          )}
          aria-expanded={isOpen}
          aria-haspopup="listbox"
        >
          <span 
            className="flex-1 min-w-0 truncate text-left overflow-hidden whitespace-nowrap"
            title={selectedLocation ? selectedLocation.formatted : undefined}
          >
            {getButtonLabel()}
          </span>
          {(selectedLocation || isNearMe) && (
            <button
              type="button"
              onClick={handleClear}
              onMouseDown={(e) => {
                e.stopPropagation()
                e.preventDefault()
              }}
              className="ml-1 flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Clear location"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
          <svg
            className={`h-4 w-4 flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      )}

      {/* Dropdown */}
      {isOpen && (
        <div
          ref={dropdownRef}
          onMouseDown={handleDropdownMouseDown}
          className={cn(
            'absolute top-full mt-2 bg-white border border-gray-200 rounded-xl shadow-xl z-[60] max-h-96 overflow-hidden flex flex-col',
            'transition-all duration-200 ease-out',
            embedded 
              ? 'left-0 right-0 w-full md:left-auto md:right-0 md:min-w-[420px] md:max-w-[560px] md:w-auto' 
              : 'left-1/2 -translate-x-1/2 w-[calc(100vw-1rem)] max-w-64',
            'opacity-100 translate-y-0'
          )}
          role="listbox"
        >
          {/* Search Input - Always rendered */}
          <div className="p-3 border-b border-gray-200">
            <input
              ref={inputRef}
              type="text"
              value={locationQuery}
              onChange={(e) => {
                e.stopPropagation()
                setLocationQuery(e.target.value)
                setActiveIndex(-1)
              }}
              onKeyDown={(e) => {
                e.stopPropagation()
                const showNearMe = !locationQuery.trim()
                if (e.key === 'Escape') {
                  setIsOpen(false)
                  onActiveChange?.(false)
                  buttonRef.current?.focus()
                  setLocationQuery('')
                  setActiveIndex(-1)
                } else if (e.key === 'ArrowDown') {
                  e.preventDefault()
                  setActiveIndex((prev) => {
                    if (prev === -1) {
                      return 0
                    }
                    const nextIndex = prev < locations.length - 1 ? prev + 1 : (showNearMe ? -1 : 0)
                    return nextIndex
                  })
                } else if (e.key === 'ArrowUp') {
                  e.preventDefault()
                  setActiveIndex((prev) => {
                    if (prev === 0 && showNearMe) {
                      return -1
                    }
                    const nextIndex = prev > 0 ? prev - 1 : (showNearMe ? -1 : locations.length - 1)
                    return nextIndex
                  })
                } else if (e.key === 'Enter') {
                  e.preventDefault()
                  if (activeIndex === -1 && showNearMe) {
                    handleNearMeClick()
                  } else if (activeIndex >= 0 && activeIndex < locations.length) {
                    handleSelect(locations[activeIndex])
                  } else if (showNearMe) {
                    handleNearMeClick()
                  } else if (locations.length > 0) {
                    handleSelect(locations[0])
                  }
                }
              }}
              placeholder="Search locations..."
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              onClick={(e) => e.stopPropagation()}
              onFocus={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
            />
          </div>

          {/* Results Area - Shows loading, error, or results */}
          <div className="flex-1 overflow-y-auto">
            {/* Near me option - Always shown at top when query is empty */}
            {!locationQuery.trim() && (
              <div className="p-3 border-b border-gray-200">
                <button
                  type="button"
                  onClick={handleNearMeClick}
                  disabled={isGettingLocation}
                  onMouseEnter={() => setActiveIndex(-1)}
                  className={cn(
                    'w-full text-left px-3 py-2.5 text-sm rounded-lg transition-colors flex items-center gap-3',
                    isNearMe
                      ? 'bg-amber-100 border border-amber-500 text-amber-800'
                      : activeIndex === -1
                      ? 'bg-amber-50 text-gray-900 border border-transparent'
                      : 'bg-white text-gray-700 hover:bg-gray-50 border border-transparent',
                    isGettingLocation && 'opacity-50 cursor-not-allowed'
                  )}
                >
                  <svg className="h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium">Near me</div>
                    <div className="text-xs text-gray-500 mt-0.5">Within 50 miles</div>
                  </div>
                  {isGettingLocation && (
                    <div className="animate-spin h-4 w-4 border-2 border-gray-400 border-t-transparent rounded-full flex-shrink-0" />
                  )}
                </button>
              </div>
            )}
            {loading ? (
              <div className="p-3 space-y-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : error ? (
              <div className="p-4">
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-800 mb-2">{error}</p>
                  <button
                    onClick={retry}
                    className="text-xs text-red-600 hover:text-red-700 font-medium"
                  >
                    Try again
                  </button>
                </div>
              </div>
            ) : displayLocations.length === 0 ? (
              <div className="text-center text-gray-500 text-sm py-4">
                {locationQuery.trim() 
                  ? `No locations found for "${locationQuery}"`
                  : 'No locations available'}
              </div>
            ) : (
              <div className="p-3">
                {showTopLocationsLabel && (
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 px-2">
                    Top locations
                  </div>
                )}
                <div className="space-y-1">
                  {displayLocations.map((location, index) => {
                    const isSelected = selectedLocation?.id === location.id
                    const isActive = activeIndex === index
                    return (
                      <button
                        key={location.id}
                        type="button"
                        onClick={() => handleSelect(location)}
                        role="option"
                        aria-selected={isSelected}
                        data-location-index={index}
                        className={cn(
                          'w-full text-left px-3 py-2 text-sm rounded-lg transition-colors',
                          isSelected
                            ? 'bg-amber-100 border border-amber-500 text-amber-800'
                            : isActive
                            ? 'bg-amber-50 text-gray-900'
                            : 'bg-white text-gray-700 hover:bg-gray-50'
                        )}
                        onMouseEnter={() => setActiveIndex(index)}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{location.formatted}</span>
                          {location.artist_count > 0 && (
                            <span className="text-xs text-gray-500 ml-2">
                              ({location.artist_count} {location.artist_count === 1 ? 'artist' : 'artists'})
                            </span>
                          )}
                        </div>
    </button>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      {/* Toast for geolocation errors */}
      <Toast
        message={toastMessage || ''}
        isVisible={toastVisible}
        onClose={() => {
          setToastVisible(false)
          setToastMessage(null)
        }}
      />
    </div>
  )
}

