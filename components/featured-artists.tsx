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
          const flattened = (data || []).map((artist: Record<string, unknown>) => ({
            id: artist.id as string,
            handle: artist.handle as string,
            display_name: artist.display_name as string,
            avatar_url: artist.avatar_url as string | undefined,
            banner_url: artist.banner_url as string | undefined,
            city: (artist.locations as Record<string, unknown>)?.city as string | undefined,
            state: (artist.locations as Record<string, unknown>)?.state as string | undefined,
            country: (artist.locations as Record<string, unknown>)?.country as string | undefined,
            category: ((artist.artist_categories as Record<string, unknown>[]) || [])
              .map((ac: Record<string, unknown>) => (ac.categories as Record<string, unknown>)?.name)
              .filter(Boolean)[0] as string | undefined
          })) as Artist[]
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
    className="bg-white rounded-2xl border border-gray-200 overflow-hidden 
               shadow-sm hover:shadow-md hover:-translate-y-1 
               transition-all duration-300 group"
  >
    {/* Image */}
    <div className="aspect-square relative bg-gray-100 overflow-hidden">
      {artist.avatar_url ? (
        <Image
          src={artist.avatar_url}
          alt={artist.display_name}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-500 ease-in-out"
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
  
     
      ))}
    </div>
  )
}
