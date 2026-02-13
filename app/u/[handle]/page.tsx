import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import SRImage from '@/components/media/SRImage'
import SimilarArtists from '@/components/similar-artists'
import WorksGallery from '@/components/works-gallery'
import ShareButton from '@/components/share-button'
import TruncatedBio from '@/components/truncated-bio'
import ArtistSocialLinks from '@/components/artist-social-links'
import ContactArtistCTA from '@/components/contact-artist-cta'
import ScrollableCategories from '@/components/scrollable-categories'
import { createAnonClient } from '@/lib/supabase/anon'
import { getMediaUrl, getAvatarUrl, getBannerUrl } from '@/lib/media'
import { getSiteUrl } from '@/lib/site-url'
import { buildArtistPersonJsonLd, collectArtistSameAs } from '@/lib/json-ld'
import { JsonLdScript } from '@/lib/json-ld-script'
import { Work } from '@/hooks/use-user-profile'

interface ArtistWithCategories {
  id: string
  handle: string
  display_name: string
  avatar_url?: string
  banner_url?: string
  bio?: string
  website_url?: string
  instagram_url?: string
  facebook_url?: string
  can_receive_contact?: boolean
  locations?: {
    city?: string
    state?: string
    country?: string
  }
  artist_categories?: Array<{
    categories?: {
      name: string
    }
  }>
}

// Route config - Static until explicit revalidation
export const revalidate = false // Cache forever until manually revalidated
export const dynamic = 'error' // Fail build if anything forces dynamic

// Generate static params for known artists at build time
export async function generateStaticParams() {
  try {
    // During build time, we can't fetch from our own API
    // Return empty array to let ISR handle dynamic routes
    console.log('generateStaticParams: Skipping static generation, will use ISR')
    return []
  } catch (error) {
    console.warn('Error generating static params:', error)
    return []
  }
}

async function fetchArtist(handle: string) {
  try {
    const supabase = createAnonClient()
    const { data: artist, error } = await supabase
      .from('artists_min')
      .select(`
        *,
        can_receive_contact,
        locations:location_id (
          city,
          state,
          country
        ),
        artist_categories (
          categories (
            name
          )
        ),
        artist_links:artist_links (
          id,
          platform_key,
          url,
          label,
          sort_order,
          is_public,
          platform:social_platforms (
            key,
            display_name,
            icon_key,
            sort_order,
            is_active
          )
        )
      `)
      .eq('handle', handle)
      .maybeSingle()

    if (error) {
      console.error('Error fetching artist:', error)
      return null
    }

    if (!artist) {
      return null
    }

    // Extract categories from the nested structure
    const typedArtist = artist as ArtistWithCategories & {
      artist_links?: Array<{
        id: number
        platform_key: string
        url: string
        label: string | null
        sort_order: number
        is_public: boolean
        platform?: {
          key: string
          display_name: string
          icon_key: string
          sort_order: number
          is_active: boolean
        } | null
      }>
    }
    
    // Process and sort artist_links
    const rawLinks = typedArtist.artist_links || []
    const artistLinks = rawLinks
      .filter(l => l.is_public !== false && (l.platform?.is_active ?? true))
      .sort((a, b) => {
        const aPlatformOrder = a.platform?.sort_order ?? 999
        const bPlatformOrder = b.platform?.sort_order ?? 999
        if (aPlatformOrder !== bPlatformOrder) {
          return aPlatformOrder - bPlatformOrder
        }
        if (a.sort_order !== b.sort_order) {
          return a.sort_order - b.sort_order
        }
        return a.id - b.id
      })
    
    const categories = typedArtist.artist_categories
      ?.map(ac => ac.categories?.name)
      .filter((name): name is string => Boolean(name)) || ['Artist']
    
    return {
      ...typedArtist,
      categories,
      artist_links: artistLinks
    }
  } catch (error) {
    console.error('Unexpected error fetching artist:', error)
    return null
  }
}

