import { revalidateTag, revalidatePath } from 'next/cache'
import { NextRequest, NextResponse } from 'next/server'
import { rateLimitWebhookLoose } from '@/lib/ratelimit'
import { constantTimeCompare, jsonResponse } from '@/lib/api-response'

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
 */
export async function POST(request: NextRequest) {
  const webhookSecret = request.headers.get('x-sanity-webhook-secret')
  const expectedSecret = process.env.SANITY_WEBHOOK_SECRET

  if (!webhookSecret || !expectedSecret) {
    return jsonResponse(
      { ok: false, error: 'Unauthorized: Missing webhook secret' },
      401
    )
  }

  if (!constantTimeCompare(webhookSecret, expectedSecret)) {
    return jsonResponse(
      { ok: false, error: 'Unauthorized: Invalid webhook secret' },
      401
    )
  }

  const rl = await rateLimitWebhookLoose(request, 'revalidatePost')
  if (rl.limited) return rl.response

  try {
    const body = await request.json()
    const { _type, _id, slug } = body

    const allowedTypes = ['post', 'author', 'category']
    if (!_type || !allowedTypes.includes(_type)) {
      return jsonResponse(
        { ok: true, message: `Ignored: _type is '${_type}', expected one of: ${allowedTypes.join(', ')}` },
        200
      )
    }

    const revalidatedTags: string[] = []
    const revalidatedPaths: string[] = []

    ;(revalidateTag as (tag: string) => void)('sanity:blog')
    revalidatePath('/blog')
    revalidatedTags.push('sanity:blog')
    revalidatedPaths.push('/blog')

    ;(revalidateTag as (tag: string) => void)('sanity:post')
    revalidatedTags.push('sanity:post')

    ;(revalidateTag as (tag: string) => void)('sanity:featured')
    revalidatePath('/')
    revalidatedTags.push('sanity:featured')
    revalidatedPaths.push('/')

    if (_type === 'post' && slug && typeof slug === 'string') {
      const postTag = `sanity:post:${slug}`
      const postPath = `/blog/${slug}`
      ;(revalidateTag as (tag: string) => void)(postTag)
      revalidatePath(postPath)
      revalidatedTags.push(postTag)
      revalidatedPaths.push(postPath)
    }

    return jsonResponse(
      {
        ok: true,
        revalidated: {
          _type,
          _id,
          slug: slug ?? null,
          paths: revalidatedPaths,
          tags: revalidatedTags,
        },
      },
      200
    )
  } catch (error) {
    console.error('[revalidatePost] Error processing webhook:', error)
    return jsonResponse(
      {
        ok: false,
        error: error instanceof Error ? error.message : 'Failed to process webhook',
      },
      500
    )
  }
}

export async function GET() {
  return jsonResponse(
    { ok: false, error: 'Method not allowed. Use POST.' },
    405
  )
}
