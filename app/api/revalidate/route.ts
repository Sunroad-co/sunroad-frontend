import { revalidateTag, revalidatePath } from 'next/cache'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { rateLimitModerate } from '@/lib/ratelimit'
import { constantTimeCompare, jsonResponse } from '@/lib/api-response'

/** Allowed path prefixes/values for system-mode path revalidation (no arbitrary paths). */
const ALLOWED_REVALIDATE_PATHS = ['/', '/blog'] as const
const ALLOWED_PATH_PREFIXES = ['/blog/', '/u/'] as const

function isPathAllowed(path: string): boolean {
  if (typeof path !== 'string' || path.includes('..')) return false
  if (!path.startsWith('/')) return false
  if (ALLOWED_REVALIDATE_PATHS.includes(path as '/' | '/blog')) return true
  return ALLOWED_PATH_PREFIXES.some((p) => path.startsWith(p) && path.length > p.length)
}

/**
 * Protected revalidation endpoint
 *
 * System mode: Requires x-revalidate-secret header matching env -> allows revalidateTag for provided tags (array) and optional handle/path
 * Session mode: Authenticated via Supabase session cookie -> user can only revalidate their own artist handle
 *
 * IMPORTANT: In session mode, tags from client are IGNORED to prevent tag abuse.
 * Only the artist's own cache is revalidated: artist:${handle} and /u/${handle}
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { tags, handle, artistId, path } = body

    const systemSecret = request.headers.get('x-revalidate-secret')
    const expectedSecret = process.env.REVALIDATE_SECRET_TOKEN
    const isSystemMode = systemSecret && expectedSecret

    if (isSystemMode) {
      const rl = await rateLimitModerate(request, null)
      if (rl.limited) return rl.response

      if (!constantTimeCompare(systemSecret, expectedSecret!)) {
        return jsonResponse({ ok: false, error: 'Unauthorized' }, 401)
      }

      if (path !== undefined && path !== null && !isPathAllowed(String(path))) {
        return jsonResponse({ ok: false, error: 'Invalid path for revalidation' }, 400)
      }

      if (tags && Array.isArray(tags)) {
        await Promise.all(tags.map((tag: string) => revalidateTag(tag, 'max')))
      }
      if (handle) {
        await revalidateTag(`artist:${handle}`, 'max')
        await revalidatePath(`/u/${handle}`)
      }
      if (path && isPathAllowed(path)) {
        await revalidatePath(path)
      }
      if (artistId) {
        await revalidateTag(`artist-works:${artistId}`, 'max')
      }

      return jsonResponse(
        { ok: true, mode: 'system', revalidated: { tags, handle, path, artistId } },
        200
      )
    }

    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return jsonResponse({ ok: false, error: 'Unauthorized: Authentication required' }, 401)
    }

    const rl = await rateLimitModerate(request, user.id)
    if (rl.limited) return rl.response

    if (!handle) {
      return jsonResponse({ ok: false, error: 'handle is required' }, 400)
    }

    const { data: profile, error: profileError } = await supabase
      .from('artists_min')
      .select('id, auth_user_id')
      .eq('handle', handle)
      .single()

    if (profileError || !profile) {
      return jsonResponse({ ok: false, error: 'Artist profile not found' }, 404)
    }

    if (profile.auth_user_id !== user.id) {
      return jsonResponse(
        { ok: false, error: 'Forbidden: You can only revalidate your own content' },
        403
      )
    }

    if (artistId && profile.id !== artistId) {
      return jsonResponse(
        { ok: false, error: 'Forbidden: artistId does not match handle' },
        403
      )
    }

    await revalidateTag(`artist:${handle}`, 'max')
    await revalidatePath(`/u/${handle}`)
    if (artistId && profile.id === artistId) {
      await revalidateTag(`artist-works:${artistId}`, 'max')
    }

    return jsonResponse(
      { ok: true, mode: 'session', revalidated: { handle, artistId: profile.id } },
      200
    )
  } catch (error) {
    console.error('[Revalidate] Unexpected error:', error)
    return jsonResponse({ ok: false, error: 'Failed to revalidate' }, 500)
  }
}