async function fetchWorks(artistId: string): Promise<Work[]> {
  try {
    const supabase = createAnonClient()
    const { data: works, error } = await supabase
      .from('artworks_min')
      .select('id, title, description, thumb_url, src_url, media_type, media_source')
      .eq('artist_id', artistId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching works:', error)
      return []
    }

    if (!works) return []

    // Remove duplicates based on id
    const uniqueWorks = works.filter((work: Work, index: number, self: Work[]) => 
      index === self.findIndex((w: Work) => w.id === work.id)
    )

    console.log(`Fetched ${works.length} works, ${uniqueWorks.length} unique works for artist ${artistId}`)
    
    // Cast to Work[] - the data should match the Work type from use-user-profile
    return uniqueWorks as Work[]
  } catch (error) {
    console.error('Unexpected error fetching works:', error)
    return []
  }
}

export async function generateMetadata({ 
  params 
}: { 
  params: Promise<{ handle: string }> 
}): Promise<Metadata> {
  const { handle } = await params
  const artist = await fetchArtist(handle)

  if (!artist) {
    return {
      title: 'Artist Not Found | Sun Road',
      description: 'The requested artist profile could not be found.',
    }
  }

  // Extract categories for description
  const categories = artist.artist_categories
    ?.map(ac => ac.categories?.name)
    .filter((name): name is string => Boolean(name)) || []

  const categoryText = categories.length > 0 
    ? `Specializing in ${categories.join(', ')}`
    : 'Creative professional'

  // Create description from bio or fallback
  let description: string
  if (artist.bio) {
    // Get first sentence of bio, clean it up
    const firstSentence = artist.bio.split(/[.!?]/)[0].trim()
    const cleanedBio = firstSentence.length > 120 
      ? firstSentence.substring(0, 120).trim() + '...'
      : firstSentence
    description = `${cleanedBio} Discover ${artist.display_name}'s work, connect with local creatives, and explore the Sun Road artist community.`
  } else {
    description = `${artist.display_name} is a ${categoryText.toLowerCase()} on Sun Road. Discover their work, connect with local creatives, and explore the Sun Road artist community.`
  }

  // Use avatar as Open Graph image, fallback to banner
  const imageUrl = getMediaUrl(artist.avatar_url) || getMediaUrl(artist.banner_url)

  const appBaseUrl = getSiteUrl()

  const metadata: Metadata = {
    title: `${artist.display_name} | Sun Road`,
    description,
    keywords: [
      artist.display_name,
      ...categories,
      'local artist',
      'creative',
      'Tulsa',
      'Oklahoma',
      'Sun Road'
    ],
    authors: [{ name: artist.display_name }],
    alternates: {
      canonical: `/@${handle}`,
    },
    openGraph: {
      title: `${artist.display_name} | Sun Road`,
      description,
      type: 'profile',
      url: `/@${handle}`,
      siteName: 'Sun Road',
      ...(imageUrl && {
        images: [
          {
            url: imageUrl,
            width: 400,
            height: 400,
            alt: `${artist.display_name} profile picture`,
          }
        ]
      }),
    },
    twitter: {
      card: 'summary_large_image',
      title: `${artist.display_name} | Sun Road`,
      description,
      ...(imageUrl && {
        images: [imageUrl],
      })
    },
    ...(artist.website_url && {
      other: {
        'profile:website': artist.website_url,
      }
    }),
    ...(artist.instagram_url && {
      other: {
        'profile:instagram': artist.instagram_url,
      }
    }),
    ...(artist.facebook_url && {
      other: {
        'profile:facebook': artist.facebook_url,
      }
    })
  }

  return metadata
}

