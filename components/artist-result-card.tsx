'use client'

import Link from 'next/link'
import Image from 'next/image'
import { getMediaUrl } from '@/lib/media'
import type { SearchResult } from '@/lib/search-artists'

interface ArtistResultCardProps {
  artist: SearchResult
}

function formatLocation(city: string | null, state: string | null): string | null {
  if (!city && !state) return null
  if (city && state) return `${city}, ${state}`
  return city || state || null
}

function formatCategories(categories: string | null): string | null {
  if (!categories) return null
  // Categories come as comma-separated string
  return categories
}

export default function ArtistResultCard({ artist }: ArtistResultCardProps) {
  const location = formatLocation(artist.city, artist.state)
  const categories = formatCategories(artist.categories)
  const avatarSrc = getMediaUrl(artist.avatar_url)

  return (
    <Link
      href={`/artists/${artist.handle}`}
      className="block bg-white rounded-lg border border-sunroad-brown-200/50 hover:border-sunroad-amber-400 hover:shadow-md transition-all duration-200 p-4 h-full"
    >
      <div className="flex items-start space-x-4">
        {/* Avatar */}
        <div className="flex-shrink-0">
          {avatarSrc ? (
            <Image
              src={avatarSrc}
              alt={artist.display_name}
              width={64}
              height={64}
              className="w-16 h-16 rounded-full object-cover"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-sunroad-amber-100 to-sunroad-amber-200 flex items-center justify-center">
              <span className="text-sunroad-amber-600 font-medium text-xl">
                {artist.display_name.charAt(0)}
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Name and Handle */}
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <h3 className="text-lg font-display font-semibold text-sunroad-brown-900 truncate">
                {artist.display_name}
              </h3>
              {artist.handle && (
                <p className="text-sm text-sunroad-brown-500 truncate">
                  @{artist.handle}
                </p>
              )}
            </div>
            {artist.rank > 0 && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-sunroad-amber-100 text-sunroad-amber-800 flex-shrink-0">
                Match
              </span>
            )}
          </div>

          {/* Location */}
          {location && (
            <div className="mt-2 flex items-center text-sm text-sunroad-brown-600">
              <svg className="h-4 w-4 text-sunroad-brown-400 mr-1.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="truncate">{location}</span>
            </div>
          )}

          {/* Categories */}
          {categories && (
            <div className="mt-2 flex items-center text-sm text-sunroad-amber-600">
              <svg className="h-4 w-4 text-sunroad-amber-500 mr-1.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
              <span className="truncate">{categories}</span>
            </div>
          )}

          {/* Bio */}
          {artist.bio && (
            <p className="mt-2 text-sm text-sunroad-brown-600 line-clamp-2">
              {artist.bio}
            </p>
          )}
        </div>
      </div>
    </Link>
  )
}
