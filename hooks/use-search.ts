import { useState, useEffect, useCallback } from 'react'
import { searchArtists, type SearchResult } from '@/lib/search-artists'

interface UseSearchOptions {
  debounceMs?: number
  minQueryLength?: number
  limit?: number
  categoryIds?: number[]
  locationIds?: number[]
  enabled?: boolean
}

interface UseSearchReturn {
  query: string
  setQuery: (query: string) => void
  results: SearchResult[]
  loading: boolean
  error: string | null
  isOpen: boolean
  setIsOpen: (isOpen: boolean) => void
  clearSearch: () => void
  hasSearched: boolean
}

export function useSearch({
  debounceMs = 300,
  minQueryLength = 2,
  limit = 10,
  categoryIds,
  locationIds,
  enabled = true
}: UseSearchOptions = {}): UseSearchReturn {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [hasSearched, setHasSearched] = useState(false) // Track if we've completed a search

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce(async (searchQuery: string, categoryIdsParam?: number[], locationIdsParam?: number[]) => {
      if (searchQuery.length < minQueryLength) {
        setResults([])
        setLoading(false)
        setHasSearched(false)
        return
      }

      setLoading(true)
      setError(null)

      try {
        const searchResults = await searchArtists({
          q: searchQuery,
          category_ids: categoryIdsParam && categoryIdsParam.length > 0 ? categoryIdsParam : null,
          location_ids: locationIdsParam && locationIdsParam.length > 0 ? locationIdsParam : null,
          limit
        })
        setResults(searchResults)
        setHasSearched(true) // Mark that we've completed a search
      } catch (err) {
        console.error('Search error:', err)
        setError('Failed to search artists')
        setResults([])
        setHasSearched(true) // Mark that we've completed a search (even if failed)
      } finally {
        setLoading(false)
      }
    }, debounceMs),
    [debounceMs, minQueryLength, limit]
  )

  // Effect to trigger search when query, categoryIds, or locationIds changes
  useEffect(() => {
    if (!enabled) {
      setResults([])
      setLoading(false)
      setError(null)
      setHasSearched(false)
      return
    }

    if (query.trim() && query.trim().length >= minQueryLength) {
      setHasSearched(false) // Reset search completion flag when starting new search
      debouncedSearch(query.trim(), categoryIds, locationIds)
    } else {
      setResults([])
      setLoading(false)
      setError(null)
      setHasSearched(false)
    }
  }, [query, categoryIds, locationIds, debouncedSearch, minQueryLength, enabled])

  // Clear search function
  const clearSearch = useCallback(() => {
    setQuery('')
    setResults([])
    setError(null)
    setLoading(false)
    setIsOpen(false)
    setHasSearched(false)
  }, [])

  return {
    query,
    setQuery,
    results,
    loading,
    error,
    isOpen,
    setIsOpen,
    clearSearch,
    hasSearched
  }
}

// Debounce utility function
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null

  return (...args: Parameters<T>) => {
    if (timeout) {
      clearTimeout(timeout)
    }
    timeout = setTimeout(() => func(...args), wait)
  }
}
