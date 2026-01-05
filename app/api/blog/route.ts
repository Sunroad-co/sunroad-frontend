import { NextRequest, NextResponse } from 'next/server'
import { fetchBlogPosts } from '@/lib/sanity/queries'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '12', 10)

    if (page < 1 || limit < 1) {
      return NextResponse.json(
        { error: 'Invalid page or limit' },
        { status: 400 }
      )
    }

    // Fetch all posts (they're already sorted by publishedAt desc)
    const allPosts = await fetchBlogPosts()

    // Calculate pagination
    const startIndex = (page - 1) * limit
    const endIndex = startIndex + limit
    const paginatedPosts = allPosts.slice(startIndex, endIndex)

    return NextResponse.json(paginatedPosts, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    })
  } catch (error) {
    console.error('Error fetching blog posts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch blog posts' },
      { status: 500 }
    )
  }
}

