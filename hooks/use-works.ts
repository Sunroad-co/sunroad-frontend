'use client'

import useSWR from 'swr'
import { createClient } from '@/lib/supabase/client'
import { Work } from '@/hooks/use-user-profile'

interface UseWorksReturn {
  works: Work[] | null
  isLoading: boolean
  error: Error | null
  refresh: () => void
}

/**
 * Fetcher function for SWR
 */
async function fetchWorks(artistId: string): Promise<Work[]> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('artworks_min')
    .select('id,title,description,thumb_url,src_url,media_type,media_source,is_archived,archived_reason,created_at')
    .eq('artist_id', artistId)
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(error.message || 'Failed to fetch works')
  }

  // Transform to Work[] format (created_at is used for ordering but not part of Work interface)
  return (data || []).map((item: any) => ({
    id: item.id,
    title: item.title,
    description: item.description,
    thumb_url: item.thumb_url,
    src_url: item.src_url,
    media_type: item.media_type,
    media_source: item.media_source,
    is_archived: item.is_archived ?? false,
    archived_reason: item.archived_reason ?? null,
  }))
}

/**
 * Hook to fetch artist works using SWR
 * 
 * Features:
 * - Automatic caching and deduplication
 * - Revalidates on reconnect
 * - Keeps previous data while loading
 * - No polling or intervals
 */
export function useWorks(artistId: string | null): UseWorksReturn {
  // SWR key: null when no artistId (disables fetching)
  const swrKey = artistId ? ['artist-works', artistId] : null

  const {
    data,
    error,
    isLoading,
    mutate,
  } = useSWR<Work[]>(
    swrKey,
    () => fetchWorks(artistId!),
    {
      revalidateOnFocus: false,
      dedupingInterval: 5000,
      keepPreviousData: true,
    }
  )

  return {
    works: data ?? null,
    isLoading,
    error: error || null,
    refresh: () => mutate(),
  }
}
