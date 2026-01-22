import { revalidateTag, revalidatePath } from 'next/cache'
import { NextRequest, NextResponse } from 'next/server'

// Route segment config - ensure this endpoint is never cached
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * Sanity webhook handler for revalidating blog posts, authors, and categories
 * 
 * Webhook configuration:
 * - URL: https://sunroad-frontent.vercel.app/api/revalidatePost
 * - Filter: _type in ["post","author","category"]
 * - Header: X-Sanity-Webhook-Secret: <secret>
 * - Body projection: { "_type": _type, "_id": _id, "slug": slug.current }
 * 
 * Note: For author/category payloads, slug will be null. For delete/unpublish events, slug may also be null.
 */
export async function POST(request: NextRequest) {
  try {
    // Verify webhook secret
    const webhookSecret = request.headers.get('x-sanity-webhook-secret')
    const expectedSecret = process.env.SANITY_WEBHOOK_SECRET

    if (!webhookSecret || !expectedSecret) {
      console.error('[revalidatePost] Missing webhook secret in header or env')
      return NextResponse.json(
        { ok: false, error: 'Unauthorized: Missing webhook secret' },
        { status: 401 }
      )
    }

    if (webhookSecret !== expectedSecret) {
      console.error('[revalidatePost] Invalid webhook secret')
      return NextResponse.json(
        { ok: false, error: 'Unauthorized: Invalid webhook secret' },
        { status: 401 }
      )
    }

    // Parse and validate payload
    const body = await request.json()
    const { _type, _id, slug } = body

    // Log the incoming webhook
    console.log('[revalidatePost] Received webhook:', { _type, _id, slug })

    // Accept only post, author, or category types. Ignore others with 200 OK.
    const allowedTypes = ['post', 'author', 'category']
    if (!_type || !allowedTypes.includes(_type)) {
      console.log(`[revalidatePost] Ignoring unsupported type: ${_type}`)
      return NextResponse.json(
        { ok: true, message: `Ignored: _type is '${_type}', expected one of: ${allowedTypes.join(', ')}` },
        { status: 200 }
      )
    }

    // Always revalidate blog listing page
    const revalidatedTags: string[] = []
    const revalidatedPaths: string[] = []
    
    // Always revalidate blog listing (sync, no await)
    // Type assertion to use single-arg signature as per requirements
    ;(revalidateTag as (tag: string) => void)('sanity:blog')
    revalidatePath('/blog')
    revalidatedTags.push('sanity:blog')
    revalidatedPaths.push('/blog')

    // Always revalidate general post tag
    ;(revalidateTag as (tag: string) => void)('sanity:post')
    revalidatedTags.push('sanity:post')

    // Revalidate featured posts tag and homepage (featured content is displayed on homepage)
    ;(revalidateTag as (tag: string) => void)('sanity:featured')
    revalidatePath('/')
    revalidatedTags.push('sanity:featured')
    revalidatedPaths.push('/')

    // Only when _type === 'post' AND slug is string, revalidate specific post
    if (_type === 'post' && slug && typeof slug === 'string') {
      const postTag = `sanity:post:${slug}`
      const postPath = `/blog/${slug}`
      
      ;(revalidateTag as (tag: string) => void)(postTag)
      revalidatePath(postPath)
      revalidatedTags.push(postTag)
      revalidatedPaths.push(postPath)
      
      console.log(`[revalidatePost] Revalidated post: ${slug}`)
    } else {
      console.log(`[revalidatePost] Revalidated ${_type} (no specific post revalidation)`)
    }

    return NextResponse.json(
      {
        ok: true,
        revalidated: {
          _type,
          _id,
          slug: slug || null,
          paths: revalidatedPaths,
          tags: revalidatedTags,
        },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('[revalidatePost] Error processing webhook:', error)
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : 'Failed to process webhook',
      },
      { status: 500 }
    )
  }
}

// Explicitly disallow GET and other methods
export async function GET() {
  return NextResponse.json(
    { ok: false, error: 'Method not allowed. Use POST.' },
    { status: 405 }
  )
}

