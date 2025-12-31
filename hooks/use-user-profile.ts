'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'

export interface UserProfile {
  id: string
  handle: string
  display_name: string
  bio: string | null
  avatar_url: string | null
  banner_url: string | null
  website_url: string | null
  instagram_url: string | null
  facebook_url: string | null
  categories: string[]
  works: Work[]
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
}

export function useUserProfile(user: User | null) {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProfile = useCallback(async () => {
    if (!user) {
      setProfile(null)
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const supabase = createClient()

      // Fetch user profile from artists_min table
      const { data: profileData, error: profileError } = await supabase
        .from('artists_min')
        .select(`
          id,
          handle,
          display_name,
          bio,
          avatar_url,
          banner_url,
          website_url,
          instagram_url,
          facebook_url,
          artist_categories (
            categories (
              name
            )
          )
        `)
        .eq('auth_user_id', user.id)
        .maybeSingle()

      if (profileError) {
        // Only log actual errors, not "no rows" (which is normal during onboarding)
        if (profileError.code !== 'PGRST116') {
          console.error('Error fetching profile:', profileError)
          setError('Failed to load profile')
        } else {
          // No profile exists yet - this is normal during onboarding
          setProfile(null)
          setLoading(false)
        }
        return
      }

      if (!profileData) {
        // No profile exists yet - this is normal during onboarding
        setProfile(null)
        setLoading(false)
        return
      }

      // Fetch user's works
      const { data: worksData, error: worksError } = await supabase
        .from('artworks_min')
        .select('id, title, description, thumb_url, src_url, media_type, media_source')
        .eq('artist_id', profileData.id)
        .order('created_at', { ascending: false })

      if (worksError) {
        console.error('Error fetching works:', worksError)
        // Don't set error for works, just log it
      }

      // Transform the data
      const categories = profileData.artist_categories?.map((ac: { categories?: { name: string } | null }) => ac.categories?.name).filter(Boolean) || []
      const works = worksData || []

      setProfile({
        id: profileData.id,
        handle: profileData.handle,
        display_name: profileData.display_name,
        bio: profileData.bio,
        avatar_url: profileData.avatar_url,
        banner_url: profileData.banner_url,
        website_url: profileData.website_url,
        instagram_url: profileData.instagram_url,
        facebook_url: profileData.facebook_url,
        categories,
        works
      })

    } catch (err) {
      console.error('Unexpected error:', err)
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    fetchProfile()
  }, [fetchProfile])

  return { profile, loading, error, refetch: fetchProfile }
}
