'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

export interface Location {
  id: number
  formatted: string
  city: string | null
  state: string | null
  state_code: string | null
  country_code: string | null
  artist_count: number
}

// Module-level cache to persist across component mounts
const locationCache = new Map<string, Location[]>()
let topLocationsPromise: Promise<Location[]> | null = null
let topLocationsCache: Location[] | null = null

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

interface UseLocationSearchOptions {
  debounceMs?: number
  limit?: number
  enabled?: boolean
}

interface UseLocationSearchReturn {
  query: string
  setQuery: (query: string) => void
  locations: Location[]
  loading: boolean
  error: string | null
  retry: () => void
}

export function useLocationSearch({
  debounceMs = 300,
  limit = 25,
  enabled = true
}: UseLocationSearchOptions = {}): UseLocationSearchReturn {
  const [query, setQuery] = useState('')
  const [locations, setLocations] = useState<Location[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Track request ID to ignore stale requests
  const requestIdRef = useRef(0)

  const fetchLocations = useCallback(async (searchQuery: string | null, requestId: number) => {
    // Check cache first
    const cacheKey = searchQuery || '__top__'
    if (locationCache.has(cacheKey)) {
      const cached = locationCache.get(cacheKey)!
      // Only use cache if this is still the current request
      if (requestId === requestIdRef.current) {
        setLocations(cached)
        setLoading(false)
        setError(null)
        return
      }
    }

    // For top locations, check if we have a pending promise
    if (!searchQuery && topLocationsPromise) {
      try {
        const data = await topLocationsPromise
        if (requestId === requestIdRef.current) {
          setLocations(data)
          setLoading(false)
          setError(null)
        }
        return
      } catch (err) {
        // If the cached promise failed, continue to fetch again
        topLocationsPromise = null
      }
    }

    // If we already have cached top locations and query is empty, use them
    if (!searchQuery && topLocationsCache) {
      if (requestId === requestIdRef.current) {
        setLocations(topLocationsCache)
        setLoading(false)
        setError(null)
        return
      }
    }

    try {
      setLoading(true)
      setError(null)

      const supabase = createClient()
      
      const { data, error: fetchError } = await supabase.rpc('search_locations', {
        q: searchQuery || null,
        lim: limit
      })

      // Check if this request is still current
      if (requestId !== requestIdRef.current) {
        return
      }

      if (fetchError) {
        throw new Error(fetchError.message)
      }

      const fetchedLocations = (data || []) as Location[]
      
      // Cache the results
      locationCache.set(cacheKey, fetchedLocations)
      
      // Cache top locations separately
      if (!searchQuery) {
        topLocationsCache = fetchedLocations
      }

      if (requestId === requestIdRef.current) {
        setLocations(fetchedLocations)
        setLoading(false)
        setError(null)
      }
    } catch (err) {
      // Ignore stale requests
      if (requestId !== requestIdRef.current) {
        return
      }

      const errorMessage = err instanceof Error ? err.message : 'Failed to load locations. Please try again.'
      setError(errorMessage)
      setLoading(false)
      
      // Don't clear locations on error, keep previous results
    }
  }, [limit])

  // Debounced search function
  const debouncedFetch = useCallback(
    debounce((searchQuery: string | null) => {
      const currentRequestId = ++requestIdRef.current
      fetchLocations(searchQuery, currentRequestId)
    }, debounceMs),
    [debounceMs, fetchLocations]
  )

  // Effect to trigger search when query changes (only if enabled)
  useEffect(() => {
    if (!enabled) {
      // Don't fetch when disabled, but keep existing locations if any
      return
    }

    const trimmedQuery = query.trim()
    const searchQuery = trimmedQuery || null
    
    // For empty query, fetch top locations
    if (!searchQuery) {
      // Check if we already have top locations cached
      if (topLocationsCache) {
        setLocations(topLocationsCache)
        setLoading(false)
        setError(null)
        return
      }
      
      // Check if we have a pending promise
      if (topLocationsPromise) {
        return
      }
      
      // Create promise for top locations
      topLocationsPromise = (async () => {
        const currentRequestId = ++requestIdRef.current
        await fetchLocations(null, currentRequestId)
        topLocationsPromise = null
        return topLocationsCache || []
      })()
      
      return
    }

    // For non-empty query, use debounced search
    debouncedFetch(searchQuery)
  }, [query, debouncedFetch, fetchLocations, enabled])

  const retry = useCallback(() => {
    const trimmedQuery = query.trim()
    const searchQuery = trimmedQuery || null
    const currentRequestId = ++requestIdRef.current
    
    // Clear cache for this query
    const cacheKey = searchQuery || '__top__'
    locationCache.delete(cacheKey)
    if (!searchQuery) {
      topLocationsCache = null
      topLocationsPromise = null
    }
    
    fetchLocations(searchQuery, currentRequestId)
  }, [query, fetchLocations])

  return {
    query,
    setQuery,
    locations,
    loading,
    error,
    retry
  }
}

