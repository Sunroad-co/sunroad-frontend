/**
 * Helper function to revalidate artist pages when data changes
 * This should be called whenever an artist updates their profile, bio, or works
 */

interface RevalidateArtistOptions {
  handle: string
  artistId: string
  baseUrl?: string
}

export async function revalidateArtist({ 
  handle, 
  artistId, 
  baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000' 
}: RevalidateArtistOptions) {
  try {
    const response = await fetch(`${baseUrl}/api/revalidate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        handle,
        artistId,
        tags: [
          `artist:${handle}`,
          `artist-works:${artistId}`,
          `artist-profile:${handle}`
        ]
      }),
    })

    if (!response.ok) {
      throw new Error(`Revalidation failed: ${response.statusText}`)
    }

    const result = await response.json()
    console.log(`Successfully revalidated artist ${handle}:`, result)
    
    return result
  } catch (error) {
    console.error(`Failed to revalidate artist ${handle}:`, error)
    throw error
  }
}

/**
 * Revalidate multiple artists at once
 */
export async function revalidateArtists(artists: Array<{ handle: string; artistId: string }>) {
  const results = await Promise.allSettled(
    artists.map(artist => revalidateArtist(artist))
  )
  
  const successful = results.filter(result => result.status === 'fulfilled').length
  const failed = results.filter(result => result.status === 'rejected').length
  
  console.log(`Revalidation complete: ${successful} successful, ${failed} failed`)
  
  return { successful, failed, results }
}
