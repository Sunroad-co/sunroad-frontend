'use client'

import { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import SearchBar from './search-bar'
import CategoryFilterPill from './category-filter-pill'
import WhereFilterPill, { type NearMeCoords } from './where-filter-pill'
import type { Location } from '@/hooks/use-location-search'
import { useClickOutside } from '@/hooks/use-click-outside'

interface ArtistSearchControlsProps {
  placeholder?: string
  className?: string
  onResultClick?: () => void
  variant?: 'default' | 'page'
  showSearchButton?: boolean
  mobileMode?: 'inline' | 'overlay' // For mobile: 'inline' expands in place, 'overlay' shows fixed overlay
  // Controlled props for variant="page"
  query?: string
  onQueryChange?: (query: string) => void
  selectedCategoryIds?: number[]
  onCategoryChange?: (ids: number[]) => void
  selectedLocation?: Location | null
  onLocationChange?: (location: Location | null) => void
  // Near-me props
  isNearMe?: boolean
  onNearMeChange?: (isNearMe: boolean, coords?: NearMeCoords | null) => void
  nearMeCoords?: NearMeCoords | null
}

export default function ArtistSearchControls({
  placeholder = "Search artists or categories...",
  className = "",
  onResultClick,
  variant = 'default',
  showSearchButton = true,
  mobileMode = 'inline',
  query: controlledQuery,
  onQueryChange,
  selectedCategoryIds: controlledCategoryIds,
  onCategoryChange,
  selectedLocation: controlledLocation,
  onLocationChange,
  isNearMe: controlledIsNearMe,
  onNearMeChange: controlledOnNearMeChange,
  nearMeCoords: controlledNearMeCoords
}: ArtistSearchControlsProps) {
  const router = useRouter()
  const [internalCategoryIds, setInternalCategoryIds] = useState<number[]>([])
  const [internalSearchQuery, setInternalSearchQuery] = useState('')
  const [internalLocation, setInternalLocation] = useState<Location | null>(null)
  const [internalIsNearMe, setInternalIsNearMe] = useState(false)
  const [internalNearMeCoords, setInternalNearMeCoords] = useState<NearMeCoords | null>(null)
  
  // Use controlled props if provided (for variant="page"), otherwise use internal state
  const selectedCategoryIds = controlledCategoryIds ?? internalCategoryIds
  const searchQuery = controlledQuery ?? internalSearchQuery
  const selectedLocation = controlledLocation !== undefined ? controlledLocation : internalLocation
  const isNearMe = controlledIsNearMe !== undefined ? controlledIsNearMe : internalIsNearMe
  const nearMeCoords = controlledNearMeCoords !== undefined ? controlledNearMeCoords : internalNearMeCoords
  const setSelectedCategoryIds = onCategoryChange ?? setInternalCategoryIds
  const setSearchQuery = onQueryChange ?? setInternalSearchQuery
  const setSelectedLocation = onLocationChange ?? setInternalLocation
  
  // Memoize locationIds to prevent unnecessary re-renders - only use when near-me is NOT active
  const locationIds = useMemo(() => {
    if (isNearMe) return undefined
    return selectedLocation ? [selectedLocation.id] : undefined
  }, [selectedLocation?.id, isNearMe])
  
  const [activeSegment, setActiveSegment] = useState<'search' | 'where' | 'category' | null>(null)
  const [activeDropdown, setActiveDropdown] = useState<'search' | 'where' | 'category' | null>(null)
  // For 'page' variant, always expanded; for 'default', use state
  const [isExpanded, setIsExpanded] = useState(variant === 'page')
  const [isAnimatingOut, setIsAnimatingOut] = useState(false)
  const [searchDropdownContent, setSearchDropdownContent] = useState<React.ReactNode>(null)
  const [whereDropdownContent, setWhereDropdownContent] = useState<React.ReactNode>(null)
  const [categoryDropdownContent, setCategoryDropdownContent] = useState<React.ReactNode>(null)
  const [expandedHeight, setExpandedHeight] = useState<number | null>(null)
  const [isMounted, setIsMounted] = useState(false)

  // Simple callbacks - no blocking, let React handle re-renders efficiently
  const handleSearchDropdownRender = useCallback((content: React.ReactNode) => {
    setSearchDropdownContent(content)
  }, [])
  const handleWhereDropdownRender = useCallback((content: React.ReactNode) => {
    setWhereDropdownContent(content)
  }, [])
  const handleCategoryDropdownRender = useCallback((content: React.ReactNode) => {
    setCategoryDropdownContent(content)
  }, [])
  const justExpandedRef = useRef(false)
  const searchRef = useRef<HTMLDivElement>(null)
  const whereRef = useRef<HTMLDivElement>(null)
  const categoryRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const placeholderRef = useRef<HTMLDivElement>(null)
  const expandedRef = useRef<HTMLDivElement>(null)
  const desktopContainerRef = useRef<HTMLDivElement>(null)
  const pillRef = useRef<HTMLDivElement>(null)
  const dropdownContainerRef = useRef<HTMLDivElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)
  const overlayPanelRef = useRef<HTMLDivElement>(null)
  const placeholderButtonRef = useRef<HTMLDivElement>(null)

  // Close other segments when one becomes active - memoized to prevent infinite loops
  const handleSegmentActivate = useCallback((segment: 'search' | 'where' | 'category' | null) => {
    setActiveSegment(prev => prev !== segment ? segment : prev)
    setActiveDropdown(prev => prev !== segment ? segment : prev)
  }, [])

  // Expand search bar when user interacts (skip for variant="page")
  const handleExpand = useCallback((e?: React.MouseEvent) => {
    if (variant === 'page') return // Always expanded for page variant
    if (e) {
      e.stopPropagation()
      e.preventDefault()
    }
    setIsAnimatingOut(false)
    setIsExpanded(true)
    // Set search as active when expanding
    if (!activeSegment) {
      handleSegmentActivate('search')
    }
    justExpandedRef.current = true
    // Reset the flag after a delay to allow click-outside to work
    setTimeout(() => {
      justExpandedRef.current = false
    }, 500) // Increased delay to prevent immediate collapse
  }, [activeSegment, handleSegmentActivate, variant])

  // Handle collapse with animation (skip for variant="page")
  const handleCollapse = useCallback(() => {
    if (variant === 'page') return // Never collapse for page variant
    setIsAnimatingOut(true)
    // Wait for exit animation to complete before actually collapsing
    setTimeout(() => {
      setIsExpanded(false)
      setIsAnimatingOut(false)
      // Return focus to placeholder button in overlay mode
      if (mobileMode === 'overlay' && placeholderButtonRef.current) {
        placeholderButtonRef.current.focus()
      }
    }, 300) // Match animation duration
  }, [variant, mobileMode])

  // Auto-focus search input when expanded
  useEffect(() => {
    if (isExpanded && !isAnimatingOut) {
      // Small delay to ensure DOM is ready
      const timer = setTimeout(() => {
        const input = searchRef.current?.querySelector('input[role="combobox"]') as HTMLInputElement
        input?.focus()
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [isExpanded, isAnimatingOut])

  // Track client-side mount for portal
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Scroll lock and escape key handling for overlay mode
  useEffect(() => {
    if (mobileMode !== 'overlay') return
    
    if (isExpanded && !isAnimatingOut) {
      // Lock body scroll
      const originalOverflow = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      
      // Handle escape key
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          handleCollapse()
        }
      }
      
      document.addEventListener('keydown', handleEscape)
      
      return () => {
        document.body.style.overflow = originalOverflow
        document.removeEventListener('keydown', handleEscape)
      }
    }
  }, [isExpanded, isAnimatingOut, mobileMode, handleCollapse])

  // Open dropdown when segment is activated (for where and category)
  useEffect(() => {
    if (activeSegment === 'where' || activeSegment === 'category') {
      // Small delay to ensure DOM is ready
      const timer = setTimeout(() => {
        const pillContainer = activeSegment === 'where' ? whereRef.current : categoryRef.current
        if (pillContainer) {
          // Find the button inside the pill component and click it
          const pillButton = pillContainer.querySelector('button[aria-haspopup="listbox"]') as HTMLButtonElement
          if (pillButton && pillButton.getAttribute('aria-expanded') === 'false') {
            pillButton.click()
          }
        }
      }, 50)
      return () => clearTimeout(timer)
    }
  }, [activeSegment])


  // Track expanded height to prevent layout shift
  useEffect(() => {
    if ((isExpanded || variant === 'page') && expandedRef.current && variant !== 'page') {
      const updateHeight = () => {
        if (expandedRef.current) {
          const height = expandedRef.current.offsetHeight
          console.log('[ArtistSearchControls] Expanded height:', height)
          setExpandedHeight(height)
        }
      }
      // Small delay to ensure DOM is updated
      const timer = setTimeout(updateHeight, 50)
      updateHeight() // Also call immediately
      // Update on resize
      window.addEventListener('resize', updateHeight)
      return () => {
        clearTimeout(timer)
        window.removeEventListener('resize', updateHeight)
      }
    } else if (!isExpanded && variant !== 'page') {
      setExpandedHeight(null)
    }
  }, [isExpanded, variant, activeSegment, activeDropdown])

  // Update pill position when active segment changes
  useEffect(() => {
    if ((!isExpanded && variant !== 'page') || isAnimatingOut || !desktopContainerRef.current || !pillRef.current) return

    const updatePillPosition = () => {
      if (!desktopContainerRef.current || !pillRef.current) return

      // Default to 'search' if no segment is active
      const segmentToShow = activeSegment || 'search'
      
      let targetElement: HTMLElement | null = null
      if (segmentToShow === 'search' && searchRef.current) {
        targetElement = searchRef.current
      } else if (segmentToShow === 'where' && whereRef.current) {
        targetElement = whereRef.current
      } else if (segmentToShow === 'category' && categoryRef.current) {
        targetElement = categoryRef.current
      }

      if (targetElement && desktopContainerRef.current) {
        const containerRect = desktopContainerRef.current.getBoundingClientRect()
        const targetRect = targetElement.getBoundingClientRect()
        const left = targetRect.left - containerRect.left
        const width = targetRect.width

        pillRef.current.style.transform = `translateX(${left}px)`
        pillRef.current.style.width = `${width}px`
      }
    }

    // Small delay to ensure layout is complete
    const timer = setTimeout(updatePillPosition, 100)
    updatePillPosition() // Also call immediately

    // Update on resize
    window.addEventListener('resize', updatePillPosition)
    return () => {
      clearTimeout(timer)
      window.removeEventListener('resize', updatePillPosition)
    }
  }, [activeSegment, isExpanded, isAnimatingOut, variant])

  // Handle blur on search input to collapse if conditions are met
  const handleSearchBlur = useCallback(() => {
    // Don't collapse if we just expanded
    if (justExpandedRef.current) {
      return
    }
    // Small delay to check if focus moved to another element in the search bar
    setTimeout(() => {
      if (
        !justExpandedRef.current &&
        !activeSegment &&
        !searchQuery.trim() &&
        !selectedLocation && // Don't collapse if location is selected
        !isNearMe && // Don't collapse if near-me is active
        !selectedCategoryIds.length && // Don't collapse if categories are selected
        !isAnimatingOut &&
        containerRef.current &&
        !containerRef.current.contains(document.activeElement)
      ) {
        handleCollapse()
      }
    }, 150)
  }, [activeSegment, searchQuery, selectedLocation, selectedCategoryIds, isAnimatingOut, handleCollapse])

  // Collapse when clicking outside (only if no active segment and no query)
  // Skip this for overlay mode - backdrop click handler handles it
  useEffect(() => {
    if (mobileMode === 'overlay') return // Overlay mode uses backdrop click handler instead
    
    function handleClickOutside(event: MouseEvent) {
      // Don't collapse if we just expanded (prevents immediate collapse)
      if (justExpandedRef.current) {
        return
      }
      
      const target = event.target as Node
      // Check if click is on backdrop or outside the search bar
      const isBackdrop = (target as HTMLElement).classList?.contains('search-backdrop')
      const isOutside = containerRef.current && !containerRef.current.contains(target)
      
      if (
        (isBackdrop || isOutside) &&
        !activeSegment &&
        !searchQuery.trim() &&
        !selectedLocation && // Don't collapse if location is selected
        !isNearMe && // Don't collapse if near-me is active
        !selectedCategoryIds.length && // Don't collapse if categories are selected
        !isAnimatingOut &&
        !justExpandedRef.current
      ) {
        handleCollapse()
      }
    }

    if (isExpanded && !isAnimatingOut) {
      // Use mousedown with a delay to avoid immediate collapse after expansion
      const timeoutId = setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside)
        document.addEventListener('click', handleClickOutside)
      }, 300) // Increased delay to ensure expansion is complete
      
      return () => {
        clearTimeout(timeoutId)
        document.removeEventListener('mousedown', handleClickOutside)
        document.removeEventListener('click', handleClickOutside)
      }
    }
  }, [isExpanded, activeSegment, searchQuery, isAnimatingOut, handleCollapse, mobileMode])

  // Handle click outside to close active dropdown
  const handleDropdownClickOutside = useCallback((event: MouseEvent) => {
    // Don't close if we just expanded
    if (justExpandedRef.current) {
      return
    }
    
    const target = event.target as HTMLElement
    
    // Don't close if clicking on interactive elements inside dropdown (links, buttons)
    // This allows navigation/selection to complete before closing
    if (target.tagName === 'A' || 
        target.tagName === 'BUTTON' || 
        target.closest('a') !== null || 
        target.closest('button') !== null ||
        target.closest('[role="option"]') !== null) {
      // Allow the click to complete, then close after a short delay
      setTimeout(() => {
        if (activeDropdown) {
          setActiveDropdown(null)
          if (activeSegment === activeDropdown) {
            setActiveSegment(null)
          }
        }
      }, 100)
      return
    }
    
    // Close the active dropdown immediately for non-interactive clicks
    if (activeDropdown) {
      setActiveDropdown(null)
      // Also deactivate the segment if it matches
      if (activeSegment === activeDropdown) {
        setActiveSegment(null)
      }
    }
  }, [activeDropdown, activeSegment])

  useClickOutside(
    [
      searchRef,
      whereRef,
      categoryRef,
      dropdownContainerRef,
      containerRef
    ],
    handleDropdownClickOutside,
    !!activeDropdown && (isExpanded || variant === 'page')
  )

  // Memoized callbacks to prevent infinite loops
  const handleSearchFocusChange = useCallback((isFocused: boolean) => {
    // Only activate search if no other segment is active or if search is explicitly focused
    if (isFocused) {
      setIsExpanded(true)
      setIsAnimatingOut(false)
      // Only activate search if no other segment is currently active
      // This prevents search from stealing focus when clicking category/location
      if (!activeSegment || activeSegment === 'search') {
        handleSegmentActivate('search')
      }
    } else {
      // When focus is lost, check if we should collapse
      handleSearchBlur()
    }
  }, [handleSegmentActivate, handleSearchBlur, activeSegment])

  const handleWhereActiveChange = useCallback((isActive: boolean) => {
    handleSegmentActivate(isActive ? 'where' : null)
  }, [handleSegmentActivate])

  // Handle location change - clear near-me when location is selected
  const handleLocationChange = useCallback((location: Location | null) => {
    setSelectedLocation(location)
    // Clear near-me when location is selected
    if (location) {
      if (controlledOnNearMeChange) {
        controlledOnNearMeChange(false, null)
      } else {
        setInternalIsNearMe(false)
        setInternalNearMeCoords(null)
      }
    }
  }, [setSelectedLocation, controlledOnNearMeChange])

  // Handle near-me change - clear location when near-me is activated
  const handleNearMeChange = useCallback((newIsNearMe: boolean, coords?: NearMeCoords | null) => {
    if (controlledOnNearMeChange) {
      controlledOnNearMeChange(newIsNearMe, coords ?? null)
    } else {
      setInternalIsNearMe(newIsNearMe)
      setInternalNearMeCoords(coords ?? null)
    }
    // Clear location when near-me is activated
    if (newIsNearMe) {
      setSelectedLocation(null)
    }
  }, [setSelectedLocation, controlledOnNearMeChange])

  const handleCategoryActiveChange = useCallback((isActive: boolean) => {
    handleSegmentActivate(isActive ? 'category' : null)
  }, [handleSegmentActivate])

  const handleSearchClick = useCallback(() => {
    // Navigate to /search page with query params
    const params = new URLSearchParams()
    if (searchQuery.trim()) {
      params.set('q', searchQuery.trim())
    }
    if (selectedCategoryIds.length > 0) {
      params.set('categories', selectedCategoryIds.join(','))
    }
    if (isNearMe && nearMeCoords) {
      params.set('near', '1')
      params.set('lat', nearMeCoords.lat.toString())
      params.set('lon', nearMeCoords.lon.toString())
      params.set('rmi', '50') // 50 miles
    } else if (selectedLocation) {
      // Pass location data directly in URL to avoid extra API call
      params.set('location_id', selectedLocation.id.toString())
      params.set('location_formatted', selectedLocation.formatted)
      if (selectedLocation.city) params.set('location_city', selectedLocation.city)
      if (selectedLocation.state_code) params.set('location_state_code', selectedLocation.state_code)
      if (selectedLocation.state) params.set('location_state', selectedLocation.state)
      if (selectedLocation.country_code) params.set('location_country_code', selectedLocation.country_code)
      if (selectedLocation.artist_count !== undefined) params.set('location_artist_count', selectedLocation.artist_count.toString())
    }
    const queryString = params.toString()
    router.push(`/search${queryString ? `?${queryString}` : ''}`)
  }, [searchQuery, selectedCategoryIds, selectedLocation, isNearMe, nearMeCoords, router])

  // Handle backdrop click for overlay mode
  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleCollapse()
    }
  }, [handleCollapse])

  // Handle result click - close overlay if in overlay mode
  const handleResultClickWithOverlay = useCallback(() => {
    onResultClick?.()
    // Delay closing overlay to allow navigation to start first
    if (mobileMode === 'overlay' && isExpanded) {
      setTimeout(() => {
        handleCollapse()
      }, 200)
    }
  }, [mobileMode, isExpanded, handleCollapse, onResultClick])

  return (
    <div ref={containerRef} className={`w-full ${className}`}>
      {/* Mobile Layout - Unified Search Bar */}
      {mobileMode === 'overlay' ? (
        // Overlay Mode: Compact pill + Fixed overlay
        <>
          {/* Compact Placeholder Pill - Always visible when collapsed */}
          {variant !== 'page' && !isExpanded && (
            <div 
              ref={placeholderButtonRef}
              onClick={(e) => handleExpand(e)}
              onMouseDown={(e) => e.stopPropagation()}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  handleExpand()
                }
              }}
              tabIndex={0}
              role="button"
              aria-label="Open search"
              className="md:hidden bg-white border border-gray-200 rounded-full shadow-sm hover:shadow-md cursor-pointer transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-1 flex-shrink-0"
              style={{ minWidth: '80px' }}
            >
              <div className="px-3 py-2 flex items-center gap-2">
                <svg className="h-4 w-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <span className="text-xs text-gray-500 truncate">Find local creatives</span>
              </div>
            </div>
          )}

          {/* Overlay - Rendered via portal to document.body for true fullscreen */}
          {isMounted && (isExpanded || variant === 'page') && typeof document !== 'undefined' && createPortal(
            <div
              ref={overlayRef}
              className={`md:hidden fixed inset-0 z-[100] ${
                isAnimatingOut ? 'animate-fade-out' : 'animate-fade-in'
              }`}
              onClick={variant !== 'page' ? handleBackdropClick : undefined}
            >
              {/* Fullscreen Backdrop */}
              <div 
                className="absolute inset-0 bg-black/70 backdrop-blur-lg"
                aria-hidden="true"
              />
              
              {/* Floating Panel - Centered near top with margins */}
              <div
                ref={overlayPanelRef}
                onClick={(e) => {
                  // Only stop propagation for clicks on the panel background itself
                  // Allow all clicks on interactive elements and dropdowns to work normally
                  const target = e.target as HTMLElement
                  
                  // Check if click is inside a dropdown container
                  const isInDropdown = dropdownContainerRef.current?.contains(target) || false
                  
                  // Check if click is on an interactive element or its children
                  const isInteractive = target.tagName === 'A' || 
                                       target.tagName === 'BUTTON' || 
                                       target.tagName === 'INPUT' ||
                                       target.tagName === 'LABEL' ||
                                       target.closest('a') !== null || 
                                       target.closest('button') !== null ||
                                       target.closest('[role="option"]') !== null ||
                                       target.closest('[role="listbox"]') !== null ||
                                       target.closest('[role="combobox"]') !== null ||
                                       target.closest('[role="menuitem"]') !== null ||
                                       target.closest('[data-interactive]') !== null
                  
                  // Don't stop propagation for clicks on interactive elements or inside dropdowns
                  if (!isInteractive && !isInDropdown) {
                    e.stopPropagation()
                  }
                }}
                onMouseDown={(e) => {
                  // Also handle mousedown to prevent backdrop clicks on interactive elements
                  const target = e.target as HTMLElement
                  
                  // Check if click is inside a dropdown container
                  const isInDropdown = dropdownContainerRef.current?.contains(target) || false
                  
                  const isInteractive = target.tagName === 'A' || 
                                       target.tagName === 'BUTTON' || 
                                       target.tagName === 'INPUT' ||
                                       target.tagName === 'LABEL' ||
                                       target.closest('a') !== null || 
                                       target.closest('button') !== null ||
                                       target.closest('[role="option"]') !== null ||
                                       target.closest('[role="listbox"]') !== null ||
                                       target.closest('[role="combobox"]') !== null ||
                                       target.closest('[role="menuitem"]') !== null ||
                                       target.closest('[data-interactive]') !== null
                  
                  if (!isInteractive && !isInDropdown) {
                    e.stopPropagation()
                  }
                }}
                className={`absolute left-4 right-4 top-4 bg-white rounded-2xl border border-gray-200 shadow-2xl ${
                  isAnimatingOut 
                    ? 'animate-fade-out-slide-up' 
                    : 'animate-fade-in-slide-down'
                } overflow-visible`}
                style={{ 
                  transition: 'opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1), transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
              >
                {/* Close Button - Top right */}
                {variant !== 'page' && (
                  <button
                    onClick={handleCollapse}
                    className="absolute top-4 right-4 z-[110] w-8 h-8 rounded-full bg-white border border-gray-200 shadow-md flex items-center justify-center hover:bg-gray-50 transition-colors"
                    aria-label="Close search"
                  >
                    <svg className="h-4 w-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}

            {/* First Row: Search Input */}
            <div 
              ref={searchRef}
              className={`px-4 py-3 border-b border-gray-100 transition-colors relative ${
                activeSegment === 'search' && variant === 'page'
                  ? 'bg-white rounded-t-xl'
                  : activeSegment === 'search'
                  ? 'bg-gray-50'
                  : ''
              }`}
              onClick={(e) => {
                if (activeSegment !== 'search') {
                  handleSegmentActivate('search')
                  const input = searchRef.current?.querySelector('input[role="combobox"]') as HTMLInputElement
                  input?.focus()
                }
              }}
            >
              <SearchBar
                placeholder={placeholder}
                className="w-full"
                categoryIds={selectedCategoryIds}
                locationIds={locationIds}
                onResultClick={handleResultClickWithOverlay}
                embedded={true}
                isActive={activeSegment === 'search'}
                onFocusChange={handleSearchFocusChange}
                onQueryChange={setSearchQuery}
                showLabel={false}
                disableDropdown={variant === 'page'}
                value={variant === 'page' ? searchQuery : undefined}
                onSearch={() => {
                  handleSearchClick()
                  if (mobileMode === 'overlay' && variant !== 'page') {
                    handleCollapse()
                  }
                }}
                renderDropdownInParent={true}
                onDropdownRender={handleSearchDropdownRender}
                nearMeCoords={isNearMe ? nearMeCoords : null}
              />
            </div>

            {/* Second Row: Where and Category Filters */}
            <div className="flex items-center divide-x divide-gray-200 relative overflow-visible">
              {/* Where Filter */}
              <div 
                ref={whereRef}
                className={`flex-1 px-4 py-3 transition-colors cursor-pointer relative ${
                  activeSegment === 'where' && variant === 'page'
                    ? 'bg-white rounded-l-xl'
                    : activeSegment === 'where'
                    ? 'bg-gray-50'
                    : 'hover:bg-gray-50/50'
                }`}
                onClick={(e) => {
                  if (activeDropdown !== 'where') {
                    handleSegmentActivate('where')
                  } else {
                    // If already active, toggle dropdown
                    setActiveDropdown(prev => prev === 'where' ? null : 'where')
                  }
                }}
              >
                <div className="text-xs font-semibold text-gray-900 mb-0.5 flex items-center gap-1.5">
                  <svg className="h-3.5 w-3.5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Where
                </div>
                <div className="text-sm text-gray-500 min-w-0">
                  <WhereFilterPill 
                    selectedLocation={selectedLocation}
                    onChange={setSelectedLocation}
                    embedded={true}
                    onActiveChange={handleWhereActiveChange}
                    showLabel={false}
                    renderDropdownInParent={true}
                    onDropdownRender={handleWhereDropdownRender}
                    isOpen={activeDropdown === 'where'}
                  />
                </div>
              </div>

              {/* Category Filter */}
              <div 
                ref={categoryRef}
                className={`flex-1 px-4 py-3 transition-colors cursor-pointer relative ${
                  activeSegment === 'category' && variant === 'page'
                    ? 'bg-white rounded-r-xl'
                    : activeSegment === 'category'
                    ? 'bg-gray-50'
                    : 'hover:bg-gray-50/50'
                }`}
                onClick={(e) => {
                  if (activeDropdown !== 'category') {
                    handleSegmentActivate('category')
                  } else {
                    // If already active, toggle dropdown
                    setActiveDropdown(prev => prev === 'category' ? null : 'category')
                  }
                }}
              >
                <div className="text-xs font-semibold text-gray-900 mb-0.5 flex items-center gap-1.5">
                  <svg className="h-3.5 w-3.5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                  What
                </div>
                <div className="text-sm text-gray-500 min-w-0">
                  <CategoryFilterPill
                    selectedIds={selectedCategoryIds}
                    onChange={setSelectedCategoryIds}
                    embedded={true}
                    isActive={activeSegment === 'category'}
                    onActiveChange={handleCategoryActiveChange}
                    showLabel={false}
                    subtitle="Category"
                    renderDropdownInParent={true}
                    onDropdownRender={handleCategoryDropdownRender}
                    isOpen={activeDropdown === 'category'}
                  />
                </div>
              </div>

              {/* Search Button - Circular on far right */}
              {showSearchButton && (
                <div className="px-3 py-2 flex items-center">
                  <button
                    onClick={() => {
                      handleSearchClick()
                      if (mobileMode === 'overlay' && variant !== 'page') {
                        handleCollapse()
                      }
                    }}
                    className={`w-10 h-10 rounded-full text-white flex items-center justify-center transition-all duration-200 shadow-md hover:shadow-lg flex-shrink-0 ${
                      variant === 'page' 
                        ? 'bg-sunroad-amber-600 hover:bg-sunroad-amber-700' 
                        : 'bg-amber-600 hover:bg-amber-700'
                    }`}
                    aria-label="Search"
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </button>
                </div>
              )}
            </div>

            {/* Shared Dropdown Container - All dropdowns render here (higher z-index for overlay) */}
            {activeDropdown && (
              <div ref={dropdownContainerRef} className={`absolute top-full left-0 w-full mt-2 ${
                mobileMode === 'overlay' ? 'z-[120]' : 'z-[60]'
              }`}>
                {activeDropdown === 'search' && searchDropdownContent}
                {activeDropdown === 'where' && whereDropdownContent}
                {activeDropdown === 'category' && categoryDropdownContent}
              </div>
            )}
              </div>
            </div>,
            document.body
          )}
        </>
      ) : (
        // Inline Mode: Original behavior (expands in place)
        <div 
          className="md:hidden relative" 
          style={{ 
            minHeight: '56px',
            height: expandedHeight && expandedHeight > 0 ? `${expandedHeight}px` : undefined
          }}
        >
          {/* Collapsed State - Simple Input (Normal size) - Only for default variant */}
          {variant !== 'page' && (
            <div 
              ref={placeholderRef}
              onClick={!isExpanded ? (e) => handleExpand(e) : undefined}
              onMouseDown={!isExpanded ? (e) => e.stopPropagation() : undefined}
              onKeyDown={!isExpanded ? (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  handleExpand()
                }
              } : undefined}
              tabIndex={!isExpanded ? 0 : -1}
              role="button"
              aria-label="Open search"
              className={`bg-white border border-gray-200 rounded-full shadow-sm hover:shadow-md cursor-pointer transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 ${
                isExpanded ? 'absolute inset-0 opacity-0 pointer-events-none' : 'relative opacity-100'
              }`}
            >
            <div className="px-4 py-2.5 flex items-center">
              <input
                type="text"
                placeholder="Find local creatives"
                readOnly
                tabIndex={-1}
                className="flex-1 bg-transparent border-0 outline-none text-sm text-gray-500 placeholder-gray-400 cursor-pointer pointer-events-none"
              />
              <svg className="h-5 w-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
          )}

          {/* Expanded State - Full Search Bar (Expands in place from placeholder) */}
          {(isExpanded || variant === 'page') && (
            <div 
              ref={expandedRef}
              className={`${
                variant === 'page'
                  ? 'relative bg-white border border-sunroad-brown-200/60 rounded-2xl shadow-[0_8px_24px_rgba(67,48,43,0.08)]'
                  : 'absolute top-0 left-0 right-0 bg-white border border-gray-200 rounded-2xl shadow-2xl z-[60]'
              } ${
                variant !== 'page' && (isAnimatingOut 
                  ? 'animate-fade-out-slide-up' 
                  : 'animate-fade-in-slide-down')
              } overflow-visible`}
              style={variant === 'page' ? {} : { 
                transition: 'opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1), transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), border-radius 0.3s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
            >
              {/* Close Button - Over the search bar, top right (only for default variant) */}
              {variant !== 'page' && (
                <button
                  onClick={handleCollapse}
                  className="absolute top-3 right-3 z-[70] w-8 h-8 rounded-full bg-white border border-gray-200 shadow-md flex items-center justify-center hover:bg-gray-50 transition-colors"
                  aria-label="Close search"
                >
                <svg className="h-4 w-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                </button>
              )}

              {/* First Row: Search Input */}
              <div 
                ref={searchRef}
                className={`px-4 py-3 border-b border-gray-100 transition-colors relative ${
                  activeSegment === 'search' && variant === 'page'
                    ? 'bg-white rounded-t-xl'
                    : activeSegment === 'search'
                    ? 'bg-gray-50'
                    : ''
                }`}
                onClick={(e) => {
                  if (activeSegment !== 'search') {
                    handleSegmentActivate('search')
                    const input = searchRef.current?.querySelector('input[role="combobox"]') as HTMLInputElement
                    input?.focus()
                  }
                }}
              >
                <SearchBar
                  placeholder={placeholder}
                  className="w-full"
                  categoryIds={selectedCategoryIds}
                  locationIds={locationIds}
                  onResultClick={onResultClick}
                  embedded={true}
                  isActive={activeSegment === 'search'}
                  onFocusChange={handleSearchFocusChange}
                  onQueryChange={setSearchQuery}
                  showLabel={false}
                  disableDropdown={variant === 'page'}
                  value={variant === 'page' ? searchQuery : undefined}
                  onSearch={handleSearchClick}
                  renderDropdownInParent={true}
                  onDropdownRender={handleSearchDropdownRender}
                  nearMeCoords={isNearMe ? nearMeCoords : null}
                />
              </div>

              {/* Second Row: Where and Category Filters */}
              <div className="flex items-center divide-x divide-gray-200 relative overflow-visible">
                {/* Where Filter */}
                <div 
                  ref={whereRef}
                  className={`flex-1 px-4 py-3 transition-colors cursor-pointer relative ${
                    activeSegment === 'where' && variant === 'page'
                      ? 'bg-white rounded-l-xl'
                      : activeSegment === 'where'
                      ? 'bg-gray-50'
                      : 'hover:bg-gray-50/50'
                  }`}
                  onClick={(e) => {
                    if (activeDropdown !== 'where') {
                      handleSegmentActivate('where')
                    } else {
                      // If already active, toggle dropdown
                      setActiveDropdown(prev => prev === 'where' ? null : 'where')
                    }
                  }}
                >
                  <div className="text-xs font-semibold text-gray-900 mb-0.5 flex items-center gap-1.5">
                    <svg className="h-3.5 w-3.5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Where
                  </div>
                  <div className="text-sm text-gray-500 min-w-0">
                    <WhereFilterPill 
                      selectedLocation={selectedLocation}
                      onChange={setSelectedLocation}
                      embedded={true}
                      onActiveChange={handleWhereActiveChange}
                      showLabel={false}
                      renderDropdownInParent={true}
                      onDropdownRender={handleWhereDropdownRender}
                      isOpen={activeDropdown === 'where'}
                    />
                  </div>
                </div>

                {/* Category Filter */}
                <div 
                  ref={categoryRef}
                  className={`flex-1 px-4 py-3 transition-colors cursor-pointer relative ${
                    activeSegment === 'category' && variant === 'page'
                      ? 'bg-white rounded-r-xl'
                      : activeSegment === 'category'
                      ? 'bg-gray-50'
                      : 'hover:bg-gray-50/50'
                  }`}
                  onClick={(e) => {
                    if (activeDropdown !== 'category') {
                      handleSegmentActivate('category')
                    } else {
                      // If already active, toggle dropdown
                      setActiveDropdown(prev => prev === 'category' ? null : 'category')
                    }
                  }}
                >
                  <div className="text-xs font-semibold text-gray-900 mb-0.5 flex items-center gap-1.5">
                    <svg className="h-3.5 w-3.5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                    </svg>
                    What
                  </div>
                  <div className="text-sm text-gray-500 min-w-0">
                    <CategoryFilterPill
                      selectedIds={selectedCategoryIds}
                      onChange={setSelectedCategoryIds}
                      embedded={true}
                      isActive={activeSegment === 'category'}
                      onActiveChange={handleCategoryActiveChange}
                      showLabel={false}
                      subtitle="Category"
                      renderDropdownInParent={true}
                      onDropdownRender={handleCategoryDropdownRender}
                      isOpen={activeDropdown === 'category'}
                    />
                  </div>
                </div>

                {/* Search Button - Circular on far right */}
                {showSearchButton && (
                  <div className="px-3 py-2 flex items-center">
                    <button
                      onClick={handleSearchClick}
                      className={`w-10 h-10 rounded-full text-white flex items-center justify-center transition-all duration-200 shadow-md hover:shadow-lg flex-shrink-0 ${
                        variant === 'page' 
                          ? 'bg-sunroad-amber-600 hover:bg-sunroad-amber-700' 
                          : 'bg-amber-600 hover:bg-amber-700'
                      }`}
                      aria-label="Search"
                    >
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>

              {/* Shared Dropdown Container - All dropdowns render here */}
              {activeDropdown && (
                <div ref={dropdownContainerRef} className="absolute top-full left-0 w-full mt-2 z-[60]">
                  {activeDropdown === 'search' && searchDropdownContent}
                  {activeDropdown === 'where' && whereDropdownContent}
                  {activeDropdown === 'category' && categoryDropdownContent}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Desktop Layout - Unified Airbnb-style Bar */}
      <div className="hidden md:block relative overflow-visible" style={{ height: '80px' }}>
        {/* Single Container - Morphs between collapsed and expanded */}
        <div 
          ref={desktopContainerRef}
          onClick={!isExpanded && variant !== 'page' ? (e) => {
            e.stopPropagation()
            handleExpand(e)
          } : undefined}
          onMouseDown={!isExpanded && variant !== 'page' ? (e) => e.stopPropagation() : undefined}
          onKeyDown={!isExpanded && variant !== 'page' ? (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              e.stopPropagation()
              handleExpand()
            }
          } : undefined}
          tabIndex={!isExpanded && variant !== 'page' ? 0 : -1}
          role={!isExpanded && variant !== 'page' ? "button" : undefined}
          aria-label={!isExpanded && variant !== 'page' ? "Open search" : undefined}
          className={`relative overflow-visible absolute inset-x-0 top-0 ${
            variant === 'page' 
              ? 'bg-gray-100 border border-sunroad-brown-200/60 shadow-[0_8px_24px_rgba(67,48,43,0.08)] max-w-full mx-0'
              : 'bg-gray-100 border border-gray-200 shadow-lg hover:shadow-xl cursor-pointer max-w-2xl mx-auto'
          } transition-all duration-300 ease-out focus:outline-none focus:ring-2 focus:ring-sunroad-amber-500 focus:ring-offset-2 ${
            variant === 'page'
              ? 'rounded-full'
              : isExpanded 
                ? isAnimatingOut 
                  ? 'animate-fade-out-slide-up rounded-full' 
                  : 'animate-fade-in-slide-down rounded-full'
                : 'rounded-full shadow-sm hover:shadow-md'
          }`}
          style={{ 
            height: variant === 'page' ? '80px' : (isExpanded ? '80px' : '56px'),
            borderRadius: '9999px',
            transition: variant === 'page' ? 'none' : 'height 0.3s cubic-bezier(0.4, 0, 0.2, 1), border-radius 0.3s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1), transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
          }}
        >
          {/* Moving Pill - Highlights active segment */}
          {(isExpanded && !isAnimatingOut) || variant === 'page' ? (
            <div
              ref={pillRef}
              className="absolute top-2 bottom-2 bg-white rounded-full shadow-sm z-0"
              style={{
                left: 0,
                width: '0px',
                transform: 'translateX(0px)',
                transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), width 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
            />
          ) : null}
          {/* Collapsed State Content - Only show for default variant */}
          {!isExpanded && variant !== 'page' ? (
            <div className="px-6 py-3 flex items-center h-full">
              <input
                type="text"
                placeholder="Find local creatives"
                readOnly
                className="flex-1 bg-transparent border-0 outline-none text-sm text-gray-500 placeholder-gray-400 cursor-pointer"
              />
              <svg className="h-5 w-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          ) : (
            /* Expanded State Content */
            <div className="flex items-stretch h-full w-full relative z-10">
              {/* Segment 1: Search */}
              <div 
                ref={searchRef}
                className={`flex-[2] min-w-0 relative transition-colors duration-200 rounded-l-full cursor-pointer z-10 ${
                  activeSegment === 'search' 
                    ? 'bg-transparent'
                    : 'hover:bg-gray-50/30'
                }`}
                onClick={(e) => {
                  e.stopPropagation()
                  if (activeSegment !== 'search') {
                    handleSegmentActivate('search')
                    const input = searchRef.current?.querySelector('input[role="combobox"]') as HTMLInputElement
                    input?.focus()
                  }
                }}
              >
                <div className="px-6 py-4 h-full flex flex-col justify-center min-w-0 relative z-10">
                  <div className={`text-xs font-semibold mb-0.5 flex items-center gap-1.5 ${
                    variant === 'page' ? 'text-sunroad-brown-700 font-body' : 'text-gray-900'
                  }`}>
                    <svg className={`h-3.5 w-3.5 ${
                      variant === 'page' ? 'text-sunroad-brown-600' : 'text-gray-600'
                    }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    Search
                  </div>
                  <SearchBar
                    placeholder="Find local creatives"
                    className="w-full"
                    categoryIds={selectedCategoryIds}
                    locationIds={locationIds}
                    onResultClick={onResultClick}
                    embedded={true}
                    isActive={activeSegment === 'search'}
                    onFocusChange={handleSearchFocusChange}
                    onQueryChange={setSearchQuery}
                    showLabel={false}
                    disableDropdown={variant === 'page'}
                    value={variant === 'page' ? searchQuery : undefined}
                    onSearch={handleSearchClick}
                    renderDropdownInParent={true}
                    onDropdownRender={handleSearchDropdownRender}
                    nearMeCoords={isNearMe ? nearMeCoords : null}
                  />
                </div>
              </div>

              {/* Divider */}
              <div className="border-l border-gray-200 self-stretch my-2" />

              {/* Segment 2: Where */}
              <div 
                ref={whereRef}
                className={`flex-[1] min-w-0 relative transition-colors duration-200 cursor-pointer z-10 ${
                  activeSegment === 'where' 
                    ? 'bg-transparent'
                    : 'hover:bg-gray-50/30'
                }`}
                onClick={(e) => {
                  e.stopPropagation()
                  if (activeDropdown !== 'where') {
                    handleSegmentActivate('where')
                  } else {
                    // If already active, toggle dropdown
                    setActiveDropdown(prev => prev === 'where' ? null : 'where')
                  }
                }}
              >
                <div className="px-6 py-4 h-full flex flex-col justify-center min-w-0 relative z-10">
                  <div className={`text-xs font-semibold mb-0.5 flex items-center gap-1.5 ${
                    variant === 'page' ? 'text-sunroad-brown-700 font-body' : 'text-gray-900'
                  }`}>
                    <svg className={`h-3.5 w-3.5 ${
                      variant === 'page' ? 'text-sunroad-brown-600' : 'text-gray-600'
                    }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Where
                  </div>
                <div className="text-sm text-gray-500 min-w-0">
                  <WhereFilterPill 
                    selectedLocation={selectedLocation}
                    onChange={handleLocationChange}
                    embedded={true}
                    onActiveChange={handleWhereActiveChange}
                    showLabel={false}
                    renderDropdownInParent={true}
                    onDropdownRender={handleWhereDropdownRender}
                    isOpen={activeDropdown === 'where'}
                    isNearMe={isNearMe}
                    onNearMeChange={handleNearMeChange}
                    nearMeCoords={nearMeCoords}
                  />
                </div>
                </div>
              </div>

              {/* Divider */}
              <div className="border-l border-gray-200 self-stretch my-2" />

              {/* Segment 3: What (Category) */}
              <div 
                ref={categoryRef}
                className={`flex-[1] min-w-0 relative transition-colors duration-200 cursor-pointer z-10 ${
                  activeSegment === 'category' 
                    ? 'bg-transparent'
                    : 'hover:bg-gray-50/30'
                }`}
                onClick={(e) => {
                  e.stopPropagation()
                  if (activeDropdown !== 'category') {
                    handleSegmentActivate('category')
                  } else {
                    // If already active, toggle dropdown
                    setActiveDropdown(prev => prev === 'category' ? null : 'category')
                  }
                }}
              >
                <div className="px-6 py-4 h-full flex flex-col justify-center min-w-0 relative z-10">
                  <div className={`text-xs font-semibold mb-0.5 flex items-center gap-1.5 ${
                    variant === 'page' ? 'text-sunroad-brown-700 font-body' : 'text-gray-900'
                  }`}>
                    <svg className={`h-3.5 w-3.5 ${
                      variant === 'page' ? 'text-sunroad-brown-600' : 'text-gray-600'
                    }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                    </svg>
                    What
                  </div>
                  <div className="text-sm text-gray-500 min-w-0">
                    <CategoryFilterPill
                      selectedIds={selectedCategoryIds}
                      onChange={setSelectedCategoryIds}
                      embedded={true}
                      isActive={activeSegment === 'category'}
                      onActiveChange={handleCategoryActiveChange}
                      showLabel={false}
                      subtitle="Category"
                      renderDropdownInParent={true}
                      onDropdownRender={handleCategoryDropdownRender}
                      isOpen={activeDropdown === 'category'}
                    />
                  </div>
                </div>
              </div>

              {/* Search Button - Circular on far right */}
              <div className="flex items-center justify-center px-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleSearchClick()
                  }}
                  className="w-12 h-12 rounded-full bg-amber-600 hover:bg-amber-700 text-white flex items-center justify-center transition-all duration-200 shadow-md hover:shadow-lg flex-shrink-0 relative z-10"
                  aria-label="Search"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
              </div>
            </div>
          )}

          {/* Shared Dropdown Container - Desktop - All dropdowns render here */}
          {activeDropdown && (
            <div ref={dropdownContainerRef} className="absolute top-full left-0 w-full mt-2 z-[60]">
              {activeDropdown === 'search' && searchDropdownContent}
              {activeDropdown === 'where' && whereDropdownContent}
              {activeDropdown === 'category' && categoryDropdownContent}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}


