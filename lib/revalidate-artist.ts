/**
 * Helper function to revalidate artist pages when data changes
 * This should be called whenever an artist updates their profile, bio, or works
 * 
 * For client-side calls: Uses session-based authentication (no secrets)
 * For server-side calls: Can use system secret via x-revalidate-secret header
 */

import { getSiteUrl } from '@/lib/site-url'

interface RevalidateArtistOptions {
  handle: string
  artistId: string
  baseUrl?: string
  systemSecret?: string // Optional: for server-side/webhook calls
}

export async function revalidateArtist({ 
  handle, 
  artistId, 
  baseUrl = getSiteUrl(),
  systemSecret
}: RevalidateArtistOptions) {
  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    }

    // If system secret provided (server-side), use it; otherwise rely on session
    if (systemSecret) {
      headers['x-revalidate-secret'] = systemSecret
    }

    const response = await fetch(`${baseUrl}/api/revalidate`, {
      method: 'POST',
      headers,
      credentials: systemSecret ? 'omit' : 'include', // Include cookies only for session mode
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
