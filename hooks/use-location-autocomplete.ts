'use client'

import useSWR from 'swr'

export interface GeoapifySuggestion {
  properties: {
    formatted: string
    city?: string
    state?: string
    country?: string
    postcode?: string
    place_id?: string
    lat?: number
    lon?: number
  }
}

interface GeoapifyResponse {
  features: GeoapifySuggestion[]
}

/**
 * Fetcher function for location autocomplete
 */
async function fetchLocationAutocomplete(query: string): Promise<GeoapifySuggestion[]> {
  const response = await fetch(`/api/geoapify/autocomplete?q=${encodeURIComponent(query)}`)
  
  if (!response.ok) {
    throw new Error('Failed to fetch location suggestions')
  }
  
  const data: GeoapifyResponse = await response.json()
  return data.features || []
}

/**
 * Hook for location autocomplete using SWR
 * 
 * @param query - The search query string
 * @param enabled - Whether to enable the search (only searches when enabled and query length >= 3)
 * @returns Object with suggestions, isLoading, and error
 */
export function useLocationAutocomplete(query: string, enabled: boolean) {
  // Normalize query for cache key
  const normalizedQuery = query.trim().toLowerCase()
  
  // Only fetch when enabled and query is at least 3 characters (API requirement)
  const shouldFetch = enabled && normalizedQuery.length >= 3
  
  // SWR key: null when not fetching (disables SWR)
  const swrKey = shouldFetch ? ['/api/geoapify/autocomplete', normalizedQuery] : null

  const {
    data: suggestions,
    error,
    isLoading,
  } = useSWR<GeoapifySuggestion[]>(
    swrKey,
    () => fetchLocationAutocomplete(query.trim()),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 800,
      keepPreviousData: true,
    }
  )

  return {
    suggestions: suggestions || [],
    isLoading,
    error: error ? (error.message || 'Failed to load location suggestions') : null,
  }
}
