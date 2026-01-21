import { createClient } from '@/lib/supabase/client'

export type SearchParams = {
  q?: string
  category?: string
  category_ids?: number[] | null
  location_ids?: number[] | null
  city?: string
  state?: string
  limit?: number
  offset?: number
  // Near-me params
  user_lat?: number | null
  user_lon?: number | null
  radius_km?: number | null
}

export type SearchResult = {
  id: string
  handle: string
  display_name: string
  avatar_url: string | null
  avatar_thumb_url: string | null
  bio: string | null
  city: string | null
  state: string | null
  categories: string | null
  rank: number
  distance_km?: number | null
}

export async function searchArtists({
  q,
  category,
  category_ids,
  location_ids,
  city,
  state,
  limit = 20,
  offset = 0,
  user_lat,
  user_lon,
  radius_km,
}: SearchParams): Promise<SearchResult[]> {
  const supabase = createClient()
  
  // Use nearby search if coordinates are provided
  if (user_lat !== null && user_lat !== undefined && user_lon !== null && user_lon !== undefined) {
    const rpcParams = {
      user_lat,
      user_lon,
      radius_km: radius_km ?? 80, // Default to ~50 miles (80km)
      q: q ?? null,
      category_ids: category_ids && category_ids.length > 0 ? category_ids : null,
      lim: limit,
      off: offset,
    }
    
    const { data, error } = await supabase.rpc('search_artists_nearby', rpcParams)
    
    if (error) {
      console.error('Nearby search error:', error)
      throw error
    }
    
    return (data as SearchResult[]) || []
  }
  
  // Otherwise use normal search
  const rpcParams = {
    q: q ?? null,
    category_ids: category_ids && category_ids.length > 0 ? category_ids : null,
    location_ids: location_ids && location_ids.length > 0 ? location_ids : null,
    lim: limit,
    off: offset,
  }
  
  const { data, error } = await supabase.rpc('search_artists_v2', rpcParams)
  
  if (error) {
    console.error('Search error:', error)
    throw error
  }
  
  return (data as SearchResult[]) || []
}
