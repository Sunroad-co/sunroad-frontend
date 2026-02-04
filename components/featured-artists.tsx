'use client'

import { useEffect, useState } from 'react'
import SRImage from '@/components/media/SRImage'
import Link from 'next/link'
import { createAnonClient } from '@/lib/supabase/anon'
import { getMediaUrl } from '@/lib/media'
import { getProfileUrl } from '@/lib/utils/profile-url'

interface Artist {
  id: string
  handle: string
  display_name: string
  avatar_url?: string
  city?: string
  state?: string
  category?: string
}

interface SupabaseArtist {
  id: string
  handle: string
  display_name: string
  avatar_url?: string
  locations?: {
    city?: string
    state?: string
  }
  artist_categories?: Array<{
    categories?: {
      name: string
    }
  }>
}

export default function FeaturedArtists() {
  const [artists, setArtists] = useState<Artist[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchFeaturedArtists() {
      try {
        const supabase = createAnonClient()
        
        // Fetch FULL avatar_url for featured cards (higher quality showcase)
        // Only show listed (Pro) artists
        const { data, error } = await supabase
          .from('artists_min')
          .select(`
            id,
            handle,
            display_name,
            avatar_url,
            locations:location_id (city, state),
            artist_categories (
              categories (name)
            )
          `)
          .eq('is_listed', true)
          .limit(5)

        if (error) {
          setArtists([])
        } else {
          // Flatten nested locations for ease
          const flattened = (data || []).map((artist: SupabaseArtist): Artist => ({
            id: artist.id,
            handle: artist.handle,
            display_name: artist.display_name,
            avatar_url: artist.avatar_url,
            city: artist.locations?.city,
            state: artist.locations?.state,
            category: artist.artist_categories
              ?.map((ac) => ac.categories?.name)
              .filter(Boolean)[0]
          }))
          setArtists(flattened)
        }
      } catch {
        // Silently fail - empty state will show
      } finally {
        setLoading(false)
      }
    }

    fetchFeaturedArtists()
  }, [])

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow-md overflow-hidden animate-pulse">
            <div className="w-full h-48 bg-gray-200"></div>
            <div className="p-3 sm:p-4 space-y-2">
              <div className="h-3 sm:h-4 bg-gray-200 rounded"></div>
              <div className="h-2.5 sm:h-3 bg-gray-200 rounded w-3/4"></div>
              <div className="h-2.5 sm:h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {artists.map((artist) => {
        // Use FULL avatar for featured cards (higher quality showcase)
        const avatarSrc = getMediaUrl(artist.avatar_url);
        return (
          <Link
            key={artist.id}
            href={getProfileUrl(artist.handle)}
            prefetch={false}
            className="bg-white rounded-2xl border border-gray-200 overflow-hidden 
                       shadow-sm hover:shadow-md hover:-translate-y-1 
                       transition-all duration-300 group"
          >
            {/* Image */}
            <div className="relative overflow-hidden rounded-t-2xl">
              {avatarSrc ? (
                <SRImage
                  src={avatarSrc}
                  alt={artist.display_name}
                  width={400}
                  height={300}
                  className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105"
                  mode="raw"
                  sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 20vw"
                />
              ) : (
                <div className="w-full h-48 bg-gradient-to-br from-amber-100 to-amber-200 flex items-center justify-center">
                  <span className="text-amber-600 font-bold text-xl sm:text-2xl">
                    {artist.display_name.charAt(0)}
                  </span>
                </div>
              )}
            </div>
          
            {/* Text */}
            <div className="p-3 sm:p-4 space-y-1.5 sm:space-y-2">
              <h3 className="font-display font-semibold text-gray-900 text-sm sm:text-base truncate leading-tight">
                {artist.display_name}
              </h3>
              <p className="text-xs sm:text-sm text-gray-500 truncate leading-tight">
                {[artist.city, artist.state].filter(Boolean).join(', ')}
              </p>
          
              {/* Category chip(s) */}
              {artist.category && (
                <div className="flex flex-wrap gap-1.5 sm:gap-2 mt-1.5 sm:mt-2">
                  {artist.category.split(',').map((cat) => (
                    <span
                      key={cat}
                      className="inline-block bg-amber-50 text-amber-700 text-[10px] sm:text-xs font-medium px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full"
                    >
                      {cat.trim()}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </Link>
        );
      })}
    </div>
  )
}
