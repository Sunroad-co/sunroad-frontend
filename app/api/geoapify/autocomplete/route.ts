import { NextRequest, NextResponse } from 'next/server'

const GEOAPIFY_API_KEY = process.env.GEOAPIFY_API_KEY
const CACHE_TTL = 3600 // 1 hour

// Simple in-memory cache (consider Redis for production)
const cache = new Map<string, { data: any; expires: number }>()

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const query = searchParams.get('q')
  
  if (!query || query.length < 2) {
    return NextResponse.json({ error: 'Query required (minimum 2 characters)' }, { status: 400 })
  }

  if (!GEOAPIFY_API_KEY) {
    console.error('GEOAPIFY_API_KEY is not set')
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
  }

  // Check cache
  const cacheKey = `geoapify:${query.toLowerCase()}`
  const cached = cache.get(cacheKey)
  if (cached && cached.expires > Date.now()) {
    return NextResponse.json(cached.data, {
      headers: { 'X-Cache': 'HIT' }
    })
  }

  try {
    // Call Geoapify autocomplete API
    const url = new URL('https://api.geoapify.com/v1/geocode/autocomplete')
    url.searchParams.set('text', query)
    url.searchParams.set('apiKey', GEOAPIFY_API_KEY)
    url.searchParams.set('limit', '10')
    url.searchParams.set('filter', 'countrycode:us') // MVP US-only

    const response = await fetch(url.toString())
    
    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error')
      console.error(`Geoapify API error ${response.status}:`, errorText)
      return NextResponse.json(
        { error: 'Failed to fetch location suggestions' },
        { status: response.status }
      )
    }

    const data = await response.json()

    // Cache result
    cache.set(cacheKey, {
      data,
      expires: Date.now() + CACHE_TTL * 1000
    })

    // Clean up old cache entries periodically (simple cleanup)
    if (cache.size > 1000) {
      const now = Date.now()
      for (const [key, value] of cache.entries()) {
        if (value.expires < now) {
          cache.delete(key)
        }
      }
    }

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': `public, s-maxage=${CACHE_TTL}`,
        'X-Cache': 'MISS'
      }
    })
  } catch (error) {
    console.error('Error calling Geoapify API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

