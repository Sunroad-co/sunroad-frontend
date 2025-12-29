/**
 * Utility functions for cache revalidation
 * Uses session-based authentication (no secrets sent from client)
 */

export async function revalidateArtist(handle: string) {
  try {
    const response = await fetch('/api/revalidate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Include cookies for session authentication
      body: JSON.stringify({
        handle,
        tags: [`artist:${handle}`]
      })
    })

    if (!response.ok) {
      throw new Error(`Failed to revalidate: ${response.statusText}`)
    }

    const result = await response.json()
    console.log('Revalidation successful:', result)
    return result
  } catch (error) {
    console.error('Error revalidating artist:', error)
    throw error
  }
}

export async function revalidateArtistWorks(artistId: string, handle: string) {
  try {
    const response = await fetch('/api/revalidate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Include cookies for session authentication
      body: JSON.stringify({
        handle,
        artistId,
        tags: [`artist-works:${artistId}`]
      })
    })

    if (!response.ok) {
      throw new Error(`Failed to revalidate: ${response.statusText}`)
    }

    const result = await response.json()
    console.log('Revalidation successful:', result)
    return result
  } catch (error) {
    console.error('Error revalidating artist works:', error)
    throw error
  }
}
