import { NextResponse } from 'next/server'
import { createSupabaseAdmin } from '@/lib/supabase-admin'

/**
 * Decode legacy Base64 password to plaintext
 * Legacy system stored passwords as Base64-encoded strings
 */
function decodeLegacyPassword(encoded: string): string {
  try {
    return Buffer.from(encoded, 'base64').toString('utf-8')
  } catch {
    throw new Error('Invalid Base64 password format')
  }
}

/**
 * Migrate a single user from legacy system to Supabase Auth
 * POST /api/migrate-user
 * Body: { email: string, encodedPassword: string }
 */
export async function POST(req: Request) {
  try {
    const { email, encodedPassword } = await req.json()

    // Validate input
    if (!email || !encodedPassword) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing email or encodedPassword' 
        }, 
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid email format' 
        }, 
        { status: 400 }
      )
    }

    // Decode the legacy Base64 password
    const plainPassword = decodeLegacyPassword(encodedPassword)

    // Create user in Supabase Auth using Admin API
    const supabaseAdmin = createSupabaseAdmin()
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: plainPassword,
      email_confirm: true // Mark as confirmed since they already existed in legacy system
    })

    if (error) {
      console.error('Supabase user creation error:', error)
      return NextResponse.json(
        { 
          success: false, 
          error: error.message,
          details: error
        }, 
        { status: 400 }
      )
    }

    // Success response
    return NextResponse.json({
      success: true,
      user: {
        id: data.user?.id,
        email: data.user?.email,
        created_at: data.user?.created_at
      },
      message: 'User migrated successfully'
    })

  } catch (err: unknown) {
    console.error('Migration error:', err)
    const errorMessage = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json(
      { 
        success: false, 
        error: errorMessage
      }, 
      { status: 500 }
    )
  }
}

/**
 * Get migration status (optional - for checking if user already exists)
 * GET /api/migrate-user?email=user@example.com
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const email = searchParams.get('email')

    if (!email) {
      return NextResponse.json(
        { error: 'Email parameter required' }, 
        { status: 400 }
      )
    }

    // Check if user already exists in Supabase Auth
    const supabaseAdmin = createSupabaseAdmin()
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 1
    })

    if (error) {
      return NextResponse.json(
        { error: 'Failed to check user status' }, 
        { status: 500 }
      )
    }

    const userExists = data.users.some(user => user.email === email)

    return NextResponse.json({
      email,
      exists: userExists,
      message: userExists ? 'User already exists in Supabase' : 'User not found in Supabase'
    })

  } catch (err: unknown) {
    console.error('Status check error:', err)
    const errorMessage = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json(
      { error: errorMessage }, 
      { status: 500 }
    )
  }
}
