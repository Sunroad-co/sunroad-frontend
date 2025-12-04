import { useState, useEffect, useCallback, useRef } from 'react'
import { searchArtists, type SearchResult } from '@/lib/search-artists'

interface UseArtistSearchResultsParams {
  query: string
  categoryIds?: number[]
  limit?: number
  enabled?: boolean
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
  limit = 20,
  enabled = true
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

  // Update refs when params change
  useEffect(() => {
    currentQueryRef.current = query
    currentCategoryIdsRef.current = categoryIds
  }, [query, categoryIds])

  const performSearch = useCallback(async (
    searchQuery: string,
    categoryIdsParam: number[] | undefined,
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
      const searchResults = await searchArtists({
        q: searchQuery.trim() || undefined,
        category_ids: categoryIdsParam && categoryIdsParam.length > 0 ? categoryIdsParam : null,
        limit,
        offset: currentOffset
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
  }, [limit])

  // Initial search when query or categoryIds change
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
    performSearch(query, categoryIds, 0, false)
  }, [query, categoryIds, enabled, performSearch])

  const loadMore = useCallback(() => {
    if (!enabled || loading || isLoadingMore || !hasMore || fetchingRef.current) {
      return
    }

    performSearch(
      currentQueryRef.current,
      currentCategoryIdsRef.current,
      offset,
      true // append mode
    )
  }, [enabled, loading, isLoadingMore, hasMore, offset, performSearch])

  const refetch = useCallback(() => {
    setOffset(0)
    setHasMore(true)
    performSearch(query, categoryIds, 0, false)
  }, [query, categoryIds, performSearch])

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

