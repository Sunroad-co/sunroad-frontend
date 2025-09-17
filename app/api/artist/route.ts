import { NextResponse } from 'next/server'
import { createAnonClient } from '@/lib/supabase/anon'

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const handle = url.searchParams.get('handle')

    if (!handle) {
      return NextResponse.json({ error: 'Missing handle parameter' }, { status: 400 })
    }

    const supabase = createAnonClient()
    const { data: artist, error } = await supabase
      .from('artists_min')
      .select('*')
      .eq('handle', handle)
      .maybeSingle()

    if (error) {
      console.error('Error fetching artist:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!artist) {
      return NextResponse.json({ error: 'Artist not found' }, { status: 404 })
    }

    return NextResponse.json(artist, {
      headers: { 
        'x-next-cache-tags': `artist:${handle}`,
        'Cache-Control': 'public, s-maxage=31536000, stale-while-revalidate=86400'
      },
    })
  } catch (error) {
    console.error('Unexpected error in artist API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
