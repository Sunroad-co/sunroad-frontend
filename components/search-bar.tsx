'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import SRImage from '@/components/media/SRImage'
import { useRouter } from 'next/navigation'
import { useSearch } from '@/hooks/use-search'
import { getAvatarUrl } from '@/lib/media'
import { getProfileUrl } from '@/lib/utils/profile-url'
import { useUser } from '@/hooks/use-user'

interface SearchBarProps {
  placeholder?: string
  className?: string
  onResultClick?: () => void
  categoryIds?: number[]
  locationIds?: number[]
  embedded?: boolean
  onFocusChange?: (isFocused: boolean) => void
  isActive?: boolean
  onQueryChange?: (query: string) => void
  showLabel?: boolean
  disableDropdown?: boolean
  value?: string
  onSearch?: () => void
  mobileDropdownTop?: number
  renderDropdownInParent?: boolean
  onDropdownRender?: (dropdown: React.ReactNode) => void
  // Near-me params
  nearMeCoords?: { lat: number; lon: number } | null
}

// Skeleton loader component - extracted outside to avoid recreation on every render
const SkeletonLoader: React.FC = () => (
  <div className="py-2 w-full">
    {[...Array(3)].map((_, i) => (
      <div key={i} className="px-4 py-3 border-b border-gray-100 last:border-b-0 w-full">
        <div className="flex items-center space-x-3 w-full">
          {/* Avatar skeleton */}
          <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse flex-shrink-0" />
          
          {/* Content skeleton */}
          <div className="flex-1 space-y-2 min-w-0">
            <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
            <div className="h-3 bg-gray-200 rounded animate-pulse w-1/2" />
            <div className="h-3 bg-gray-200 rounded animate-pulse w-2/3" />
          </div>
          
          {/* Arrow skeleton */}
          <div className="w-4 h-4 bg-gray-200 rounded animate-pulse flex-shrink-0" />
        </div>
      </div>
    ))}
  </div>
)

// Format distance helper function
function formatDistance(distanceKm: number): string {
  const distanceMiles = distanceKm * 0.621371 // Convert km to miles
  if (distanceMiles < 10) {
    return `${distanceMiles.toFixed(1)} mi`
  }
  return `${Math.round(distanceMiles)} mi`
}

// Artist Avatar component - extracted for better readability
interface ArtistAvatarProps {
  src: string | null
  name: string
}

const ArtistAvatar: React.FC<ArtistAvatarProps> = ({ src, name }) => {
  if (src) {
    return (
      <SRImage
        src={src}
        alt={name}
        width={40}
        height={40}
        className="w-10 h-10 rounded-full object-cover"
        mode="raw"
        sizes="40px"
      />
    )
  }
  
  return (
    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-100 to-amber-200 flex items-center justify-center">
      <span className="text-amber-600 font-medium text-sm">
        {name.charAt(0)}
      </span>
    </div>
  )
}

