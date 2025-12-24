'use client'

import { useEffect, useState } from 'react'
import SRImage from '@/components/media/SRImage'
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

interface SimilarArtistsProps {
  currentArtistId: string
  currentArtistCategories?: string[]
}

export default function SimilarArtists({ currentArtistId, currentArtistCategories }: SimilarArtistsProps) {
  const [artists, setArtists] = useState<Artist[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchRandomArtists() {
      const supabase = createAnonClient()
      const { data, error } = await supabase
        .from('artists_min')
        .select(`
          id,
          handle,
          display_name,
          avatar_url,
          banner_url,
          locations:location_id (
            city,
            state,
            country
          ),
          artist_categories (
            categories (
              name
            )
          )
        `)
        .neq('id', currentArtistId)
        .limit(4)

      if (error) {
        console.error('Error fetching random artists:', error)
        setArtists([])
      } else {
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
    }

    async function fetchSimilarArtists() {
      try {
        setLoading(true)
        setError(null)

        // Use the singleton anon client
        const supabase = createAnonClient()
        
        // If we have categories, try to find artists with matching categories
        if (currentArtistCategories && currentArtistCategories.length > 0) {
          console.log('Looking for artists with categories:', currentArtistCategories)
          
          // Try to find artists that match any of the current artist's categories
          const { data, error } = await supabase
            .from('artists_min')
            .select(`
                id,
                handle,
                display_name,
                avatar_url,
                banner_url,
                locations:location_id ( city, state, country ),
                artist_categories!inner (
                  categories!inner ( name )
                )
              `)
            .neq('id', currentArtistId) // Exclude current artist
            .in('artist_categories.categories.name', currentArtistCategories) // Filter by any of the categories
            .limit(8) // Get more to filter from

          if (error) {
            console.error('Error fetching similar artists:', error)
            // Fallback to any artists if category filtering fails
            const { data: fallbackData } = await supabase
              .from('artists_min')
              .select(`
                id,
                handle,
                display_name,
                avatar_url,
                banner_url,
                locations:location_id (
                  city,
                  state,
                  country
                ),
                artist_categories (
                  categories (
                    name
                  )
                )
              `)
              .neq('id', currentArtistId)
              .limit(4)
            
            if (fallbackData) {
              const flattened = fallbackData.map((artist: Record<string, unknown>) => ({
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
            } else {
              setArtists([])
            }
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
            
            // Filter by categories in JavaScript - find artists that share any category
            const similarArtists = flattened.filter(artist => {
              if (!artist.category) return false
              return currentArtistCategories.includes(artist.category)
            })
            
            console.log('Found similar artists:', similarArtists.length)
            
            if (similarArtists.length > 0) {
              setArtists(similarArtists.slice(0, 4))
            } else {
              // No similar artists found, fallback to random artists
              console.log('No similar artists found, fetching random artists...')
              await fetchRandomArtists()
            }
          }
        } else {
          // No categories provided, fetch random artists
          await fetchRandomArtists()
        }
      } catch (error) {
        console.error('Unexpected error:', error)
        setError('Failed to load similar artists')
      } finally {
        setLoading(false)
      }
    }

    fetchSimilarArtists()
  }, [currentArtistId, currentArtistCategories])

  if (loading) {
    return (
      <div className="mb-12">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Similar Artists</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="w-full h-48 bg-gray-200 rounded-lg mb-2"></div>
              <div className="h-4 bg-gray-200 rounded mb-1"></div>
              <div className="h-3 bg-gray-200 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error || artists.length === 0) {
    return null // Don't show section if no similar artists found
  }

  return (
    <div className="mb-12">
      <h3 className="text-xl font-semibold text-gray-900 mb-4">Similar Artists</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {artists.map((artist) => (
          <Link
            key={artist.id}
            href={`/artists/${artist.handle}`}
            prefetch={false}
            className="group block"
          >
            <div className="relative overflow-hidden rounded-lg mb-2">
              {artist.banner_url ? (
                <SRImage
                  src={artist.banner_url}
                  alt={artist.display_name}
                  width={400}
                  height={300}
                  className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105"
                  mode="raw"
                  sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                />
              ) : (
                <div className="w-full h-48 bg-gradient-to-br from-amber-100 to-amber-200 flex items-center justify-center">
                  <span className="text-amber-600 font-bold text-xl">
                    {artist.display_name.charAt(0)}
                  </span>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>
            <div className="space-y-1">
              <h4 className="font-medium text-gray-900 group-hover:text-amber-600 transition-colors">
                {artist.display_name}
              </h4>
              <p className="text-sm text-gray-500">
                {[artist.city, artist.state].filter(Boolean).join(', ')}
              </p>
              {artist.category && (
                <p className="text-xs text-amber-600 font-medium">
                  {artist.category}
                </p>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
