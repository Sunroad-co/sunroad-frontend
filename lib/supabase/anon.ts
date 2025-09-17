import { createClient } from '@supabase/supabase-js'

/**
 * Anonymous Supabase client for static pages
 * This client doesn't use cookies or headers, making it safe for static generation
 */
export function createAnonClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY!
  )
}
