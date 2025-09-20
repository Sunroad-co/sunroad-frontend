import type { Metadata } from "next";
import { createAnonClient } from '@/lib/supabase/anon'

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";


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
    metadataBase: new URL(defaultUrl),
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

export default function ArtistLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
