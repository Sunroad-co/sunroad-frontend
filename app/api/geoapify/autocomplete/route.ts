import { NextRequest, NextResponse } from 'next/server'
import { rateLimitStrict } from '@/lib/ratelimit'
import { getCorsHeaders } from '@/lib/cors'

const GEOAPIFY_API_KEY = process.env.GEOAPIFY_API_KEY
const CACHE_TTL = 3600 // 1 hour
const QUERY_MIN_LENGTH = 3
const QUERY_MAX_LENGTH = 64

// Simple in-memory cache (consider Redis for production)
const cache = new Map<string, { data: unknown; expires: number }>()

function validateQuery(q: string | null): { ok: true; query: string } | { ok: false; error: string; status: number } {
  if (q == null || typeof q !== 'string') {
    return { ok: false, error: 'Query required', status: 400 }
  }
  const trimmed = q.trim()
  if (trimmed.length < QUERY_MIN_LENGTH) {
    return { ok: false, error: `Query must be at least ${QUERY_MIN_LENGTH} characters`, status: 400 }
  }
  if (trimmed.length > QUERY_MAX_LENGTH) {
    return { ok: false, error: `Query must be at most ${QUERY_MAX_LENGTH} characters`, status: 400 }
  }
  return { ok: true, query: trimmed }
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, { status: 204, headers: getCorsHeaders(request) })
}

export async function GET(request: NextRequest) {
  const cors = getCorsHeaders(request)

  const strict = await rateLimitStrict(request, 'geoapify')
  if (strict.limited) {
    const headers = new Headers(cors)
    strict.response.headers.forEach((v: string, k: string) => headers.set(k, v))
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429, headers }
    )
  }

  const searchParams = request.nextUrl.searchParams
  const q = searchParams.get('q')
  const validation = validateQuery(q)
  if (!validation.ok) {
    return NextResponse.json(
      { error: validation.error },
      { status: validation.status, headers: cors }
    )
  }
  const query = validation.query

  if (!GEOAPIFY_API_KEY) {
    return NextResponse.json(
      { error: 'Server configuration error' },
      { status: 500, headers: cors }
    )
  }

  const cacheKey = `geoapify:${query.toLowerCase()}`
  const cached = cache.get(cacheKey)
  if (cached && cached.expires > Date.now()) {
    return NextResponse.json(cached.data, {
      headers: { ...cors, 'X-Cache': 'HIT' },
    })
  }

  try {
    const url = new URL('https://api.geoapify.com/v1/geocode/autocomplete')
    url.searchParams.set('text', query)
    url.searchParams.set('apiKey', GEOAPIFY_API_KEY)
    url.searchParams.set('limit', '10')
    url.searchParams.set('filter', 'countrycode:us')

    const response = await fetch(url.toString())

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error')
      console.error(`Geoapify API error ${response.status}:`, errorText)
      return NextResponse.json(
        { error: 'Failed to fetch location suggestions' },
        { status: response.status, headers: cors }
      )
    }

    const data = await response.json()

    cache.set(cacheKey, {
      data,
      expires: Date.now() + CACHE_TTL * 1000,
    })

    if (cache.size > 1000) {
      const now = Date.now()
      for (const [key, value] of cache.entries()) {
        if (value.expires < now) cache.delete(key)
      }
    }

    return NextResponse.json(data, {
      headers: {
        ...cors,
        'Cache-Control': `public, s-maxage=${CACHE_TTL}`,
        'X-Cache': 'MISS',
      },
    })
  } catch (error) {
    console.error('Error calling Geoapify API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: cors }
    )
  }
}
