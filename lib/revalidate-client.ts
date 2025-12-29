/**
 * Client-side helper for revalidation API calls
 * Uses session-based authentication (no secrets sent from client)
 */

interface RevalidateOptions {
  tags?: string[]
  handle?: string
  artistId?: string
}

export async function revalidateCache(options: RevalidateOptions) {
  try {
    // No token needed - server authenticates via Supabase session cookies
    const response = await fetch('/api/revalidate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Include cookies for session authentication
      body: JSON.stringify(options),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: response.statusText }))
      throw new Error(error.error || `Revalidation failed: ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    // Log but don't throw - revalidation is best effort
    console.warn('Failed to revalidate cache:', error)
  }
}

