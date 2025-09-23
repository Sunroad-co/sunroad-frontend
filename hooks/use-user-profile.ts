'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'

export interface UserProfile {
  id: string
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

export interface Work {
  id: string
  title: string
  thumb_url: string
  description?: string
}

export function useUserProfile(user: User | null) {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchProfile() {
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
          .single()

        if (profileError) {
          console.error('Error fetching profile:', profileError)
          setError('Failed to load profile')
          return
        }

        // Fetch user's works
        const { data: worksData, error: worksError } = await supabase
          .from('artworks_min')
          .select('id, title, thumb_url, description')
          .eq('artist_id', profileData.id)

        if (worksError) {
          console.error('Error fetching works:', worksError)
          // Don't set error for works, just log it
        }

        // Transform the data
        const categories = profileData.artist_categories?.map((ac: any) => ac.categories?.name).filter(Boolean) || []
        const works = worksData || []

        setProfile({
          id: profileData.id,
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
    }

    fetchProfile()
  }, [user])

  return { profile, loading, error }
}