export default async function ArtistPage({ params }: { params: Promise<{ handle: string }> }) {
  try {
    const { handle } = await params
    const artist = await fetchArtist(handle)
    if (!artist) notFound()
    const works = await fetchWorks(artist.id)

    // Extract location data
    const location = artist.locations
    const city = location?.city
    const state = location?.state
    const locationText = city && state ? `${city}, ${state}` : city || state || null

    // Extract categories for display
    const categoryNames = artist.artist_categories
      ?.map(ac => ac.categories?.name)
      .filter((name): name is string => Boolean(name)) || []

    // Check if artist can receive contact
    const canReceiveContact = artist?.can_receive_contact === true

    // SEO: Person JSON-LD for public profile (canonical @handle URL)
    const siteUrl = getSiteUrl()
    const canonicalProfileUrl = `${siteUrl}/@${handle}`
    const avatarImageUrl = getMediaUrl(artist.avatar_url) || getMediaUrl(artist.banner_url) || null
    const personJsonLd = buildArtistPersonJsonLd({
      displayName: artist.display_name,
      canonicalUrl: canonicalProfileUrl,
      imageUrl: avatarImageUrl,
      description: artist.bio?.trim() || null,
      address: artist.locations
        ? {
            city: artist.locations.city ?? undefined,
            state: artist.locations.state ?? undefined,
            country: artist.locations.country ?? undefined,
          }
        : undefined,
      sameAs: collectArtistSameAs(artist),
    })

    return (
      <main className="min-h-screen bg-sunroad-cream">
        <JsonLdScript data={personJsonLd} />
        {/* Hero Section */}
        <header className="relative max-w-6xl mx-auto">
          {/* Banner */}
          <div className="relative h-48 sm:h-72 md:h-88 rounded-2xl overflow-hidden">
            {(() => {
              const bannerSrc = getBannerUrl(artist, 'full');
              return bannerSrc ? (
                <SRImage
                  src={bannerSrc}
                  alt={`${artist.display_name} banner`}
                  fill
                  className="object-cover"
                  priority
                  mode="optimized"
                  sizes="(max-width: 768px) 100vw, 1152px"
                />
              ) : null;
            })()}
            {/* Dark overlay for readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
          </div>

          {/* Avatar - Centered on mobile, left-aligned on desktop */}
          <div className="absolute -bottom-12 md:-bottom-16 left-1/2 transform -translate-x-1/2 md:left-6 md:transform-none flex flex-col items-center md:items-start">
            {/* Avatar */}
            <div className="w-24 h-24 md:w-40 md:h-40 rounded-full border-4 border-white overflow-hidden shadow-lg bg-white">
              {(() => {
                const avatarSrc = getAvatarUrl(artist, 'full');
                return avatarSrc ? (
                  <SRImage
                    src={avatarSrc}
                    alt={`${artist.display_name} profile picture`}
                    width={200}
                    height={200}
                    className="w-full h-full object-cover rounded-full"
                    mode="raw"
                    sizes="(max-width: 768px) 96px, 160px"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-300 flex items-center justify-center text-xl md:text-2xl text-gray-600 rounded-full" aria-label={`${artist.display_name} profile picture`}>
                    {artist.display_name?.charAt(0)}
                  </div>
                );
              })()}
            </div>
          </div>
        </header>

        {/* Content */}
        <article className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 md:pt-8">
          {/* Artist Info Section - Centered on mobile, left-aligned on desktop */}
          <header className="mt-0 md:mt-0 md:flex md:items-start md:gap-6 text-center md:text-left relative">
            {/* Spacer for avatar on desktop - matches avatar width + gap */}
            <div className="hidden md:block w-40 flex-shrink-0" />
            
            {/* Name and Info Section */}
            <div className="flex-1 min-w-0">
              {/* Name with Share Button (Desktop) */}
              <div className="flex items-center justify-between w-full mb-3 flex-col md:flex-row gap-3 md:gap-0">
                <h1 className="text-2xl md:text-4xl font-display font-bold text-sunroad-brown-900">
                  {artist.display_name}
                </h1>
                {/* Share Button - Desktop Only */}
                <div className="hidden md:block">
                  <ShareButton 
                    artistName={artist.display_name}
                    artistHandle={artist.handle}
                    className="!bg-gradient-to-b !from-sunroad-amber-500 !to-sunroad-amber-600 hover:!from-sunroad-amber-600 hover:!to-sunroad-amber-700 !shadow-md !shadow-amber-200/40"
                  />
                </div>
              </div>

              {/* Location */}
              {locationText && (
                <div className="flex items-center justify-center md:justify-start gap-1.5 mb-3 text-sunroad-brown-600">
                  <svg className="h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="text-sm font-body">{locationText}</span>
                </div>
              )}

              {/* Categories */}
              {categoryNames.length > 0 && (
                <ScrollableCategories 
                  categories={categoryNames}
                  aria-label="Artist categories"
                />
              )}
            </div>
          </header>

          {/* Bio Section - Aligned with name section on desktop */}
          {artist.bio ? (
            <section className="mb-8 md:flex md:items-start md:gap-6">
              {/* Desktop CTA + Social Links in left column */}
              <div className="hidden md:block w-40 flex-shrink-0">
                <div className="flex flex-col gap-4 -mt-10 md:sticky md:top-6 md:self-start">
                  {/* Contact Button - Desktop Only */}
                  {canReceiveContact && (
                    <ContactArtistCTA
                      artistHandle={artist.handle}
                      displayName={artist.display_name}
                    />
                  )}
                  {/* Social Links - Desktop Only */}
                  <ArtistSocialLinks
                    links={artist.artist_links || []}
                    artistName={artist.display_name}
                    alignment="side"
                  />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <TruncatedBio bio={artist.bio} />
              </div>
            </section>
          ) : (
            /* Desktop-only CTA + Social Links section when no bio */
            <section className="mb-8 hidden md:flex md:items-start md:gap-6">
              <div className="w-40 flex-shrink-0">
                <div className="flex flex-col gap-4 md:sticky md:top-6 md:self-start">
                  {/* Contact Button - Desktop Only */}
                  {canReceiveContact && (
                    <ContactArtistCTA
                      artistHandle={artist.handle}
                      displayName={artist.display_name}
                    />
                  )}
                  {/* Social Links - Desktop Only */}
                  <ArtistSocialLinks
                    links={artist.artist_links || []}
                    artistName={artist.display_name}
                    alignment="side"
                  />
                </div>
              </div>
              <div className="flex-1 min-w-0" />
            </section>
          )}

          {/* Mobile: CTA, Share, Social Links */}
          <section className="mb-8 md:hidden">
            <div className="flex flex-col items-center gap-4">
              {/* Contact Button - Mobile Only, Below Bio (if bio exists) or at top (if no bio) */}
              {canReceiveContact && (
                <ContactArtistCTA
                  artistHandle={artist.handle}
                  displayName={artist.display_name}
                />
              )}
              {/* Share Button - Mobile Only */}
              <ShareButton 
                artistName={artist.display_name}
                artistHandle={artist.handle}
                className="border border-sunroad-amber-700/30 shadow-[0_0_10px_rgba(217,119,6,0.3)] px-5 py-2.5"
              />
              {/* Social Links - Mobile Only */}
              <ArtistSocialLinks
                links={artist.artist_links || []}
                artistName={artist.display_name}
                alignment="center"
              />
            </div>
          </section>
          


          {/* Works */}
          <section className="mb-12 mt-12">
            <h2 className="text-xl font-display font-semibold text-sunroad-brown-900 mb-4">Work</h2>
            <WorksGallery works={works} />
          </section>

          {/* Similar Artists */}
          <section>
            <SimilarArtists 
              currentArtistId={artist.id}
              currentArtistCategories={artist.categories}
            />
          </section>
        </article>
      </main>
    )
  } catch (error) {
    console.error('Error in ArtistPage:', error)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-600">Something went wrong while loading this artist profile.</p>
      </div>
    )
  }
}

