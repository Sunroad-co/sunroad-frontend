import { NextResponse } from 'next/server'
import { createAnonClient } from '@/lib/supabase/anon'

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const artistId = url.searchParams.get('artistId')

    if (!artistId) {
      return NextResponse.json({ error: 'Missing artistId parameter' }, { status: 400 })
    }

    const supabase = createAnonClient()
    const { data: works, error } = await supabase
      .from('artworks_min')
      .select('id,title,thumb_url,src_url,created_at')
      .eq('artist_id', artistId)
      .order('created_at', { ascending: false })
      .limit(24)

    if (error) {
      console.error('Error fetching works:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(works || [], {
      headers: { 
        'x-next-cache-tags': `artist-works:${artistId}`,
        'Cache-Control': 'public, s-maxage=31536000, stale-while-revalidate=86400'
      },
    })
  } catch (error) {
    console.error('Unexpected error in works API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
