import { useState, useEffect, useCallback, useRef } from 'react'
import { searchArtists, type SearchResult } from '@/lib/search-artists'

interface UseArtistSearchResultsParams {
  query: string
  categoryIds?: number[]
  locationIds?: number[]
  limit?: number
  enabled?: boolean
  // Near-me params
  nearMeCoords?: { lat: number; lon: number } | null
  radiusKm?: number
}

interface UseArtistSearchResultsReturn {
  results: SearchResult[]
  loading: boolean
  error: string | null
  hasMore: boolean
  loadMore: () => void
  refetch: () => void
  totalCount: number
}

export function useArtistSearchResults({
  query,
  categoryIds,
  locationIds,
  limit = 20,
  enabled = true,
  nearMeCoords,
  radiusKm = 80
}: UseArtistSearchResultsParams): UseArtistSearchResultsReturn {
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(true)
  const [offset, setOffset] = useState(0)
  const [totalCount, setTotalCount] = useState(0)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  
  // Track if we're currently fetching to prevent duplicate calls
  const fetchingRef = useRef(false)
  const currentQueryRef = useRef(query)
  const currentCategoryIdsRef = useRef(categoryIds)
  const currentLocationIdsRef = useRef(locationIds)
  const currentNearMeCoordsRef = useRef(nearMeCoords)

  // Update refs when params change
  useEffect(() => {
    currentQueryRef.current = query
    currentCategoryIdsRef.current = categoryIds
    currentLocationIdsRef.current = locationIds
    currentNearMeCoordsRef.current = nearMeCoords
  }, [query, categoryIds, locationIds, nearMeCoords])

  const performSearch = useCallback(async (
    searchQuery: string,
    categoryIdsParam: number[] | undefined,
    locationIdsParam: number[] | undefined,
    currentOffset: number,
    append: boolean = false
  ) => {
    // Prevent duplicate calls
    if (fetchingRef.current) return
    
    fetchingRef.current = true
    
    if (!append) {
      setLoading(true)
    } else {
      setIsLoadingMore(true)
    }
    setError(null)

    try {
      // Determine if we should use near-me search
      const nearMeCoords = currentNearMeCoordsRef.current
      const shouldUseNearMe = nearMeCoords !== null && nearMeCoords !== undefined
      
      const searchResults = await searchArtists({
        q: searchQuery.trim() || undefined,
        category_ids: categoryIdsParam && categoryIdsParam.length > 0 ? categoryIdsParam : null,
        location_ids: locationIdsParam && locationIdsParam.length > 0 ? locationIdsParam : null,
        limit,
        offset: currentOffset,
        // Near-me params (only if near-me is active)
        user_lat: shouldUseNearMe && nearMeCoords ? nearMeCoords.lat : null,
        user_lon: shouldUseNearMe && nearMeCoords ? nearMeCoords.lon : null,
        radius_km: shouldUseNearMe ? radiusKm : null
      })

      // Check if we got fewer results than requested (means no more pages)
      if (searchResults.length < limit) {
        setHasMore(false)
      } else {
        setHasMore(true)
      }

      if (append) {
        setResults(prev => [...prev, ...searchResults])
      } else {
        setResults(searchResults)
        setTotalCount(searchResults.length) // Approximate count
      }

      setOffset(currentOffset + searchResults.length)
    } catch (err) {
      console.error('Search error:', err)
      setError('Failed to search artists. Please try again.')
      if (!append) {
        setResults([])
      }
    } finally {
      setLoading(false)
      setIsLoadingMore(false)
      fetchingRef.current = false
    }
  }, [limit, radiusKm])

  // Create stable string keys for comparison to prevent unnecessary re-fetches
  const categoryIdsKey = categoryIds ? categoryIds.sort().join(',') : ''
  const locationIdsKey = locationIds ? locationIds.sort().join(',') : ''
  const nearMeKey = nearMeCoords ? `${nearMeCoords.lat},${nearMeCoords.lon}` : ''
  const searchKey = `${query}|${categoryIdsKey}|${locationIdsKey}|${nearMeKey}`

  // Initial search when query, categoryIds, or locationIds change
  useEffect(() => {
    if (!enabled) {
      setResults([])
      setLoading(false)
      setError(null)
      setHasMore(false)
      setOffset(0)
      return
    }

    // Reset pagination state
    setOffset(0)
    setHasMore(true)
    
    // Perform search with no delay (no debounce for page results)
    performSearch(query, categoryIds, locationIds, 0, false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchKey, enabled, performSearch, nearMeCoords])

  const loadMore = useCallback(() => {
    if (!enabled || loading || isLoadingMore || !hasMore || fetchingRef.current) {
      return
    }

    performSearch(
      currentQueryRef.current,
      currentCategoryIdsRef.current,
      currentLocationIdsRef.current,
      offset,
      true // append mode
    )
  }, [enabled, loading, isLoadingMore, hasMore, offset, performSearch, nearMeCoords])

  const refetch = useCallback(() => {
    setOffset(0)
    setHasMore(true)
    performSearch(query, categoryIds, locationIds, 0, false)
  }, [query, categoryIds, locationIds, performSearch, nearMeCoords])

  return {
    results,
    loading,
    error,
    hasMore,
    loadMore,
    refetch,
    totalCount
  }
}

