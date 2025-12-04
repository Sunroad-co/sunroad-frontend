'use client'

import { useRef, useEffect } from 'react'
import SearchBar from './search-bar'
import WhereFilterPill from './where-filter-pill'
import CategoryFilterPill from './category-filter-pill'

interface ArtistSearchPageControlsProps {
  query: string
  onQueryChange: (query: string) => void
  selectedCategoryIds: number[]
  onCategoryChange: (ids: number[]) => void
  activeSegment: 'search' | 'where' | 'category' | null
  onSegmentActivate: (segment: 'search' | 'where' | 'category' | null) => void
}

export default function ArtistSearchPageControls({
  query,
  onQueryChange,
  selectedCategoryIds,
  onCategoryChange,
  activeSegment,
  onSegmentActivate
}: ArtistSearchPageControlsProps) {
  const searchRef = useRef<HTMLDivElement>(null)
  const whereRef = useRef<HTMLDivElement>(null)
  const categoryRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const pillRef = useRef<HTMLDivElement>(null)

  const handleSearchFocusChange = (isFocused: boolean) => {
    onSegmentActivate(isFocused ? 'search' : null)
  }

  const handleWhereActiveChange = (isActive: boolean) => {
    onSegmentActivate(isActive ? 'where' : null)
  }

  const handleCategoryActiveChange = (isActive: boolean) => {
    onSegmentActivate(isActive ? 'category' : null)
  }

  // Update pill position when active segment changes (desktop only)
  useEffect(() => {
    if (!containerRef.current || !pillRef.current) return

    const updatePillPosition = () => {
      if (!containerRef.current || !pillRef.current) return

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

      if (targetElement && containerRef.current) {
        const containerRect = containerRef.current.getBoundingClientRect()
        const targetRect = targetElement.getBoundingClientRect()
        const left = targetRect.left - containerRect.left
        const width = targetRect.width

        pillRef.current.style.transform = `translateX(${left}px)`
        pillRef.current.style.width = `${width}px`
      }
    }

    // Small delay to ensure layout is complete
    const timer = setTimeout(updatePillPosition, 50)
    updatePillPosition() // Also call immediately

    // Update on resize
    window.addEventListener('resize', updatePillPosition)
    return () => {
      clearTimeout(timer)
      window.removeEventListener('resize', updatePillPosition)
    }
  }, [activeSegment])

  return (
    <div className="w-full">
      {/* Mobile Layout */}
      <div className="md:hidden space-y-0">
        {/* First Row: Search Input */}
        <div 
          ref={searchRef}
          className={`px-4 py-3 border-b border-gray-100 transition-colors ${
            activeSegment === 'search' ? 'bg-gray-50' : ''
          }`}
          onClick={() => {
            if (activeSegment !== 'search') {
              onSegmentActivate('search')
              const input = searchRef.current?.querySelector('input[role="combobox"]') as HTMLInputElement
              input?.focus()
            }
          }}
        >
          <SearchBar
            placeholder="Find local creatives"
            className="w-full"
            categoryIds={selectedCategoryIds}
            embedded={true}
            isActive={activeSegment === 'search'}
            onFocusChange={handleSearchFocusChange}
            onQueryChange={onQueryChange}
            showLabel={false}
            disableDropdown={true}
            value={query}
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
            onClick={() => {
              if (activeSegment !== 'where') {
                onSegmentActivate('where')
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
                onChange={onCategoryChange}
                embedded={true}
                isActive={activeSegment === 'category'}
                onActiveChange={handleCategoryActiveChange}
                showLabel={false}
                subtitle="Category"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Desktop Layout - Unified Airbnb-style Bar */}
      <div className="hidden md:block">
        <div 
          ref={containerRef}
          className="bg-gray-100 border border-gray-200 rounded-full shadow-lg max-w-2xl mx-auto relative"
        >
          <div className="flex items-stretch h-20 w-full relative">
            {/* Moving Pill - Highlights active segment */}
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

            {/* Segment 1: Search */}
            <div 
              ref={searchRef}
              className={`flex-[2] min-w-0 relative transition-colors duration-200 rounded-l-full cursor-pointer z-10 ${
                activeSegment === 'search' 
                  ? 'bg-transparent' 
                  : 'hover:bg-gray-50/30'
              }`}
              onClick={() => {
                if (activeSegment !== 'search') {
                  onSegmentActivate('search')
                  const input = searchRef.current?.querySelector('input[role="combobox"]') as HTMLInputElement
                  input?.focus()
                }
              }}
            >
              <div className="px-6 py-4 h-full flex flex-col justify-center min-w-0 relative z-10">
                <div className="text-xs font-semibold text-gray-900 mb-0.5 flex items-center gap-1.5">
                  <svg className="h-3.5 w-3.5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  Search
                </div>
                <SearchBar
                  placeholder="Find local creatives"
                  className="w-full"
                  categoryIds={selectedCategoryIds}
                  embedded={true}
                  isActive={activeSegment === 'search'}
                  onFocusChange={handleSearchFocusChange}
                  onQueryChange={onQueryChange}
                  showLabel={false}
                  disableDropdown={true}
                  value={query}
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
              onClick={() => {
                if (activeSegment !== 'where') {
                  onSegmentActivate('where')
                }
              }}
            >
              <div className="px-6 py-4 h-full flex flex-col justify-center min-w-0 relative z-10">
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
                <div className="text-xs font-semibold text-gray-900 mb-0.5 flex items-center gap-1.5">
                  <svg className="h-3.5 w-3.5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                  What
                </div>
                <div className="text-sm text-gray-500 min-w-0">
                  <CategoryFilterPill
                    selectedIds={selectedCategoryIds}
                    onChange={onCategoryChange}
                    embedded={true}
                    isActive={activeSegment === 'category'}
                    onActiveChange={handleCategoryActiveChange}
                    showLabel={false}
                    subtitle="Category"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

