'use client'

import useSWR from 'swr'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/hooks/use-user'
import { swrKeys } from '@/lib/swrKeys'

export interface SnapshotProfileLocation {
  location_id: number
  formatted: string
  city: string | null
  state: string | null
}

export interface SnapshotProfileCategory {
  id: number
  name: string
}

export interface SnapshotProfile {
  artist_id: string
  handle: string
  display_name: string
  bio: string | null
  avatar_url: string | null
  banner_url: string | null
  categories: SnapshotProfileCategory[]
  location: SnapshotProfileLocation | null
  is_listed: boolean
  updated_at: string
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

interface DashboardSnapshot {
  has_profile: boolean
  profile: SnapshotProfile | null
  tier: any
  limits: any
  usage: any
  subscription: any
}

interface UseDashboardSnapshotReturn {
  snapshot: DashboardSnapshot | null
  profile: SnapshotProfile | null
  tier: any
  limits: any
  usage: any
  subscription: any
  isLoading: boolean
  error: Error | null
  refresh: () => void
}

/**
 * Fetcher function for SWR
 * Note: RPC uses authenticated session, so no userId parameter needed
 */
async function fetchDashboardSnapshot(): Promise<DashboardSnapshot> {
  const supabase = createClient()
  const { data, error } = await supabase.rpc('get_artist_dashboard_snapshot')

  if (error) {
    throw new Error(error.message || 'Failed to fetch dashboard snapshot')
  }

  if (!data) {
    throw new Error('No data returned from dashboard snapshot')
  }

  // Adjust based on actual RPC return structure
  return data as DashboardSnapshot
}

/**
 * Hook to fetch dashboard snapshot using SWR
 * 
 * Features:
 * - Automatic caching and deduplication
 * - Revalidates on reconnect
 * - Keeps previous data while loading
 * - No polling or intervals
 */
export function useDashboardSnapshot(): UseDashboardSnapshotReturn {
  const { user } = useUser()

  // SWR key: null when no user (disables fetching)
  const swrKey = user ? swrKeys.dashboardSnapshot(user.id) : null

  const {
    data,
    error,
    isLoading,
    mutate,
  } = useSWR<DashboardSnapshot>(
    swrKey,
    fetchDashboardSnapshot,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 60000, // 60 seconds
    }
  )

  // Ensure stable defaults: categories = [], location = null, artist_links = [] if missing
  // Map snapshot.profile.links (from RPC) to artist_links
  const profile = data?.profile
    ? {
        ...data.profile,
        categories: data.profile.categories || [],
        location: data.profile.location || null,
        artist_links: (data.profile as any).links || data.profile.artist_links || [],
      }
    : null

  return {
    snapshot: data || null,
    profile,
    tier: data?.tier || null,
    limits: data?.limits || null,
    usage: data?.usage || null,
    subscription: data?.subscription || null,
    isLoading,
    error: error || null,
    refresh: () => mutate(),
  }
}

