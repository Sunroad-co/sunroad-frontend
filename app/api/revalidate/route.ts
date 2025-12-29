import { revalidateTag, revalidatePath } from 'next/cache'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Protected revalidation endpoint
 * 
 * Mode A (User/Session): Authenticates via Supabase session and verifies ownership
 * Mode B (System/Webhook): Requires server-only secret token via x-revalidate-secret header
 */
export async function POST(request: NextRequest) {
  try {
    // Parse body
    const body = await request.json()
    const { tags, handle, artistId } = body

    // Validate input: handle is required
    if (!handle) {
      return NextResponse.json(
        { ok: false, error: 'handle is required' },
        { status: 400 }
      )
    }

    // Validate tags if provided
    if (tags && !Array.isArray(tags)) {
      return NextResponse.json(
        { ok: false, error: 'tags must be an array' },
        { status: 400 }
      )
    }

    // Mode B: Check for system secret (for webhooks/future use)
    const systemSecret = request.headers.get('x-revalidate-secret')
    const expectedSecret = process.env.REVALIDATE_SECRET_TOKEN

    if (systemSecret && expectedSecret) {
      // System mode: verify secret
      if (systemSecret !== expectedSecret) {
        return NextResponse.json(
          { ok: false, error: 'Unauthorized: Invalid system secret' },
          { status: 401 }
        )
      }
      // Secret valid, proceed with revalidation
    } else {
      // Mode A: User/session mode - authenticate and verify ownership
      const supabase = await createClient()
      const { data: { user }, error: authError } = await supabase.auth.getUser()

      if (authError || !user) {
        return NextResponse.json(
          { ok: false, error: 'Unauthorized: Authentication required' },
          { status: 401 }
        )
      }

      // Verify user owns the artist profile being revalidated
      const { data: profile, error: profileError } = await supabase
        .from('artists_min')
        .select('id, auth_user_id')
        .eq('handle', handle)
        .single()

      if (profileError || !profile) {
        return NextResponse.json(
          { ok: false, error: 'Artist profile not found' },
          { status: 404 }
        )
      }

      if (profile.auth_user_id !== user.id) {
        return NextResponse.json(
          { ok: false, error: 'Forbidden: You can only revalidate your own content' },
          { status: 403 }
        )
      }

      // If artistId provided, verify it matches the handle
      if (artistId && profile.id !== artistId) {
        return NextResponse.json(
          { ok: false, error: 'Forbidden: artistId does not match handle' },
          { status: 403 }
        )
      }
    }

    // Perform revalidation
    if (tags && Array.isArray(tags)) {
      await Promise.all(tags.map((tag: string) => revalidateTag(tag, 'max')))
    }

    // Artist-specific revalidation
    await revalidateTag(`artist:${handle}`, 'max')
    await revalidatePath(`/artists/${handle}`)

    if (artistId) {
      await revalidateTag(`artist-works:${artistId}`, 'max')
    }

    return NextResponse.json(
      { 
        ok: true,
        revalidated: { tags, handle, artistId }
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Revalidation error:', error)
    return NextResponse.json(
      { ok: false, error: 'Failed to revalidate' },
      { status: 500 }
    )
  }
}
