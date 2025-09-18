import { notFound } from 'next/navigation'
import Image from 'next/image'
import SimilarArtists from '@/components/similar-artists'

// Route config - ISR with time-based revalidation
export const revalidate = 3600 // Revalidate every hour
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
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const res = await fetch(`${baseUrl}/api/artist?handle=${handle}`, {
    next: { tags: [`artist:${handle}`] },
    cache: 'force-cache', // Ensure static generation
  })
  if (!res.ok) return res.status === 404 ? null : Promise.reject(res.statusText)
  const artist = await res.json()
  
  // Extract category from the nested structure
  const category = artist.artist_categories?.[0]?.categories?.name || 'Artist'
  
  return {
    ...artist,
    category
  }
}

async function fetchWorks(artistId: string) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const res = await fetch(`${baseUrl}/api/works?artistId=${artistId}`, {
    next: { tags: [`artist-works:${artistId}`] },
    cache: 'force-cache', // Ensure static generation
  })
  if (!res.ok) throw new Error(`Failed to fetch works: ${res.statusText}`)
  return res.json()
}

export default async function ArtistPage({ params }: { params: Promise<{ handle: string }> }) {
  try {
    const { handle } = await params
    const artist = await fetchArtist(handle)
    if (!artist) notFound()
    const works = await fetchWorks(artist.id)

    return (
      <div className="min-h-screen">
        {/* Hero */}
      {/* Hero */}
      <div className="relative max-w-6xl mx-auto">
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

  {/* Avatar */}
  {/* Avatar + Name Section */}
<div className="absolute -bottom-16 left-1/2 transform -translate-x-1/2 flex flex-col items-center sm:items-start sm:left-6 sm:transform-none">
  {/* Avatar */}
  <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full border-4 border-white overflow-hidden shadow-lg bg-white">
    {artist.avatar_url ? (
      <Image
        src={artist.avatar_url}
        alt={artist.display_name}
        width={200}
        height={200}
        className="w-full h-full object-cover rounded-full"
      />
    ) : (
      <div className="w-full h-full bg-gray-300 flex items-center justify-center text-2xl text-gray-600 rounded-full">
        {artist.display_name?.charAt(0)}
      </div>
    )}
  </div>

  {/* Name + Categories */}
 
</div>

</div>

        {/* Content */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-20">
          {/* Artist Name */}
          <div className="mt-3 text-center sm:text-left">
    <h2 className="text-5xl sm:text-2xl font-bold text-gray-900 mb-2 drop-shadow-md">
      {artist.display_name}
    </h2>
   
  </div>

          {/* About */}
          <div className="mb-8">
          {artist.artist_categories?.length > 0 && (
  <div className="flex flex-wrap gap-2 mt-3">
    {artist.artist_categories.map((ac: { categories?: { name: string } }, i: number) => (
      <span
        key={i}
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

          </div>



          {/* Works */}
          <div className="mb-12">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Work</h3>
            {works?.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {works.map((work: { id: string; title?: string; thumb_url: string }) => (
                  <div key={work.id} className="relative group rounded-lg overflow-hidden">
                    <Image
                      src={work.thumb_url}
                      alt={work.title || 'Artwork'}
                      width={400}
                      height={300}
                      className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    {/* {work.title && (
                      <div className="absolute bottom-0 inset-x-0 bg-black/50 text-white px-2 py-1 text-sm truncate">
                        {work.title}
                      </div>
                    )} */}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No works available yet.</p>
            )}
          </div>
          {/* Social links */}
          <div className="mb-8 flex flex-wrap gap-3">
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
</div>

          {/* Similar Artists */}
          <SimilarArtists 
            currentArtistId={artist.id}
            currentArtistCategory={artist.category}
          />
        </div>
      </div>
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
