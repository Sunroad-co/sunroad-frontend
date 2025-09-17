import { revalidateTag } from 'next/cache'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { tags } = body

    if (!tags || !Array.isArray(tags)) {
      return NextResponse.json(
        { error: 'Tags array is required' },
        { status: 400 }
      )
    }

    // Revalidate each tag
    tags.forEach((tag: string) => {
      revalidateTag(tag)
    })

    return NextResponse.json(
      { 
        message: 'Revalidation successful',
        revalidated: tags,
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
