import { revalidateTag, revalidatePath } from 'next/cache'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { tags, handle, artistId } = body

    // Support both tag-based and artist-specific revalidation
    if (tags && Array.isArray(tags)) {
      tags.forEach((tag: string) => {
        revalidateTag(tag)
      })
    }

    // Artist-specific revalidation
    if (handle) {
      revalidateTag(`artist:${handle}`)
      revalidatePath(`/artists/${handle}`)
    }

    if (artistId) {
      revalidateTag(`artist-works:${artistId}`)
    }

    return NextResponse.json(
      { 
        message: 'Revalidation successful',
        revalidated: { tags, handle, artistId },
        now: Date.now()
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Revalidation error:', error)
    return NextResponse.json(
      { error: 'Failed to revalidate' },
      { status: 500 }
    )
  }
}
