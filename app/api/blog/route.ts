import { NextRequest, NextResponse } from 'next/server'
import { fetchBlogPosts } from '@/lib/sanity/queries'
import { rateLimitLoose } from '@/lib/ratelimit'
import { jsonResponse } from '@/lib/api-response'

export async function GET(request: NextRequest) {
  const rl = await rateLimitLoose(request)
  if (rl.limited) return rl.response

  try {
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '12', 10)

    if (page < 1 || limit < 1) {
      return jsonResponse({ error: 'Invalid page or limit' }, 400)
    }

    const allPosts = await fetchBlogPosts()
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
    return jsonResponse({ error: 'Failed to fetch blog posts' }, 500)
  }
}
