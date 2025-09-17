'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { createAnonClient } from '@/lib/supabase/anon'

interface Artist {
  id: string
  handle: string
  display_name: string
  avatar_url?: string
  banner_url?: string
  city?: string
  state?: string
  country?: string
  category?: string
}

export default function FeaturedArtists() {
  const [artists, setArtists] = useState<Artist[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchFeaturedArtists() {
      try {
        const supabase = createAnonClient()
        
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
        .limit(5)
      
  

        if (error) {
          console.error('Error fetching featured artists:', error)
          setArtists([])
        } else {
          // Flatten nested locations for ease
          const flattened = (data || []).map((artist: any) => ({
            ...artist,
            city: artist.locations?.city,
            state: artist.locations?.state,
            categories: artist.artist_categories?.map((ac: any) => ac.categories?.name).filter(Boolean) || []
          }))
          setArtists(flattened)
        }
      } catch (error) {
        console.error('Unexpected error:', error)
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
      {artists.map((artist) => (
        <Link
          key={artist.id}
          href={`/artists/${artist.handle}`}
          className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow group"
        >
          <div className="aspect-square relative bg-gray-100">
            {artist.avatar_url ? (
              <Image
                src={artist.avatar_url}
                alt={artist.display_name}
                fill
                className="object-cover group-hover:scale-105 transition-transform"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-amber-100 to-amber-200 flex items-center justify-center">
                <span className="text-amber-600 font-bold text-2xl">
                  {artist.display_name.charAt(0)}
                </span>
              </div>
            )}
          </div>
          <div className="p-4">
            <h3 className="font-semibold text-gray-900 mb-1">{artist.display_name}</h3>
            <p className="text-sm text-gray-600 mb-1">
              {[artist.city, artist.state].filter(Boolean).join(', ')}
            </p>
            <p className="text-xs text-amber-600 font-medium">{artist.category}</p>
          </div>
        </Link>
      ))}
    </div>
  )
}
