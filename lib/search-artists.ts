import { createClient } from '@/lib/supabase/client'

export type SearchParams = {
  q?: string
  category?: string
  city?: string
  state?: string
  limit?: number
  offset?: number
}

export type SearchResult = {
  id: string
  handle: string
  display_name: string
  avatar_url: string | null
  bio: string | null
  city: string | null
  state: string | null
  categories: string | null
  rank: number
}

export async function searchArtists({
  q,
  category,
  city,
  state,
  limit = 20,
  offset = 0,
}: SearchParams): Promise<SearchResult[]> {
  const supabase = createClient()
  
  const rpcParams = {
    q: q ?? null,
    category_name: category ?? null,
    city_name: city ?? null,
    state_name: state ?? null,
    lim: limit,
    off: offset,
  }
  
  const { data, error } = await supabase.rpc('search_artists', rpcParams)
  
  if (error) {
    console.error('Search error:', error)
    throw error
  }
  
  return (data as SearchResult[]) || []
}
