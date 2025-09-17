
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Navbar from '@/components/navbar'

// Route configuration for static generation
export const dynamic = 'force-static'
export const revalidate = 0 // Use cache tags for revalidation instead of time-based

// Helper: fetch artist data via internal API with cache tags
async function fetchArtist(handle: string) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const res = await fetch(
    `${baseUrl}/api/artist?handle=${handle}`,
    {
      next: { tags: [`artist:${handle}`] }, // attach cache tag
    }
  )

  if (!res.ok) {
    if (res.status === 404) {
      return null
    }
    throw new Error(`Failed to fetch artist: ${res.statusText}`)
  }
  
  const contentType = res.headers.get('content-type')
  if (!contentType || !contentType.includes('application/json')) {
    throw new Error('API returned non-JSON response')
  }
  
  return res.json()
}

// Helper: fetch artist works via internal API with cache tags
async function fetchWorks(artistId: string) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const res = await fetch(
    `${baseUrl}/api/works?artistId=${artistId}`,
    {
      next: { tags: [`artist-works:${artistId}`] }, // attach cache tag
    }
  )

  if (!res.ok) {
    throw new Error(`Failed to fetch works: ${res.statusText}`)
  }
  
  const contentType = res.headers.get('content-type')
  if (!contentType || !contentType.includes('application/json')) {
    throw new Error('API returned non-JSON response')
  }
  
  return res.json()
}

export default async function ArtistPage({ params }: { params: Promise<{ handle: string }> }) {
  try {
    // Await params in Next.js 15
    const { handle } = await params
    
    // Fetch artist data via API with cache tags
    const artist = await fetchArtist(handle)
    
    if (!artist) {
      notFound()
    }

    // Fetch works data via API with cache tags
    const works = await fetchWorks(artist.id)

    return (
      <div className="min-h-screen bg-[#f5f5dc]">
        <Navbar />

      {/* Profile Banner */}
      <div className="relative">
        {/* Banner Image */}
        <div className="w-full h-96 bg-gradient-to-r from-blue-400 to-purple-500 relative overflow-hidden">
          <Image
            src={artist.banner_url}
            alt="Mountain landscape"
            fill
            className="object-cover"
            priority
          />
        </div>
        
        {/* Profile Picture and Name */}
        <div className="absolute bottom-4 left-4 sm:left-8 flex items-end space-x-3 sm:space-x-4">
          <div className="relative">
            <div className="w-16 h-16 sm:w-24 sm:h-24 rounded-full bg-gray-200 border-4 border-white overflow-hidden">
              {artist.avatar_url ? (
                <Image
                  src={artist.avatar_url}
                  alt={artist.display_name || 'Artist'}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gray-300 flex items-center justify-center">
                  <svg className="w-8 h-8 sm:w-12 sm:h-12 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </div>
          </div>
          <div className="mb-2">
            <h2 className="text-lg sm:text-2xl font-bold text-white drop-shadow-lg">
              {artist.display_name || 'Artist Name'}
            </h2>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* About Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-2xl font-bold text-gray-900">About</h3>
            <button className="p-2 text-gray-400 hover:text-gray-600">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
              </svg>
            </button>
          </div>
          <p className="text-gray-700 text-lg">
            {artist.bio || "I'm an artist. I create beautiful work in my local area."}
          </p>
        </div>

        {/* Social Media Links */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-3 sm:gap-4">
            {artist?.website_url && (
              <a
                href={artist.website_url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 sm:px-6 py-2 sm:py-3 bg-amber-800 text-white rounded-full hover:bg-amber-900 transition-colors text-sm sm:text-base"
              >
                Web
              </a>
            )}
            {artist?.instagram_url && (
              <a
                href={artist.instagram_url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 sm:px-6 py-2 sm:py-3 bg-amber-800 text-white rounded-full hover:bg-amber-900 transition-colors text-sm sm:text-base"
              >
                Instagram
              </a>
            )}
            {artist?.facebook_url && (
              <a
                href={artist.facebook_url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 sm:px-6 py-2 sm:py-3 bg-amber-800 text-white rounded-full hover:bg-amber-900 transition-colors text-sm sm:text-base"
              >
                Facebook
              </a>
            )}
            {artist?.twitter && (
              <a
                href={artist.twitter}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 sm:px-6 py-2 sm:py-3 bg-amber-800 text-white rounded-full hover:bg-amber-900 transition-colors text-sm sm:text-base"
              >
                Twitter
              </a>
            )}
            {artist?.youtube && (
              <a
                href={artist.youtube}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 sm:px-6 py-2 sm:py-3 bg-amber-800 text-white rounded-full hover:bg-amber-900 transition-colors text-sm sm:text-base"
              >
                YouTube
              </a>
            )}
          </div>
        </div>

        {/* Work Section */}
        <div className="mb-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">Work</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {works?.map((work: { id: string; title: string; thumb_url: string; src_url: string; created_at: string }) => (
              <div key={work.id} className="relative group">
                <Image
                  src={work.thumb_url}
                  alt={work.title || 'Artwork'}
                  width={400}
                  height={300}
                  className="w-full h-48 object-cover rounded-lg transition-transform group-hover:scale-105"
                />
                {/* {work.title && (
                  <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-2 rounded-b-lg">
                    <p className="text-sm truncate">{work.title}</p>
                  </div>
                )} */}
              </div>
            ))}
          </div>
          {works?.length === 0 && (
            <p className="text-gray-500 text-center py-8">No works available yet.</p>
          )}
        </div>

        {/* Similar Artists Section */}
        {/* <div className="mb-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">Similar Artists</h3>
          <div className="flex space-x-4 overflow-x-auto pb-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex-shrink-0">
                <div className="w-20 h-20 rounded-full bg-gray-200 border-2 border-white shadow-md overflow-hidden">
                  <Image
                    src={`/api/placeholder/80/80?text=Artist+${i}`}
                    alt={`Similar artist ${i}`}
                    width={80}
                    height={80}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            ))}
          </div>
        </div> */}
      </div>
    </div>
  )
  } catch (error) {
    console.error('Error in ArtistPage:', error)
    return (
      <div className="min-h-screen bg-[#f5f5dc]">
        <Navbar />
        <div className="p-10 text-center">
          <p className="text-red-600">Something went wrong while loading this artist profile.</p>
        </div>
      </div>
    )
  }
}
