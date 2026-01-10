'use client'

import useSWR from 'swr'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/hooks/use-user'
import { swrKeys } from '@/lib/swrKeys'

interface DashboardSnapshot {
  snapshot: any // RPC return type - adjust based on actual RPC function
  profile: any
  tier: any
  limits: any
  usage: any
  subscription: any
}

interface UseDashboardSnapshotReturn {
  snapshot: DashboardSnapshot | null
  profile: any
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

  return {
    snapshot: data || null,
    profile: data?.profile || null,
    tier: data?.tier || null,
    limits: data?.limits || null,
    usage: data?.usage || null,
    subscription: data?.subscription || null,
    isLoading,
    error: error || null,
    refresh: () => mutate(),
  }
}

