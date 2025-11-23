import { revalidateTag, revalidatePath } from 'next/cache'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { tags, handle, artistId } = body

    // Support both tag-based and artist-specific revalidation
    if (tags && Array.isArray(tags)) {
      await Promise.all(tags.map((tag: string) => revalidateTag(tag, 'default')))
    }

    // Artist-specific revalidation
    if (handle) {
      await revalidateTag(`artist:${handle}`, 'default')
      await revalidatePath(`/artists/${handle}`)
    }

    if (artistId) {
      await revalidateTag(`artist-works:${artistId}`, 'default')
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
