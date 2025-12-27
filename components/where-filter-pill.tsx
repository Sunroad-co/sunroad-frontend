'use client'

import { useState, useRef, useEffect } from 'react'
import { useLocationSearch, type Location } from '@/hooks/use-location-search'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

interface WhereFilterPillProps {
  selectedLocation: Location | null
  onChange: (location: Location | null) => void
  embedded?: boolean
  onActiveChange?: (isActive: boolean) => void
  isActive?: boolean
  showLabel?: boolean
}

export default function WhereFilterPill({
  selectedLocation,
  onChange,
  embedded = false,
  onActiveChange,
  isActive = true,
  showLabel = true
}: WhereFilterPillProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [locationQuery, setLocationQuery] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [activeIndex, setActiveIndex] = useState(-1)

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

  const handleSelect = (location: Location) => {
    onChange(location)
    setIsOpen(false)
    onActiveChange?.(false)
    setLocationQuery('')
    setActiveIndex(-1)
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    onChange(null)
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
    if (!selectedLocation) {
      return showLabel ? 'Where' : 'Location'
    }
    return getCompactLocationLabel(selectedLocation)
  }

  const getSubtitle = () => {
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

    if (e.key === 'Enter') {
      e.preventDefault()
      if (activeIndex >= 0 && activeIndex < locations.length) {
        handleSelect(locations[activeIndex])
      } else if (locations.length > 0) {
        // Select first item if no active index
        handleSelect(locations[0])
      }
      return
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((prev) => {
        const nextIndex = prev < locations.length - 1 ? prev + 1 : 0
        return nextIndex
      })
      return
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((prev) => {
        const nextIndex = prev > 0 ? prev - 1 : locations.length - 1
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
                selectedLocation && "text-amber-800 font-medium"
              )}
              title={selectedLocation ? selectedLocation.formatted : undefined}
            >
              {getSubtitle()}
            </span>
          </button>
          {selectedLocation && (
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
            selectedLocation
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
          {selectedLocation && (
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
                if (e.key === 'Escape') {
                  setIsOpen(false)
                  onActiveChange?.(false)
                  buttonRef.current?.focus()
                  setLocationQuery('')
                  setActiveIndex(-1)
                } else if (e.key === 'ArrowDown') {
                  e.preventDefault()
                  setActiveIndex((prev) => {
                    const nextIndex = prev < locations.length - 1 ? prev + 1 : 0
                    return nextIndex
                  })
                } else if (e.key === 'ArrowUp') {
                  e.preventDefault()
                  setActiveIndex((prev) => {
                    const nextIndex = prev > 0 ? prev - 1 : locations.length - 1
                    return nextIndex
                  })
                } else if (e.key === 'Enter') {
                  e.preventDefault()
                  if (activeIndex >= 0 && activeIndex < locations.length) {
                    handleSelect(locations[activeIndex])
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
    </div>
  )
}

