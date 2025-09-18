import { createClient } from '@supabase/supabase-js'

// Browser-compatible singleton instance to prevent multiple GoTrueClient instances
let anonClient: ReturnType<typeof createClient> | null = null

/**
 * Anonymous Supabase client for static pages
 * This client doesn't use cookies or headers, making it safe for static generation
 * Uses singleton pattern to prevent multiple instances
 */
export function createAnonClient() {
  if (!anonClient) {
    anonClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY!,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false
        }
      }
    )
  }
  return anonClient
}
