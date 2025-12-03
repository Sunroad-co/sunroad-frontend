import { createClient } from '@/lib/supabase/client'

export type SearchParams = {
  q?: string
  category?: string
  category_ids?: number[] | null
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
  category_ids,
  city,
  state,
  limit = 20,
  offset = 0,
}: SearchParams): Promise<SearchResult[]> {
  const supabase = createClient()
  
  const rpcParams = {
    q: q ?? null,
    category_ids: category_ids && category_ids.length > 0 ? category_ids : null,
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
