'use client'

import { useEffect, useState, useMemo } from 'react'
import SRImage from '@/components/media/SRImage'
import Link from 'next/link'
import { createAnonClient } from '@/lib/supabase/anon'
import { getBannerUrl } from '@/lib/media'
import { getProfileUrl } from '@/lib/utils/profile-url'

interface Artist {
  id: string
  handle: string
  display_name: string
  banner_thumb_url?: string
  city?: string
  state?: string
  category?: string
}

interface SimilarArtistsProps {
  currentArtistId: string
  currentArtistCategories?: string[]
}

const TARGET_COUNT = 4

export default function SimilarArtists({ currentArtistId, currentArtistCategories }: SimilarArtistsProps) {
  const [artists, setArtists] = useState<Artist[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Stabilize categories dependency - sort and join into string
  const categoriesKey = useMemo(() => {
    if (!currentArtistCategories || currentArtistCategories.length === 0) return ''
    return [...currentArtistCategories].sort().join('|')
  }, [currentArtistCategories])

  useEffect(() => {
    async function fetchSimilarArtists() {
      try {
        setLoading(true)
        setError(null)

        const supabase = createAnonClient()
        const categories = categoriesKey ? categoriesKey.split('|') : []
        
        let similarArtists: Artist[] = []
        const excludeIds = new Set<string>([currentArtistId])

        // Step 1: Try to find artists with matching categories (if we have categories)
        // Only show listed (Pro) artists
        if (categories.length > 0) {
          const { data, error: queryError } = await supabase
            .from('artists_min')
            .select(`
              id,
              handle,
              display_name,
              banner_thumb_url,
              locations:location_id (city, state),
              artist_categories!inner (
                categories!inner (name)
              )
            `)
            .eq('is_listed', true)
            .neq('id', currentArtistId)
            .in('artist_categories.categories.name', categories)
            .limit(TARGET_COUNT)

          if (!queryError && data) {
            // Flatten and filter by category match
            const flattened = data.map((artist: Record<string, unknown>): Artist => ({
              id: artist.id as string,
              handle: artist.handle as string,
              display_name: artist.display_name as string,
              banner_thumb_url: artist.banner_thumb_url as string | undefined,
              city: (artist.locations as Record<string, unknown>)?.city as string | undefined,
              state: (artist.locations as Record<string, unknown>)?.state as string | undefined,
              category: ((artist.artist_categories as Record<string, unknown>[]) || [])
                .map((ac: Record<string, unknown>) => (ac.categories as Record<string, unknown>)?.name)
                .filter(Boolean)[0] as string | undefined
            }))

            // Filter by category in JavaScript to ensure accurate matches
            similarArtists = flattened.filter(artist => {
              if (!artist.category) return false
              return categories.includes(artist.category)
            }).slice(0, TARGET_COUNT)

            // Track IDs we've already selected
            similarArtists.forEach(a => excludeIds.add(a.id))
          }
        }

        // Step 2: If we need more artists, fetch random ones to fill remaining slots
        // Only show listed (Pro) artists
        const remaining = TARGET_COUNT - similarArtists.length
        if (remaining > 0) {
          // Build exclusion filter
          const excludeArray = Array.from(excludeIds)
          
          const { data: randomData, error: randomError } = await supabase
            .from('artists_min')
            .select(`
              id,
              handle,
              display_name,
              banner_thumb_url,
              locations:location_id (city, state),
              artist_categories (
                categories (name)
              )
            `)
            .eq('is_listed', true)
            .not('id', 'in', `(${excludeArray.join(',')})`)
            .limit(remaining)

          if (!randomError && randomData) {
            const randomFlattened = randomData.map((artist: Record<string, unknown>): Artist => ({
              id: artist.id as string,
              handle: artist.handle as string,
              display_name: artist.display_name as string,
              banner_thumb_url: artist.banner_thumb_url as string | undefined,
              city: (artist.locations as Record<string, unknown>)?.city as string | undefined,
              state: (artist.locations as Record<string, unknown>)?.state as string | undefined,
              category: ((artist.artist_categories as Record<string, unknown>[]) || [])
                .map((ac: Record<string, unknown>) => (ac.categories as Record<string, unknown>)?.name)
                .filter(Boolean)[0] as string | undefined
            }))

            similarArtists = [...similarArtists, ...randomFlattened]
          }
        }

        setArtists(similarArtists)
      } catch {
        setError('Failed to load similar artists')
      } finally {
        setLoading(false)
      }
    }

    fetchSimilarArtists()
  }, [currentArtistId, categoriesKey])

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
        {artists.map((artist) => {
          // getBannerUrl will resolve thumb_url from the object for 'small' size
          const bannerSrc = getBannerUrl({ banner_thumb_url: artist.banner_thumb_url }, 'small');
          return (
            <Link
              key={artist.id}
              href={getProfileUrl(artist.handle)}
              prefetch={false}
              className="group block"
            >
              <div className="relative overflow-hidden rounded-lg mb-2">
                {bannerSrc ? (
                  <SRImage
                    src={bannerSrc}
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
          );
        })}
      </div>
    </div>
  )
}
