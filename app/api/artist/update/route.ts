import { NextRequest, NextResponse } from 'next/server'
import { revalidateArtist } from '@/lib/revalidate-artist'

/**
 * Example API route for updating artist data and triggering revalidation
 * This would typically be called from your admin panel or when artists update their profiles
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { handle, artistId, updates } = body

    // Validate required fields
    if (!handle || !artistId) {
      return NextResponse.json(
        { error: 'handle and artistId are required' },
        { status: 400 }
      )
    }

    // Here you would typically update the artist data in your database
    // For example:
    // const supabase = createClient()
    // const { error } = await supabase
    //   .from('artists_min')
    //   .update(updates)
    //   .eq('id', artistId)

    // if (error) {
    //   return NextResponse.json({ error: error.message }, { status: 500 })
    // }

    // After successful update, revalidate the artist's page
    await revalidateArtist({ handle, artistId })

    return NextResponse.json({
      message: 'Artist updated and page revalidated successfully',
      handle,
      artistId,
      updates
    })

  } catch (error) {
    console.error('Error updating artist:', error)
    return NextResponse.json(
      { error: 'Failed to update artist' },
      { status: 500 }
    )
  }
}

/**
 * Example of how to use this API:
 * 
 * POST /api/artist/update
 * {
 *   "handle": "prairie-arts-collective",
 *   "artistId": "123e4567-e89b-12d3-a456-426614174000",
 *   "updates": {
 *     "bio": "Updated bio text",
 *     "website_url": "https://newwebsite.com"
 *   }
 * }
 */