export default function SearchBar({ 
  placeholder = "Search for local creatives...",
  className = "",
  onResultClick,
  categoryIds,
  locationIds,
  embedded = false,
  onFocusChange,
  isActive = true,
  onQueryChange,
  showLabel = true,
  disableDropdown = false,
  value: controlledValue,
  onSearch,
  mobileDropdownTop,
  renderDropdownInParent = false,
  onDropdownRender,
  nearMeCoords
}: SearchBarProps) {
  const router = useRouter()
  const { user } = useUser()
  const [isFocused, setIsFocused] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1) // For keyboard navigation
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const blurTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isMouseInDropdownRef = useRef(false)
  const listboxId = 'artist-search-listbox'
  const isUnauthenticated = !user
  
  // Local state for query when disableDropdown is true
  const [localQuery, setLocalQuery] = useState(controlledValue || '')
  
  // Only use useSearch when dropdown is enabled
  const searchHook = useSearch({
    debounceMs: 300,
    minQueryLength: 2,
    limit: 8,
    categoryIds,
    locationIds,
    enabled: !disableDropdown,
    nearMeCoords
  })
  
  // When dropdown is disabled, use local state and controlled value
  const query = disableDropdown ? (controlledValue !== undefined ? controlledValue : localQuery) : searchHook.query
  const setQuery = disableDropdown 
    ? (q: string) => {
        setLocalQuery(q)
        onQueryChange?.(q)
      }
    : searchHook.setQuery
  const results = disableDropdown ? [] : searchHook.results
  const loading = disableDropdown ? false : searchHook.loading
  const error = disableDropdown ? null : searchHook.error
  const isOpen = disableDropdown ? false : searchHook.isOpen
  const setIsOpen = disableDropdown ? () => {} : searchHook.setIsOpen
  const hasSearched = disableDropdown ? false : searchHook.hasSearched
  
  // Sync controlled value when provided
  useEffect(() => {
    if (disableDropdown && controlledValue !== undefined && controlledValue !== localQuery) {
      setLocalQuery(controlledValue)
    }
  }, [controlledValue, disableDropdown, localQuery])

  // Update focus state when dropdown opens/closes or input focus changes
  useEffect(() => {
    if (onFocusChange) {
      const isActiveState = isOpen || isFocused
      onFocusChange(isActiveState)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, isFocused]) // onFocusChange is stable from parent's useCallback

  // Close dropdown when segment becomes inactive (for embedded mode)
  useEffect(() => {
    if (embedded && !isActive && isOpen) {
      setIsOpen(false)
      // Don't call onFocusChange here to avoid loops - it will be called by the above effect
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [embedded, isActive, isOpen]) // onFocusChange excluded to prevent loops

  // Show skeleton loader when dropdown is open but we haven't started loading yet
  const shouldShowSkeleton = isOpen && (loading || (!hasSearched && query.length >= 2))

  // Render dropdown content function (without positioning wrapper for parent rendering)
  const renderDropdownContent = () => {
    if (!isOpen || disableDropdown) return null
    
    return (
      <div
        onMouseEnter={handleDropdownMouseEnter}
        onMouseLeave={handleDropdownMouseLeave}
        role="listbox"
        id={listboxId}
        className="bg-white border border-gray-200 rounded-xl shadow-xl max-h-96 overflow-y-auto transition-all duration-200 ease-out opacity-100 translate-y-0 w-full"
      >
        {error ? (
          <div className="p-4 text-center text-red-600">
            <p className="text-sm">Failed to search artists</p>
            <button
              onClick={() => setQuery(query)}
              className="mt-2 text-xs text-amber-600 hover:text-amber-700"
            >
              Try again
            </button>
          </div>
        ) : shouldShowSkeleton ? (
          <SkeletonLoader />
        ) : results.length > 0 ? (
          <div className="py-2">
            {results.map((artist, index) => {
              const location = formatLocation(artist.city, artist.state)
              const categories = formatCategories(artist.categories)
              const isActive = activeIndex === index
              
              return (
                <Link
                  key={artist.id}
                  href={getProfileUrl(artist.handle)}
                  prefetch={false}
                  onMouseDown={handleResultMouseDown}
                  onMouseEnter={() => handleResultMouseEnter(index)}
                  onClick={handleResultClick}
                  role="option"
                  aria-selected={isActive}
                  id={`${listboxId}-option-${index}`}
                  className={`block px-4 py-3 transition-all duration-150 border-b border-gray-100 last:border-b-0 
                             hover:shadow-sm hover:scale-[1.01] ${
                               isActive 
                                 ? 'bg-amber-50 hover:bg-amber-50' 
                                 : 'hover:bg-gray-50'
                             }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <ArtistAvatar src={getAvatarUrl(artist, 'small')} name={artist.display_name} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <h4 className="text-sm font-medium text-gray-900 truncate">
                          {artist.display_name}
                        </h4>
                        {/* Distance badge (only shown when distance_km is available, i.e., near-me mode) */}
                        {artist.distance_km !== null && artist.distance_km !== undefined && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 whitespace-nowrap">
                            ~{formatDistance(artist.distance_km)}
                          </span>
                        )}
                      </div>
                      <div className="mt-1 space-y-1">
                        {location && (
                          <p className="text-xs text-gray-500 truncate">
                            📍 {location}
                          </p>
                        )}
                        {categories && (
                          <p className="text-xs text-amber-600 truncate">
                            🎨 {categories}
                          </p>
                        )}
                        {artist.bio && (
                          <p className="text-xs text-gray-600 truncate">
                            {artist.bio.length > 60 ? `${artist.bio.substring(0, 60)}...` : artist.bio}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </Link>
              )
            })}
            {results.length >= 8 && (
              <div className="px-4 py-2 border-t border-gray-100">
                <Link
                  href={`/search?q=${encodeURIComponent(query)}`}
                  prefetch={false}
                  onMouseDown={handleResultMouseDown}
                  onClick={handleResultClick}
                  className="block text-center text-sm text-amber-600 hover:text-amber-700 font-medium 
                             transition-colors duration-150 hover:bg-amber-50 py-2 rounded-lg"
                >
                  View all results for &quot;{query}&quot;
                </Link>
              </div>
            )}
            
            {/* Sign Up CTA for unauthenticated users */}
            {isUnauthenticated && (
              <div className="px-4 py-3 border-t border-gray-100 bg-gradient-to-br from-amber-50/50 to-transparent">
                <p className="text-xs text-gray-600 text-center mb-2 leading-relaxed">
                  We are a growing platform. Join the community of creatives today!
                </p>
                <Link
                  href="/signup"
                  prefetch={false}
                  onMouseDown={handleResultMouseDown}
                  onClick={handleResultClick}
                  className="block text-center text-sm text-amber-700 hover:text-amber-800 font-medium 
                             transition-colors duration-150 hover:bg-amber-100 py-2 px-4 rounded-lg border border-amber-200/60"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        ) : query.length >= 2 && !loading && hasSearched && results.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            <p className="text-sm">No artists found for &quot;{query}&quot;</p>
            <p className="text-xs mt-1">Try a different search term</p>
          </div>
        ) : null}
      </div>
    )
  }

  // Track previous content signature to prevent unnecessary re-renders
  const prevContentSignatureRef = useRef<string>('')

  // Expose dropdown to parent when renderDropdownInParent is true
  useEffect(() => {
    // Only run if renderDropdownInParent is true and we have the callback
    if (!renderDropdownInParent || !onDropdownRender) {
      return
    }

    // Create a signature of the current state that determines what should be rendered
    const resultsIds = results.map(r => r.id).join(',')
    const contentSignature = JSON.stringify({
      isOpen,
      query,
      resultsIds,
      loading,
      hasSearched,
      activeIndex,
      error: !!error,
      shouldShowSkeleton
    })

    // Only update if the signature actually changed
    if (contentSignature === prevContentSignatureRef.current) {
      return
    }

    prevContentSignatureRef.current = contentSignature

    if (isOpen) {
      const content = renderDropdownContent()
      onDropdownRender(content)
    } else {
      onDropdownRender(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, query, results, loading, hasSearched, activeIndex, error, shouldShowSkeleton, renderDropdownInParent, onDropdownRender])


  // Handle click outside to close dropdown and prevent scrolling
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        // Clear blur timeout when clicking outside
        if (blurTimeoutRef.current) {
          clearTimeout(blurTimeoutRef.current)
          blurTimeoutRef.current = null
        }
        setIsOpen(false)
      }
    }

    // Prevent scrolling when dropdown is open
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    document.addEventListener('mousedown', handleClickOutside)
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.body.style.overflow = 'unset'
      // Cleanup timeout on unmount
      if (blurTimeoutRef.current) {
        clearTimeout(blurTimeoutRef.current)
      }
    }
  }, [setIsOpen, isOpen])

  // Scroll active option into view when navigating with keyboard
  useEffect(() => {
    if (activeIndex >= 0 && dropdownRef.current) {
      const activeElement = document.getElementById(`${listboxId}-option-${activeIndex}`)
      if (activeElement) {
        activeElement.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
        })
      }
    }
  }, [activeIndex, listboxId])

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false)
      setActiveIndex(-1)
      inputRef.current?.blur()
      return
    }

    // Handle Enter key
    if (e.key === 'Enter') {
      e.preventDefault()
      
      // If there's an active result selected in the dropdown, navigate to it
      if (isOpen && activeIndex >= 0 && activeIndex < results.length) {
        const selectedArtist = results[activeIndex]
        if (selectedArtist) {
          handleResultClick()
          router.push(getProfileUrl(selectedArtist.handle))
        }
        return
      }
      
      // Otherwise, trigger search if onSearch callback is provided
      if (onSearch) {
        setIsOpen(false)
        inputRef.current?.blur()
        onSearch()
        return
      }
    }

    // Only handle arrow keys if dropdown is open and has results
    if (!isOpen || results.length === 0) {
      return
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((prev) => {
        const nextIndex = prev < results.length - 1 ? prev + 1 : 0
        return nextIndex
      })
      return
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((prev) => {
        const nextIndex = prev > 0 ? prev - 1 : results.length - 1
        return nextIndex
      })
      return
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    if (disableDropdown) {
      setLocalQuery(value)
      onQueryChange?.(value)
    } else {
    setQuery(value)
      onQueryChange?.(value)
    setActiveIndex(-1) // Reset active index when query changes
    
    // Show dropdown with skeleton loader immediately when typing 2+ characters
    if (value.length >= 2) {
      setIsOpen(true)
    } else {
      setIsOpen(false)
      }
    }
  }

  const handleInputFocus = () => {
    setIsFocused(true)
    onFocusChange?.(true)
    if (query.length >= 2) {
      setIsOpen(true)
    }
  }

  const handleInputBlur = () => {
    setIsFocused(false)
    // For embedded mode, rely on click-outside handler only
    // For non-embedded mode, use timeout to allow clicking on results
    if (!embedded) {
    // Clear any existing timeout
    if (blurTimeoutRef.current) {
      clearTimeout(blurTimeoutRef.current)
    }
    // Delay closing to allow clicking on results
    blurTimeoutRef.current = setTimeout(() => {
      // Only close if mouse is not in dropdown and input is not focused
      if (!isMouseInDropdownRef.current && document.activeElement !== inputRef.current) {
        setIsOpen(false)
        onFocusChange?.(false)
      }
      blurTimeoutRef.current = null
    }, 200)
    }
  }

  const handleResultMouseDown = (e: React.MouseEvent) => {
    // Prevent blur event from firing when clicking on result
    e.preventDefault()
  }

  const handleResultClick = () => {
    // Clear blur timeout since we're navigating
    if (blurTimeoutRef.current) {
      clearTimeout(blurTimeoutRef.current)
      blurTimeoutRef.current = null
    }
    isMouseInDropdownRef.current = false
    setActiveIndex(-1)
    setIsOpen(false)
    onFocusChange?.(false)
    onResultClick?.()
  }

  // Reset active index when mouse enters dropdown (user is using mouse, not keyboard)
  const handleDropdownMouseEnter = () => {
    isMouseInDropdownRef.current = true
    setActiveIndex(-1) // Clear keyboard selection when using mouse
  }

  const handleDropdownMouseLeave = () => {
    isMouseInDropdownRef.current = false
  }

  // Track mouse hover on individual results
  const handleResultMouseEnter = (index: number) => {
    setActiveIndex(index)
  }

  const handleClearSearch = () => {
    setQuery('')
    onQueryChange?.('')
    setIsOpen(false)
    onFocusChange?.(false)
  }

  const formatLocation = (city: string | null, state: string | null) => {
    if (!city && !state) return null
    return [city, state].filter(Boolean).join(', ')
  }

  const formatCategories = (categories: string | null) => {
    if (!categories) return null
    return categories.split(',').slice(0, 2).join(', ')
  }

  // When showLabel is false, render just the input for embedded mode with label/subtitle structure
  if (!showLabel && embedded) {
    return (
      <div className={className}>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={isOpen}
          aria-controls={listboxId}
          aria-activedescendant={activeIndex >= 0 ? `${listboxId}-option-${activeIndex}` : undefined}
          className={`w-full bg-transparent focus:outline-none text-sm p-0 border-0 h-auto ${
            query ? 'text-gray-900' : 'text-gray-500'
          }`}
        />
        {/* Dropdown Results */}
        {isOpen && !renderDropdownInParent && (
          <div
            ref={dropdownRef}
            onMouseEnter={handleDropdownMouseEnter}
            onMouseLeave={handleDropdownMouseLeave}
            role="listbox"
            id={listboxId}
            className={`${
              embedded && mobileDropdownTop !== undefined
                ? 'fixed md:absolute md:top-full md:mt-2'
                : 'absolute top-full mt-2'
            } bg-white border border-gray-200 rounded-xl shadow-xl z-[60] max-h-96 overflow-y-auto transition-all duration-200 ease-out opacity-100 translate-y-0 ${
              embedded 
                ? 'left-0 right-0 w-full md:left-0 md:right-auto md:min-w-[480px] md:max-w-[480px] md:w-full' 
                : 'left-0 right-0 w-full'
            }`}
            style={embedded && mobileDropdownTop !== undefined ? { top: `${mobileDropdownTop}px` } : undefined}
          >
            {error ? (
              <div className="p-4 text-center text-red-600">
                <p className="text-sm">Failed to search artists</p>
                <button
                  onClick={() => setQuery(query)}
                  className="mt-2 text-xs text-amber-600 hover:text-amber-700"
                >
                  Try again
                </button>
              </div>
            ) : shouldShowSkeleton ? (
              <SkeletonLoader />
            ) : results.length > 0 ? (
              <div className="py-2">
                {results.map((artist, index) => {
                  const location = formatLocation(artist.city, artist.state)
                  const categories = formatCategories(artist.categories)
                  const isActive = activeIndex === index
                  
                  return (
                    <Link
                      key={artist.id}
                      href={getProfileUrl(artist.handle)}
                      prefetch={false}
                      onMouseDown={handleResultMouseDown}
                      onMouseEnter={() => handleResultMouseEnter(index)}
                      onClick={handleResultClick}
                      role="option"
                      aria-selected={isActive}
                      id={`${listboxId}-option-${index}`}
                      className={`block px-4 py-3 transition-all duration-150 border-b border-gray-100 last:border-b-0 
                                 hover:shadow-sm hover:scale-[1.01] ${
                                   isActive 
                                     ? 'bg-amber-50 hover:bg-amber-50' 
                                     : 'hover:bg-gray-50'
                                 }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          <ArtistAvatar src={getAvatarUrl(artist, 'small')} name={artist.display_name} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <h4 className="text-sm font-medium text-gray-900 truncate">
                              {artist.display_name}
                            </h4>
                            {/* Distance badge (only shown when distance_km is available, i.e., near-me mode) */}
                            {artist.distance_km !== null && artist.distance_km !== undefined && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 whitespace-nowrap">
                                ~{formatDistance(artist.distance_km)}
                              </span>
                            )}
                          </div>
                          <div className="mt-1 space-y-1">
                            {location && (
                              <p className="text-xs text-gray-500 truncate">
                                📍 {location}
                              </p>
                            )}
                            {categories && (
                              <p className="text-xs text-amber-600 truncate">
                                🎨 {categories}
                              </p>
                            )}
                            {artist.bio && (
                              <p className="text-xs text-gray-600 truncate">
                                {artist.bio.length > 60 ? `${artist.bio.substring(0, 60)}...` : artist.bio}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex-shrink-0">
                          <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                    </Link>
                  )
                })}
                {results.length >= 8 && (
                  <div className="px-4 py-2 border-t border-gray-100">
                    <Link
                      href={`/search?q=${encodeURIComponent(query)}`}
                      prefetch={false}
                      onMouseDown={handleResultMouseDown}
                      onClick={handleResultClick}
                      className="block text-center text-sm text-amber-600 hover:text-amber-700 font-medium 
                                 transition-colors duration-150 hover:bg-amber-50 py-2 rounded-lg"
                    >
                      View all results for &quot;{query}&quot;
                    </Link>
                  </div>
                )}
                
                {/* Sign Up CTA for unauthenticated users */}
                {isUnauthenticated && (
                  <div className="px-4 py-3 border-t border-gray-100 bg-gradient-to-br from-amber-50/50 to-transparent">
                    <p className="text-xs text-gray-600 text-center mb-2 leading-relaxed">
                      We are a growing platform. Join the community of creatives today!
                    </p>
                    <Link
                      href="/signup"
                      prefetch={false}
                      onMouseDown={handleResultMouseDown}
                      onClick={handleResultClick}
                      className="block text-center text-sm text-amber-700 hover:text-amber-800 font-medium 
                                 transition-colors duration-150 hover:bg-amber-100 py-2 px-4 rounded-lg border border-amber-200/60"
                    >
                      Sign Up
                    </Link>
                  </div>
                )}
              </div>
            ) : query.length >= 2 && !loading && hasSearched && results.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                <p className="text-sm">No artists found for &quot;{query}&quot;</p>
                <p className="text-xs mt-1">Try a different search term</p>
              </div>
            ) : null}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className={`relative ${className}`}>
      {/* Search Input */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={isOpen}
          aria-controls={listboxId}
          aria-activedescendant={activeIndex >= 0 ? `${listboxId}-option-${activeIndex}` : undefined}
          className={`w-full py-3 text-gray-900 transition-all duration-200 min-w-0 ${
            embedded
              ? 'bg-transparent focus:outline-none px-4 pr-10'
              : `bg-white border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent shadow-sm px-4 pr-10 ${
                  isFocused ? 'shadow-md' : ''
                }`
          }`}
        />
        
        {/* Search Icon / Loading Spinner / Clear Button */}
        <div className={`absolute inset-y-0 right-0 flex items-center ${embedded ? 'pr-3' : 'pr-4'}`}>
          {query ? (
            // Clear Button when there's a query
          <button
            onClick={handleClearSearch}
              className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          ) : loading ? (
            // Loading spinner
            <div className="animate-spin h-5 w-5 border-2 border-amber-500 border-t-transparent rounded-full" />
          ) : (
            // Search Icon when no query (show in both embedded and non-embedded)
            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
        )}
        </div>
      </div>

      {/* Backdrop removed per user request */}

      {/* Dropdown Results */}
      {!disableDropdown && isOpen && !renderDropdownInParent && (
        <div
          ref={dropdownRef}
          onMouseEnter={handleDropdownMouseEnter}
          onMouseLeave={handleDropdownMouseLeave}
          role="listbox"
          id={listboxId}
          className={`${
            embedded && mobileDropdownTop !== undefined
              ? 'fixed md:absolute md:top-full md:mt-2'
              : 'absolute top-full mt-2'
          } bg-white border border-gray-200 rounded-xl shadow-xl z-[60] max-h-96 overflow-y-auto
                     transition-all duration-200 ease-out ${
                       embedded 
                         ? 'left-0 right-0 w-full md:left-0 md:right-auto md:min-w-[480px] md:max-w-[480px] md:w-full' 
                         : 'left-0 right-0 w-full'
                     } opacity-100 translate-y-0`}
          style={embedded && mobileDropdownTop !== undefined ? { top: `${mobileDropdownTop}px` } : undefined}
        >
          {error ? (
            <div className="p-4 text-center text-red-600">
              <p className="text-sm">Failed to search artists</p>
              <button
                onClick={() => setQuery(query)}
                className="mt-2 text-xs text-amber-600 hover:text-amber-700"
              >
                Try again
              </button>
            </div>
          ) : shouldShowSkeleton ? (
            <SkeletonLoader />
          ) : results.length > 0 ? (
            <div className="py-2">
              {results.map((artist, index) => {
                // Pre-compute formatted strings to avoid double computation
                const location = formatLocation(artist.city, artist.state)
                const categories = formatCategories(artist.categories)
                const isActive = activeIndex === index
                
                  return (
                  <Link
                    key={artist.id}
                    href={getProfileUrl(artist.handle)}
                    prefetch={false}
                    onMouseDown={handleResultMouseDown}
                    onMouseEnter={() => handleResultMouseEnter(index)}
                    onClick={handleResultClick}
                    role="option"
                    aria-selected={isActive}
                    id={`${listboxId}-option-${index}`}
                    className={`block px-4 py-3 transition-all duration-150 border-b border-gray-100 last:border-b-0 
                               hover:shadow-sm hover:scale-[1.01] ${
                                 isActive 
                                   ? 'bg-amber-50 hover:bg-amber-50' 
                                   : 'hover:bg-gray-50'
                               }`}
                  >
                    <div className="flex items-center space-x-3">
                      {/* Avatar */}
                      <div className="flex-shrink-0">
                        <ArtistAvatar src={getAvatarUrl(artist, 'small')} name={artist.display_name} />
                      </div>

                      {/* Artist Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <h4 className="text-sm font-medium text-gray-900 truncate">
                            {artist.display_name}
                          </h4>
                          {/* Distance badge (only shown when distance_km is available, i.e., near-me mode) */}
                          {artist.distance_km !== null && artist.distance_km !== undefined && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 whitespace-nowrap">
                              ~{formatDistance(artist.distance_km)}
                            </span>
                          )}
                        </div>
                        
                        <div className="mt-1 space-y-1">
                          {location && (
                            <p className="text-xs text-gray-500 truncate">
                              📍 {location}
                            </p>
                          )}
                          {categories && (
                            <p className="text-xs text-amber-600 truncate">
                              🎨 {categories}
                            </p>
                          )}
                          {artist.bio && (
                            <p className="text-xs text-gray-600 truncate">
                              {artist.bio.length > 60 ? `${artist.bio.substring(0, 60)}...` : artist.bio}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Arrow */}
                      <div className="flex-shrink-0">
                        <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </Link>
                )
              })}
              
              {/* View All Results */}
              {results.length >= 8 && (
                <div className="px-4 py-2 border-t border-gray-100">
                  <Link
                    href={`/search?q=${encodeURIComponent(query)}`}
                    prefetch={false}
                    onMouseDown={handleResultMouseDown}
                    onClick={handleResultClick}
                    className="block text-center text-sm text-amber-600 hover:text-amber-700 font-medium 
                               transition-colors duration-150 hover:bg-amber-50 py-2 rounded-lg"
                  >
                    View all results for &quot;{query}&quot;
                  </Link>
                </div>
              )}
              
              {/* Sign Up CTA for unauthenticated users */}
              {isUnauthenticated && (
                <div className="px-4 py-3 border-t border-gray-100 bg-gradient-to-br from-amber-50/50 to-transparent">
                  <p className="text-xs text-gray-600 text-center mb-2 leading-relaxed">
                    We are a growing platform. Join the community of creatives today!
                  </p>
                  <Link
                    href="/signup"
                    prefetch={false}
                    onMouseDown={handleResultMouseDown}
                    onClick={handleResultClick}
                    className="block text-center text-sm text-amber-700 hover:text-amber-800 font-medium 
                               transition-colors duration-150 hover:bg-amber-100 py-2 px-4 rounded-lg border border-amber-200/60"
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          ) : query.length >= 2 && !loading && hasSearched && results.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              <p className="text-sm">No artists found for &quot;{query}&quot;</p>
              <p className="text-xs mt-1">Try a different search term</p>
            </div>
          ) : null}
        </div>
      )}
    </div>
  )
}

