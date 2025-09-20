import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import Image from 'next/image'
import SimilarArtists from '@/components/similar-artists'
import WorksGallery from '@/components/works-gallery'
import { createAnonClient } from '@/lib/supabase/anon'

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
  artist_categories?: Array<{
    categories?: {
      name: string
    }
  }>
}

interface Work {
  id: string
  title?: string
  thumb_url: string
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
        artist_categories (
          categories (
            name
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
    const typedArtist = artist as ArtistWithCategories
    const categories = typedArtist.artist_categories
      ?.map(ac => ac.categories?.name)
      .filter((name): name is string => Boolean(name)) || ['Artist']
    
    return {
      ...typedArtist,
      categories
    }
  } catch (error) {
    console.error('Unexpected error fetching artist:', error)
    return null
  }
}

async function fetchWorks(artistId: string) {
  try {
    const supabase = createAnonClient()
    const { data: works, error } = await supabase
      .from('artworks_min')
      .select('id, title, thumb_url')
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
    
    return uniqueWorks
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
  const imageUrl = artist.avatar_url || artist.banner_url

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
    openGraph: {
      title: `${artist.display_name} | Sun Road`,
      description,
      type: 'profile',
      url: `https://sunroad-frontend.vercel.app/artists/${handle}`,
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
      ...(artist.website_url && {
        url: artist.website_url,
      })
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

    return (
      <main className="min-h-screen">
        {/* Hero Section */}
        <header className="relative max-w-6xl mx-auto">
          {/* Banner */}
          <div className="relative h-80 sm:h-96 rounded-2xl overflow-hidden">
            {artist.banner_url && (
              <Image
                src={artist.banner_url}
                alt={`${artist.display_name} banner`}
                fill
                className="object-cover"
                priority
              />
            )}
            {/* Dark overlay for readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
          </div>

          {/* Avatar + Name Section */}
          <div className="absolute -bottom-16 left-1/2 transform -translate-x-1/2 flex flex-col items-center sm:items-start sm:left-6 sm:transform-none">
            {/* Avatar */}
            <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full border-4 border-white overflow-hidden shadow-lg bg-white">
              {artist.avatar_url ? (
                <Image
                  src={artist.avatar_url}
                  alt={`${artist.display_name} profile picture`}
                  width={200}
                  height={200}
                  className="w-full h-full object-cover rounded-full"
                />
              ) : (
                <div className="w-full h-full bg-gray-300 flex items-center justify-center text-2xl text-gray-600 rounded-full" aria-label={`${artist.display_name} profile picture`}>
                  {artist.display_name?.charAt(0)}
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Content */}
        <article className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-20">
          {/* Artist Name */}
          <header className="mt-3 text-center sm:text-left">
            <h1 className="text-5xl sm:text-2xl font-bold text-gray-900 mb-2 drop-shadow-md">
              {artist.display_name}
            </h1>
          </header>

          {/* About */}
          <section className="mb-8">
            {artist.artist_categories && artist.artist_categories.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3" role="list" aria-label="Artist categories">
                {artist.artist_categories.map((ac: { categories?: { name: string } }, i: number) => (
                  <span
                    key={i}
                    role="listitem"
                    className="inline-block mb-2 bg-amber-50 text-amber-700 text-xs font-medium px-3 py-1 rounded-full"
                  >
                    {ac.categories?.name}
                  </span>
                ))}
              </div>
            )}
            <p className="text-gray-700">
              {artist.bio || "I'm an artist. I create beautiful work in my local area."}
            </p>
          </section>



          {/* Works */}
          <section className="mb-12">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Work</h2>
            <WorksGallery works={works} />
          </section>
          {/* Social links */}
          <nav className="mb-8 flex flex-wrap gap-3" aria-label="Social media links">
  {artist.website_url && (
    <a
      href={artist.website_url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Website"
      className="w-10 h-10 flex items-center justify-center rounded-full bg-amber-800 text-white hover:bg-amber-900 transition-colors"
    >
      {/* Globe */}
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="currentColor" viewBox="0 0 16 16">
        <path d="M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8m7.5-6.923c-.67.204-1.335.82-1.887 1.855A8 8 0 0 0 5.145 4H7.5zM4.09 4a9.3 9.3 0 0 1 .64-1.539 7 7 0 0 1 .597-.933A7.03 7.03 0 0 0 2.255 4zm-.582 3.5c.03-.877.138-1.718.312-2.5H1.674a7 7 0 0 0-.656 2.5zM4.847 5a12.5 12.5 0 0 0-.338 2.5H7.5V5zM8.5 5v2.5h2.99a12.5 12.5 0 0 0-.337-2.5zM4.51 8.5a12.5 12.5 0 0 0 .337 2.5H7.5V8.5zm3.99 0V11h2.653c.187-.765.306-1.608.338-2.5zM5.145 12q.208.58.468 1.068c.552 1.035 1.218 1.65 1.887 1.855V12zm.182 2.472a7 7 0 0 1-.597-.933A9.3 9.3 0 0 1 4.09 12H2.255a7 7 0 0 0 3.072 2.472" />
      </svg>
    </a>
  )}
  {artist.instagram_url && (
    <a
      href={artist.instagram_url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Instagram"
      className="w-10 h-10 flex items-center justify-center rounded-full bg-amber-800 text-white hover:bg-amber-900 transition-colors"
    >
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M7 2C4.2 2 2 4.2 2 7v10c0 2.8 2.2 5 5 5h10c2.8 0 5-2.2 5-5V7c0-2.8-2.2-5-5-5H7zm10 2c1.6 0 3 1.4 3 3v10c0 1.6-1.4 3-3 3H7c-1.6 0-3-1.4-3-3V7c0-1.6 1.4-3 3-3h10zm-5 3a5 5 0 100 10 5 5 0 000-10zm0 2a3 3 0 110 6 3 3 0 010-6zm4.8-2.9a1.1 1.1 0 100 2.2 1.1 1.1 0 000-2.2z"/>
      </svg>
    </a>
  )}
  {artist.facebook_url && (
    <a
      href={artist.facebook_url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Facebook"
      className="w-10 h-10 flex items-center justify-center rounded-full bg-amber-800 text-white hover:bg-amber-900 transition-colors"
    >
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M22 12a10 10 0 10-11.5 9.9v-7h-2v-3h2v-2.3c0-2 1.2-3.1 3-3.1.9 0 1.8.1 1.8.1v2h-1c-1 0-1.3.6-1.3 1.2V12h2.2l-.4 3h-1.8v7A10 10 0 0022 12"/>
      </svg>
    </a>
  )}
          </nav>

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
