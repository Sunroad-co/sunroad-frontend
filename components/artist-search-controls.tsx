'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import SearchBar from './search-bar'
import CategoryFilterPill from './category-filter-pill'
import WhereFilterPill from './where-filter-pill'

interface ArtistSearchControlsProps {
  placeholder?: string
  className?: string
  onResultClick?: () => void
  variant?: 'default' | 'page'
  showSearchButton?: boolean
  // Controlled props for variant="page"
  query?: string
  onQueryChange?: (query: string) => void
  selectedCategoryIds?: number[]
  onCategoryChange?: (ids: number[]) => void
}

export default function ArtistSearchControls({
  placeholder = "Search artists or categories...",
  className = "",
  onResultClick,
  variant = 'default',
  showSearchButton = true,
  query: controlledQuery,
  onQueryChange,
  selectedCategoryIds: controlledCategoryIds,
  onCategoryChange
}: ArtistSearchControlsProps) {
  const router = useRouter()
  const [internalCategoryIds, setInternalCategoryIds] = useState<number[]>([])
  const [internalSearchQuery, setInternalSearchQuery] = useState('')
  
  // Use controlled props if provided (for variant="page"), otherwise use internal state
  const selectedCategoryIds = controlledCategoryIds ?? internalCategoryIds
  const searchQuery = controlledQuery ?? internalSearchQuery
  const setSelectedCategoryIds = onCategoryChange ?? setInternalCategoryIds
  const setSearchQuery = onQueryChange ?? setInternalSearchQuery
  
  const [activeSegment, setActiveSegment] = useState<'search' | 'where' | 'category' | null>(null)
  // For 'page' variant, always expanded; for 'default', use state
  const [isExpanded, setIsExpanded] = useState(variant === 'page')
  const [isAnimatingOut, setIsAnimatingOut] = useState(false)
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

  // Close other segments when one becomes active - memoized to prevent infinite loops
  const handleSegmentActivate = useCallback((segment: 'search' | 'where' | 'category' | null) => {
    setActiveSegment(prev => prev !== segment ? segment : prev)
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
    }, 300) // Match animation duration
  }, [variant])

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

  // Update pill position when active segment changes
  useEffect(() => {
    if (!isExpanded || isAnimatingOut || !desktopContainerRef.current || !pillRef.current) return

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
  }, [activeSegment, isExpanded, isAnimatingOut])

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
        !isAnimatingOut &&
        containerRef.current &&
        !containerRef.current.contains(document.activeElement)
      ) {
        handleCollapse()
      }
    }, 150)
  }, [activeSegment, searchQuery, isAnimatingOut, handleCollapse])

  // Collapse when clicking outside (only if no active segment and no query)
  useEffect(() => {
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
  }, [isExpanded, activeSegment, searchQuery, isAnimatingOut, handleCollapse])

  // Memoized callbacks to prevent infinite loops
  const handleSearchFocusChange = useCallback((isFocused: boolean) => {
    handleSegmentActivate(isFocused ? 'search' : null)
    if (isFocused) {
      setIsExpanded(true)
      setIsAnimatingOut(false)
      // Ensure search segment is active when focused
      if (!activeSegment) {
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
    const queryString = params.toString()
    router.push(`/search${queryString ? `?${queryString}` : ''}`)
  }, [searchQuery, selectedCategoryIds, router])

  return (
    <div ref={containerRef} className={`w-full ${className}`}>
      {/* Mobile Layout - Unified Search Bar */}
      <div className="md:hidden relative">
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
              isExpanded ? 'invisible' : 'visible'
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
            }`}
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
              className={`px-4 py-3 border-b border-gray-100 transition-colors ${
                activeSegment === 'search' ? 'bg-gray-50' : ''
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
                onResultClick={onResultClick}
                embedded={true}
                isActive={activeSegment === 'search'}
                onFocusChange={handleSearchFocusChange}
                onQueryChange={setSearchQuery}
                showLabel={false}
                disableDropdown={variant === 'page'}
                value={variant === 'page' ? searchQuery : undefined}
                onSearch={handleSearchClick}
              />
            </div>

            {/* Second Row: Where and Category Filters */}
            <div className="flex items-center divide-x divide-gray-200">
              {/* Where Filter */}
              <div 
                ref={whereRef}
                className={`flex-1 px-4 py-3 transition-colors cursor-pointer ${
                  activeSegment === 'where' ? 'bg-gray-50' : 'hover:bg-gray-50/50'
                }`}
                onClick={(e) => {
                  if (activeSegment !== 'where') {
                    handleSegmentActivate('where')
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
                    embedded={true}
                    onActiveChange={handleWhereActiveChange}
                    showLabel={false}
                  />
                </div>
              </div>

              {/* Category Filter */}
              <div 
                ref={categoryRef}
                className={`flex-1 px-4 py-3 transition-colors cursor-pointer ${
                  activeSegment === 'category' ? 'bg-gray-50' : 'hover:bg-gray-50/50'
                }`}
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
                    subtitle="Category filter"
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
          </div>
        )}
      </div>

      {/* Desktop Layout - Unified Airbnb-style Bar */}
      <div className="hidden md:block relative" style={{ height: '80px' }}>
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
          className={`absolute inset-x-0 top-0 ${
            variant === 'page' 
              ? 'bg-white border border-sunroad-brown-200/60 shadow-[0_8px_24px_rgba(67,48,43,0.08)] max-w-full mx-0'
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
          {isExpanded && !isAnimatingOut && (
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
          )}
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
                    onResultClick={onResultClick}
                    embedded={true}
                    isActive={activeSegment === 'search'}
                    onFocusChange={handleSearchFocusChange}
                    onQueryChange={setSearchQuery}
                    showLabel={false}
                    disableDropdown={variant === 'page'}
                    value={variant === 'page' ? searchQuery : undefined}
                    onSearch={handleSearchClick}
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
                  if (activeSegment !== 'where') {
                    handleSegmentActivate('where')
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
                      embedded={true}
                      onActiveChange={handleWhereActiveChange}
                      showLabel={false}
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
                onClick={(e) => e.stopPropagation()}
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
                      subtitle="Category filter"
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
        </div>
      </div>
    </div>
  )
}

