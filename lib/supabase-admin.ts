import { createClient } from '@supabase/supabase-js'

/**
 * Supabase Admin Client
 * Uses the secret key for server-side operations that require admin privileges
 * NEVER expose this client to the browser - only use in API routes and server functions
 */
export function createSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseSecretKey = process.env.NEXT_PUBLIC_SUPABASE_SECRET_KEY

  if (!supabaseUrl || !supabaseSecretKey) {
    throw new Error('Missing Supabase environment variables. Please check SUPABASE_URL and SUPABASE_SECRET_KEY.')
  }

  return createClient(supabaseUrl, supabaseSecretKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}
