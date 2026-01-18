'use client'

import useSWR from 'swr'
import { createClient } from '@/lib/supabase/client'
import { swrKeys } from '@/lib/swrKeys'

export interface SocialPlatform {
  key: string
  display_name: string
  icon_key: string
  sort_order: number
  is_active: boolean
  host_patterns?: string[] | null
}

async function fetchSocialPlatforms(): Promise<SocialPlatform[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('social_platforms')
    .select('key, display_name, icon_key, sort_order, is_active, host_patterns')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })

  if (error) {
    console.error('Error fetching social platforms:', error)
    throw new Error('Failed to load social platforms')
  }

  return data || []
}

export function useSocialPlatforms() {
  const {
    data,
    error,
    isLoading,
  } = useSWR<SocialPlatform[]>(
    swrKeys.socialPlatforms(),
    fetchSocialPlatforms,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 300000, // 5 minutes - platforms don't change often
    }
  )

  return {
    platforms: data || [],
    isLoading,
    error: error || null,
  }
}
