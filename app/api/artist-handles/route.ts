import { NextResponse } from 'next/server'
import { createAnonClient } from '@/lib/supabase/anon'

export async function GET() {
  try {
    const supabase = createAnonClient()
    const { data: handles, error } = await supabase
      .from('artists_min')
      .select('handle')
      .not('handle', 'is', null)

    if (error) {
      console.error('Error fetching artist handles:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(handles || [], {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400'
      },
    })
  } catch (error) {
    console.error('Unexpected error in artist-handles API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
