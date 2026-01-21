'use client'

import { useEffect, useState } from 'react'
import SRImage from '@/components/media/SRImage'
import Link from 'next/link'
import { createAnonClient } from '@/lib/supabase/anon'
import { getMediaUrl } from '@/lib/media'

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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow-md overflow-hidden animate-pulse">
            <div className="h-48 bg-gray-200"></div>
            <div className="p-4 space-y-2">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-3 bg-gray-200 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
      {artists.map((artist) => {
        // Use FULL avatar for featured cards (higher quality showcase)
        const avatarSrc = getMediaUrl(artist.avatar_url);
        return (
          <Link
            key={artist.id}
            href={`/artists/${artist.handle}`}
            prefetch={false}
            className="bg-white rounded-2xl border border-gray-200 overflow-hidden 
                       shadow-sm hover:shadow-md hover:-translate-y-1 
                       transition-all duration-300 group"
          >
            {/* Image */}
            <div className="aspect-square relative bg-gray-100 overflow-hidden">
              {avatarSrc ? (
                <SRImage
                  src={avatarSrc}
                  alt={artist.display_name}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500 ease-in-out"
                  mode="raw"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 20vw"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-amber-100 to-amber-200 flex items-center justify-center">
                  <span className="text-amber-600 font-bold text-2xl">
                    {artist.display_name.charAt(0)}
                  </span>
                </div>
              )}
            </div>
          
            {/* Text */}
            <div className="p-4 space-y-2">
              <h3 className="font-semibold text-gray-900 text-base truncate">
                {artist.display_name}
              </h3>
              <p className="text-sm text-gray-500 truncate">
                {[artist.city, artist.state].filter(Boolean).join(', ')}
              </p>
          
              {/* Category chip(s) */}
              {artist.category && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {artist.category.split(',').map((cat) => (
                    <span
                      key={cat}
                      className="inline-block bg-amber-50 text-amber-700 text-xs font-medium px-2 py-1 rounded-full"
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
