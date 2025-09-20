import { useState, useEffect, useCallback } from 'react'
import { searchArtists, type SearchResult } from '@/lib/search-artists'

interface UseSearchOptions {
  debounceMs?: number
  minQueryLength?: number
  limit?: number
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
}

export function useSearch({
  debounceMs = 300,
  minQueryLength = 2,
  limit = 10
}: UseSearchOptions = {}): UseSearchReturn {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isOpen, setIsOpen] = useState(false)

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce(async (searchQuery: string) => {
      if (searchQuery.length < minQueryLength) {
        setResults([])
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)

      try {
        const searchResults = await searchArtists({
          q: searchQuery,
          limit
        })
        setResults(searchResults)
      } catch (err) {
        console.error('Search error:', err)
        setError('Failed to search artists')
        setResults([])
      } finally {
        setLoading(false)
      }
    }, debounceMs),
    [debounceMs, minQueryLength, limit]
  )

  // Effect to trigger search when query changes
  useEffect(() => {
    if (query.trim() && query.trim().length >= minQueryLength) {
      debouncedSearch(query.trim())
    } else {
      setResults([])
      setLoading(false)
      setError(null)
    }
  }, [query, debouncedSearch, minQueryLength])

  // Clear search function
  const clearSearch = useCallback(() => {
    setQuery('')
    setResults([])
    setError(null)
    setLoading(false)
    setIsOpen(false)
  }, [])

  return {
    query,
    setQuery,
    results,
    loading,
    error,
    isOpen,
    setIsOpen,
    clearSearch
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
