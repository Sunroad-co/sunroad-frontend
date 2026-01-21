'use client'

import useSWR from 'swr'
import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'
import { swrKeys } from '@/lib/swrKeys'

export interface UserProfile {
  id: string
  handle: string
  display_name: string
  bio: string | null
  avatar_url: string | null
  avatar_thumb_url?: string | null
  banner_url: string | null
  banner_thumb_url?: string | null
  website_url: string | null
  instagram_url: string | null
  facebook_url: string | null
  categories: string[]
  category_ids: number[]
  location_id: number | null
  location: {
    city?: string
    state?: string
    formatted?: string
  } | null
  works: Work[]
  artist_links?: Array<{
    id: number
    platform_key: string
    url: string
    label: string | null
    sort_order: number
    is_public: boolean
    platform?: {
      key: string
      display_name: string
      icon_key: string
      sort_order: number
      is_active: boolean
    } | null
  }>
}

export type MediaType = 'image' | 'video' | 'audio'
export type MediaSource = 'upload' | 'youtube' | 'vimeo' | 'mux' | 'spotify' | 'soundcloud' | 'other_url'

export interface Work {
  id: string
  title: string
  description: string
  thumb_url: string | null
  src_url: string | null
  media_type: MediaType
  media_source: MediaSource
  is_archived?: boolean
  archived_reason?: string | null
}

/**
 * Fetcher function for SWR
 */
async function fetchUserProfile(userId: string): Promise<UserProfile | null> {
  const supabase = createClient()

  // Fetch user profile from artists_min table with artist_links joined
  const { data: profileData, error: profileError } = await supabase
    .from('artists_min')
    .select(`
      id,
      handle,
      display_name,
      bio,
      avatar_url,
      avatar_thumb_url,
      banner_url,
      banner_thumb_url,
      website_url,
      instagram_url,
      facebook_url,
      location_id,
      locations:location_id (
        city,
        state,
        formatted
      ),
      artist_categories (
        category_id,
        categories (
          name
        )
      ),
      artist_links:artist_links (
        id,
        platform_key,
        url,
        label,
        sort_order,
        is_public,
        platform:social_platforms (
          key,
          display_name,
          icon_key,
          sort_order,
          is_active
        )
      )
    `)
    .eq('auth_user_id', userId)
    .maybeSingle()

  if (profileError) {
    // Only throw for actual errors, not "no rows" (which is normal during onboarding)
    if (profileError.code !== 'PGRST116') {
      console.error('Error fetching profile:', profileError)
      throw new Error('Failed to load profile')
    }
    // No profile exists yet - this is normal during onboarding
    return null
  }

  if (!profileData) {
    // No profile exists yet - this is normal during onboarding
    return null
  }

  // Transform the data
  const categories = profileData.artist_categories?.map((ac: { categories?: { name: string } | null }) => ac.categories?.name).filter(Boolean) || []
  const categoryIds = profileData.artist_categories?.map((ac: { category_id: number }) => ac.category_id).filter((id: number | undefined): id is number => typeof id === 'number') || []
  const location = profileData.locations as { city?: string; state?: string; formatted?: string } | null
  // NOTE: Works are intentionally NOT fetched here to avoid duplicate network calls.
  // If a caller needs works, use `useWorks(profile.id)`.
  const works: Work[] = []

  // Process artist_links: sort by platform.sort_order, then artist_links.sort_order, then id
  const rawLinks = (profileData.artist_links as Array<{
    id: number
    platform_key: string
    url: string
    label: string | null
    sort_order: number
    is_public: boolean
    platform?: {
      key: string
      display_name: string
      icon_key: string
      sort_order: number
      is_active: boolean
    } | null
  }>) || []

  const artistLinks = rawLinks.sort((a, b) => {
    // First sort by platform.sort_order
    const aPlatformOrder = a.platform?.sort_order ?? 999
    const bPlatformOrder = b.platform?.sort_order ?? 999
    if (aPlatformOrder !== bPlatformOrder) {
      return aPlatformOrder - bPlatformOrder
    }
    // Then by artist_links.sort_order
    if (a.sort_order !== b.sort_order) {
      return a.sort_order - b.sort_order
    }
    // Finally by id
    return a.id - b.id
  })

  return {
    id: profileData.id,
    handle: profileData.handle,
    display_name: profileData.display_name,
    bio: profileData.bio,
    avatar_url: profileData.avatar_url,
    avatar_thumb_url: profileData.avatar_thumb_url ?? null,
    banner_url: profileData.banner_url,
    banner_thumb_url: profileData.banner_thumb_url ?? null,
    website_url: profileData.website_url,
    instagram_url: profileData.instagram_url,
    facebook_url: profileData.facebook_url,
    categories,
    category_ids: categoryIds,
    location_id: profileData.location_id ?? null,
    location,
    works,
    artist_links: artistLinks
  }
}

/**
 * Hook to fetch user profile using SWR
 * 
 * Features:
 * - Automatic caching and deduplication
 * - Revalidates on reconnect
 * - Keeps previous data while loading
 * - No polling or intervals
 */
export function useUserProfile(user: User | null) {
  // SWR key: null when no user (disables fetching)
  const swrKey = user?.id ? swrKeys.userProfile(user.id) : null

  const {
    data,
    error,
    isLoading,
    mutate,
  } = useSWR<UserProfile | null>(
    swrKey,
    () => fetchUserProfile(user!.id),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 60000, // 60 seconds
    }
  )

  // Map SWR loading/error to match existing API
  // loading = !error && (data is undefined) when user exists
  const loading = user ? (!error && data === undefined) : false
  const errorMessage = error ? (error.message || 'Failed to load profile') : null

  return {
    profile: data ?? null,
    loading,
    error: errorMessage,
    refetch: () => mutate(),
  }
}
