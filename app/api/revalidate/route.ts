import { revalidateTag, revalidatePath } from 'next/cache'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Protected revalidation endpoint
 * 
 * System mode: Requires x-revalidate-secret header matching env -> allows revalidateTag for provided tags (array) and optional handle/path
 * Session mode: Authenticated via Supabase session cookie -> user can only revalidate their own artist handle
 * 
 * IMPORTANT: In session mode, tags from client are IGNORED to prevent tag abuse.
 * Only the artist's own cache is revalidated: artist:${handle} and /artists/${handle}
 */
export async function POST(request: NextRequest) {
  try {
    // Parse body
    const body = await request.json()
    const { tags, handle, artistId, path } = body

    // Check for system secret (for webhooks/system use)
    const systemSecret = request.headers.get('x-revalidate-secret')
    const expectedSecret = process.env.REVALIDATE_SECRET_TOKEN

    const isSystemMode = systemSecret && expectedSecret

    if (isSystemMode) {
      // ===== SYSTEM MODE =====
      // Verify secret
      if (systemSecret !== expectedSecret) {
        console.warn('[Revalidate] System mode: Invalid secret provided')
        return NextResponse.json(
          { ok: false, error: 'Unauthorized: Invalid system secret' },
          { status: 401 }
        )
      }

      console.log('[Revalidate] System mode: Processing revalidation', { tags, handle, path })

      // System mode: Process provided tags and optional handle/path
      if (tags && Array.isArray(tags)) {
        await Promise.all(tags.map((tag: string) => revalidateTag(tag, 'max')))
        console.log('[Revalidate] System mode: Revalidated tags', tags)
      }

      // Optional handle-based revalidation in system mode
      if (handle) {
        await revalidateTag(`artist:${handle}`, 'max')
        await revalidatePath(`/artists/${handle}`)
        console.log('[Revalidate] System mode: Revalidated artist', handle)
      }

      // Optional path revalidation in system mode
      if (path) {
        await revalidatePath(path)
        console.log('[Revalidate] System mode: Revalidated path', path)
      }

      // Optional artistId-based revalidation in system mode
      if (artistId) {
        await revalidateTag(`artist-works:${artistId}`, 'max')
        console.log('[Revalidate] System mode: Revalidated artist works', artistId)
      }

      return NextResponse.json(
        { 
          ok: true,
          mode: 'system',
          revalidated: { tags, handle, path, artistId }
        },
        { status: 200 }
      )
    } else {
      // ===== SESSION MODE =====
      // Authenticate user
      const supabase = await createClient()
      const { data: { user }, error: authError } = await supabase.auth.getUser()

      if (authError || !user) {
        console.warn('[Revalidate] Session mode: Authentication failed', { error: authError?.message })
        return NextResponse.json(
          { ok: false, error: 'Unauthorized: Authentication required' },
          { status: 401 }
        )
      }

      // Handle is required in session mode
      if (!handle) {
        console.warn('[Revalidate] Session mode: Missing handle', { userId: user.id })
        return NextResponse.json(
          { ok: false, error: 'handle is required' },
          { status: 400 }
        )
      }

      // Verify user owns the artist profile being revalidated
      const { data: profile, error: profileError } = await supabase
        .from('artists_min')
        .select('id, auth_user_id')
        .eq('handle', handle)
        .single()

      if (profileError || !profile) {
        console.warn('[Revalidate] Session mode: Artist profile not found', { 
          handle, 
          userId: user.id,
          error: profileError?.message 
        })
        return NextResponse.json(
          { ok: false, error: 'Artist profile not found' },
          { status: 404 }
        )
      }

      if (profile.auth_user_id !== user.id) {
        console.warn('[Revalidate] Session mode: Ownership verification failed', {
          handle,
          requestedUserId: user.id,
          ownerUserId: profile.auth_user_id
        })
        return NextResponse.json(
          { ok: false, error: 'Forbidden: You can only revalidate your own content' },
          { status: 403 }
        )
      }

      // If artistId provided, verify it matches the handle
      if (artistId && profile.id !== artistId) {
        console.warn('[Revalidate] Session mode: artistId mismatch', {
          handle,
          providedArtistId: artistId,
          actualArtistId: profile.id
        })
        return NextResponse.json(
          { ok: false, error: 'Forbidden: artistId does not match handle' },
          { status: 403 }
        )
      }

      // Session mode: IGNORE tags from client to prevent tag abuse
      // Only revalidate the artist's own cache
      console.log('[Revalidate] Session mode: Revalidating artist cache', {
        handle,
        userId: user.id,
        artistId: profile.id,
        ignoredTags: tags // Log ignored tags for debugging
      })

      // Revalidate only the artist's own cache
      await revalidateTag(`artist:${handle}`, 'max')
      await revalidatePath(`/artists/${handle}`)

      // Optionally revalidate artist works if artistId matches
      if (artistId && profile.id === artistId) {
        await revalidateTag(`artist-works:${artistId}`, 'max')
      }

      return NextResponse.json(
        { 
          ok: true,
          mode: 'session',
          revalidated: { handle, artistId: profile.id }
        },
        { status: 200 }
      )
    }
  } catch (error) {
    console.error('[Revalidate] Unexpected error:', error)
    return NextResponse.json(
      { ok: false, error: 'Failed to revalidate' },
      { status: 500 }
    )
  }
}
