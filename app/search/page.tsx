'use client'

import { useState, useEffect, useRef, useCallback, Suspense, useMemo } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import ArtistSearchControls from '@/components/artist-search-controls'
import ArtistResultCard from '@/components/artist-result-card'
import { useArtistSearchResults } from '@/hooks/use-artist-search-results'
import type { Location } from '@/hooks/use-location-search'
import type { NearMeCoords } from '@/components/where-filter-pill'
import { createClient } from '@/lib/supabase/client'
import Toast from '@/components/ui/toast'

// Infinite scroll sentinel component
function InfiniteScrollSentinel({ 
  onIntersect, 
  hasMore, 
  loading 
}: { 
  onIntersect: () => void
  hasMore: boolean
  loading: boolean
}) {
  const sentinelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!sentinelRef.current || !hasMore || loading) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          onIntersect()
        }
      },
      { threshold: 0.1 }
    )

    observer.observe(sentinelRef.current)

    return () => {
      observer.disconnect()
    }
  }, [onIntersect, hasMore, loading])

  if (!hasMore) return null

  return (
    <div ref={sentinelRef} className="h-10 w-full" />
  )
}

// Loading skeleton for results
function ResultsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="bg-white rounded-lg border border-sunroad-brown-200/50 shadow-sm p-4 animate-pulse">
          <div className="flex items-start space-x-4">
            <div className="w-16 h-16 bg-sunroad-brown-100 rounded-full flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-5 bg-sunroad-brown-100 rounded w-3/4" />
              <div className="h-4 bg-sunroad-brown-100 rounded w-1/2" />
              <div className="h-4 bg-sunroad-brown-100 rounded w-2/3" />
              <div className="h-4 bg-sunroad-brown-100 rounded w-full" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function SearchPageContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  
  // Read initial values from URL
  const initialQuery = searchParams.get('q') || ''
  const initialCategories = searchParams.get('categories')?.split(',').map(Number).filter(Boolean) || []
  
  // Check for near-me params
  const initialIsNearMe = searchParams.get('near') === '1'
  const initialNearMeCoords: NearMeCoords | null = useMemo(() => {
    if (!initialIsNearMe) return null
    const lat = searchParams.get('lat')
    const lon = searchParams.get('lon')
    if (lat && lon) {
      const latNum = parseFloat(lat)
      const lonNum = parseFloat(lon)
      if (!isNaN(latNum) && !isNaN(lonNum)) {
        return { lat: latNum, lon: lonNum }
      }
    }
    return null
  }, [searchParams, initialIsNearMe])
  
  // Reconstruct location from URL params (no API call needed!)
  const initialLocation: Location | null = useMemo(() => {
    // Don't load location if near-me is active
    if (initialIsNearMe) return null
    
    const locationId = searchParams.get('location_id')
    if (!locationId) return null
    
    return {
      id: Number(locationId),
      formatted: searchParams.get('location_formatted') || '',
      city: searchParams.get('location_city') || null,
      state: searchParams.get('location_state') || null,
      state_code: searchParams.get('location_state_code') || null,
      country_code: searchParams.get('location_country_code') || null,
      artist_count: searchParams.get('location_artist_count') ? Number(searchParams.get('location_artist_count')) : 0
    }
  }, [searchParams, initialIsNearMe])

  // Local state
  const [query, setQuery] = useState(initialQuery)
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>(initialCategories)
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(initialLocation)
  const [isNearMe, setIsNearMe] = useState(initialIsNearMe)
  const [nearMeCoords, setNearMeCoords] = useState<NearMeCoords | null>(initialNearMeCoords)
  const [activeSegment, setActiveSegment] = useState<'search' | 'where' | 'category' | null>(null)
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [toastVisible, setToastVisible] = useState(false)

  // Update location if URL params change
  useEffect(() => {
    if (initialLocation) {
      setSelectedLocation(initialLocation)
      setIsNearMe(false)
      setNearMeCoords(null)
    }
  }, [initialLocation])

  // Handle near-me hydration from URL
  useEffect(() => {
    if (initialIsNearMe && initialNearMeCoords) {
      setIsNearMe(true)
      setNearMeCoords(initialNearMeCoords)
      setSelectedLocation(null)
    } else if (initialIsNearMe && !initialNearMeCoords) {
      // near=1 but missing coords - show toast and ignore
      setToastMessage('Location unavailable. Please try selecting "Near me" again.')
      setToastVisible(true)
      setIsNearMe(false)
      setNearMeCoords(null)
    }
  }, [initialIsNearMe, initialNearMeCoords])

  // Handle near-me change
  const handleNearMeChange = useCallback((newIsNearMe: boolean, coords?: NearMeCoords | null) => {
    setIsNearMe(newIsNearMe)
    setNearMeCoords(coords ?? null)
    // Clear location when near-me is activated
    if (newIsNearMe) {
      setSelectedLocation(null)
    }
  }, [])

  // Handle location change - clear near-me when location is selected
  const handleLocationChange = useCallback((location: Location | null) => {
    setSelectedLocation(location)
    // Clear near-me when location is selected
    if (location) {
      setIsNearMe(false)
      setNearMeCoords(null)
    }
  }, [])

  // Memoize locationIds array to prevent infinite loops
  const locationIds = useMemo(() => {
    // Don't use location_ids when near-me is active
    if (isNearMe) return undefined
    return selectedLocation ? [selectedLocation.id] : undefined
  }, [selectedLocation?.id, isNearMe])

  // Sync URL when state changes (only if different from current URL)
  useEffect(() => {
    const params = new URLSearchParams()
    if (query.trim()) {
      params.set('q', query.trim())
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
    const newUrl = `/search${queryString ? `?${queryString}` : ''}`
    
    // Only update URL if it's different from current
    const currentUrl = window.location.pathname + window.location.search
    if (newUrl !== currentUrl) {
      router.replace(newUrl, { scroll: false })
    }
  }, [query, selectedCategoryIds, selectedLocation, isNearMe, nearMeCoords, router])

  // Memoize categoryIds to prevent unnecessary re-renders
  const categoryIds = useMemo(() => {
    return selectedCategoryIds.length > 0 ? selectedCategoryIds : undefined
  }, [selectedCategoryIds.join(',')])

  // Use search results hook
  const {
    results,
    loading,
    error,
    hasMore,
    loadMore,
    refetch
  } = useArtistSearchResults({
    query,
    categoryIds,
    locationIds,
    limit: 20,
    enabled: true,
    nearMeCoords: isNearMe ? nearMeCoords : null,
    radiusKm: 80 // ~50 miles
  })

  const handleLoadMore = useCallback(() => {
    if (!loading && hasMore) {
      loadMore()
    }
  }, [loading, hasMore, loadMore])

  // Check if we have any search criteria
  const hasSearchCriteria = query.trim().length > 0 || selectedCategoryIds.length > 0 || selectedLocation !== null || isNearMe

  return (
    <main className="min-h-screen bg-sunroad-cream font-body">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Sticky Search Section - Below Navbar */}
        <section className="sticky top-[4.5rem] md:top-20 z-40 bg-sunroad-cream/95 backdrop-blur-sm border-b border-sunroad-amber-100 pb-4 pt-4">
          <h1 className="text-2xl font-display font-semibold text-sunroad-brown-900 mb-4">
            Find local creatives
          </h1>
          <ArtistSearchControls
            variant="page"
            placeholder="Search for local creatives..."
            showSearchButton={false}
            query={query}
            onQueryChange={setQuery}
            selectedCategoryIds={selectedCategoryIds}
            onCategoryChange={setSelectedCategoryIds}
            selectedLocation={selectedLocation}
            onLocationChange={handleLocationChange}
            isNearMe={isNearMe}
            onNearMeChange={handleNearMeChange}
            nearMeCoords={nearMeCoords}
          />
        </section>

        {/* Results Section - Normal page scroll */}
        <section className="pt-6 pb-12">
          {/* Empty State - No search criteria */}
          {!hasSearchCriteria && !loading && (
            <div className="text-center py-16">
              <h2 className="text-2xl font-display font-semibold text-sunroad-brown-900 mb-2">
                Discover local creatives
              </h2>
              <p className="text-sunroad-brown-600 font-body mb-8">
                Start searching to find artists in your area
              </p>
            </div>
          )}

          {/* Loading State - Initial Load */}
          {loading && results.length === 0 && hasSearchCriteria && (
            <div>
              <h2 className="text-xl font-body font-semibold text-sunroad-brown-900 mb-6">
                Searching...
              </h2>
              <ResultsSkeleton />
            </div>
          )}

          {/* Error State */}
          {error && results.length === 0 && (
            <div className="text-center py-16">
              <div className="max-w-md mx-auto">
                <div className="mb-4">
                  <svg className="mx-auto h-12 w-12 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-body font-semibold text-sunroad-brown-900 mb-2">
                  Something went wrong
                </h3>
                <p className="text-sunroad-brown-600 font-body mb-6">{error}</p>
                <button
                  onClick={refetch}
                  className="px-4 py-2 bg-sunroad-amber-600 text-white rounded-lg hover:bg-sunroad-amber-700 transition-colors font-medium"
                >
                  Try again
                </button>
              </div>
            </div>
          )}

          {/* Results Grid */}
          {results.length > 0 && (
            <>
              <div className="mb-6">
              <h2 className="text-xl font-body font-semibold text-sunroad-brown-900">
                {results.length} {results.length === 1 ? 'result' : 'results'}
                {query && ` for "${query}"`}
              </h2>
              </div>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {results.map((artist) => (
                  <ArtistResultCard key={artist.id} artist={artist} />
                ))}
              </div>

              {/* Infinite Scroll Sentinel */}
              <InfiniteScrollSentinel
                onIntersect={handleLoadMore}
                hasMore={hasMore}
                loading={loading}
              />

              {/* Loading More Indicator */}
              {loading && results.length > 0 && (
                <div className="mt-8 text-center">
                  <div className="inline-flex items-center space-x-2 text-sunroad-brown-600 font-body">
                    <div className="animate-spin h-5 w-5 border-2 border-sunroad-amber-500 border-t-transparent rounded-full" />
                    <span>Loading more results...</span>
                  </div>
                </div>
              )}

              {/* End of Results */}
              {!hasMore && results.length > 0 && (
              <div className="mt-8 text-center text-sunroad-brown-500 font-body">
                <p>No more results to load</p>
              </div>
              )}
            </>
          )}

          {/* No Results State */}
          {!loading && hasSearchCriteria && results.length === 0 && !error && (
            <div className="text-center py-16">
              <div className="max-w-md mx-auto">
                <div className="mb-4">
                  <svg className="mx-auto h-12 w-12 text-sunroad-brown-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-body font-semibold text-sunroad-brown-900 mb-2">
                  No artists found
                </h3>
                <p className="text-sunroad-brown-600 font-body">
                  Try adjusting your search terms or filters to find more results.
                </p>
              </div>
            </div>
          )}
        </section>
      </div>
      {/* Toast for errors */}
      <Toast
        message={toastMessage || ''}
        isVisible={toastVisible}
        onClose={() => {
          setToastVisible(false)
          setToastMessage(null)
        }}
      />
    </main>
  )
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-sunroad-cream font-body">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-12">
          <div className="text-center py-16">
            <div className="animate-spin h-8 w-8 border-2 border-sunroad-amber-500 border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-sunroad-brown-600 font-body">Loading search...</p>
          </div>
        </div>
      </main>
    }>
      <SearchPageContent />
    </Suspense>
  )
}

