/**
 * Utility functions for cache revalidation
 */

export async function revalidateArtist(handle: string) {
  try {
    const response = await fetch('/api/revalidate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
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

export async function revalidateArtistWorks(artistId: string) {
  try {
    const response = await fetch('/api/revalidate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
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
