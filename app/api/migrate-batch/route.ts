/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server'
import { createSupabaseAdmin } from '@/lib/supabase-admin'
import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Decode legacy Base64 password to plaintext
 */
function decodeLegacyPassword(encoded: string): string {
  try {
    return Buffer.from(encoded, 'base64').toString('utf-8')
  } catch {
    throw new Error('Invalid Base64 password format')
  }
}

interface LegacyUser {
  user_id: string
  user_email: string
  user_password: string
}

interface MigrationResult {
  user_id: string
  email: string
  status: 'pending' | 'migrated' | 'failed' | 'skipped'
  auth_user_id?: string
  error?: string
  legacy_user_id?: string
}

/**
 * Batch migrate users from legacy system to Supabase Auth
 * POST /api/migrate-batch
 * Body: { 
 *   batchSize?: number, 
 *   retryFailed?: boolean,
 *   dryRun?: boolean 
 * }
 */
export async function POST(req: Request) {
  try {
    const { batchSize = 10, retryFailed = false, dryRun = false } = await req.json()
    
    const supabaseAdmin = createSupabaseAdmin() as SupabaseClient
    const results: MigrationResult[] = []
    
    console.log(`🚀 Starting batch migration (batchSize: ${batchSize}, retryFailed: ${retryFailed}, dryRun: ${dryRun})`)

    // 1. Fetch all legacy users
    const { data: legacyUsers, error: fetchError } = await (supabaseAdmin as any)
      .from('legacy_user_raw')
      .select('user_id, user_email, user_password')

    if (fetchError) {
      console.error('Error fetching legacy users:', fetchError)
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to fetch legacy users',
          details: fetchError.message 
        }, 
        { status: 500 }
      )
    }

    if (!legacyUsers || legacyUsers.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No legacy users found',
        results: [],
        stats: { total: 0, migrated: 0, failed: 0, skipped: 0 }
      })
    }

    console.log(`📊 Found ${legacyUsers.length} legacy users`)

    // 2. Check existing migrations if not retrying failed
    let existingMigrations: { [key: string]: string } = {}
    if (!retryFailed) {
      const { data: existingUsers } = await (supabaseAdmin as any)
        .from('artists_min')
        .select('legacy_user_id, auth_user_id')
        .not('auth_user_id', 'is', null)

      existingMigrations = existingUsers?.reduce((acc: { [key: string]: string }, user: any) => {
        if (user.legacy_user_id) {
          acc[user.legacy_user_id] = user.auth_user_id
        }
        return acc
      }, {} as { [key: string]: string }) || {}
    }

    // 3. Process users in batches
    const batches = []
    for (let i = 0; i < legacyUsers.length; i += batchSize) {
      batches.push(legacyUsers.slice(i, i + batchSize))
    }

    for (const batch of batches) {
      const batchPromises = batch.map(async (legacyUser: LegacyUser) => {
        const result: MigrationResult = {
          user_id: legacyUser.user_id,
          email: legacyUser.user_email,
          status: 'pending',
          legacy_user_id: legacyUser.user_id
        }

        try {
          // Check if already migrated (unless retrying failed)
          if (!retryFailed && existingMigrations[legacyUser.user_id]) {
            result.status = 'skipped'
            result.auth_user_id = existingMigrations[legacyUser.user_id]
            console.log(`⏭️ Skipped ${legacyUser.user_email} (already migrated)`)
            return result
          }

          // Validate email
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
          if (!emailRegex.test(legacyUser.user_email)) {
            result.status = 'failed'
            result.error = 'Invalid email format'
            console.log(`❌ Invalid email: ${legacyUser.user_email}`)
            return result
          }

          // Decode password
          const plainPassword = decodeLegacyPassword(legacyUser.user_password || '')

          if (dryRun) {
            result.status = 'pending'
            console.log(`🔍 [DRY RUN] Would migrate ${legacyUser.user_email}`)
            return result
          }

          // Create user in Supabase Auth
          const { data: authData, error: authError } = await (supabaseAdmin as any).auth.admin.createUser({
            email: legacyUser.user_email,
            password: plainPassword,
            email_confirm: true
          })

          if (authError) {
            result.status = 'failed'
            result.error = authError.message
            console.error(`❌ Auth creation failed for ${legacyUser.user_email}:`, authError.message)
            return result
          }

          const authUserId = authData.user?.id
          if (!authUserId) {
            result.status = 'failed'
            result.error = 'No user ID returned from auth creation'
            console.error(`❌ No auth user ID for ${legacyUser.user_email}`)
            return result
          }

          // Link to artists_min
          const { error: linkError } = await (supabaseAdmin as any)
            .from('artists_min')
            .update({ auth_user_id: authUserId })
            .eq('legacy_user_id', legacyUser.user_id)

          if (linkError) {
            result.status = 'failed'
            result.error = `Auth created but linking failed: ${linkError.message}`
            console.error(`⚠️ Linking failed for ${legacyUser.user_email}:`, linkError.message)
            return result
          }

          result.status = 'migrated'
          result.auth_user_id = authUserId
          console.log(`✅ Migrated ${legacyUser.user_email} → ${authUserId}`)
          return result

        } catch (err: unknown) {
          result.status = 'failed'
          result.error = err instanceof Error ? err.message : 'Unknown error'
          console.error(`💥 Unexpected error for ${legacyUser.user_email}:`, err)
          return result
        }
      })

      // Wait for batch to complete
      const batchResults = await Promise.all(batchPromises)
      results.push(...batchResults)

      // Small delay between batches to avoid rate limiting
      if (batches.indexOf(batch) < batches.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 100))
      }
    }

    // 4. Calculate stats
    const stats = {
      total: results.length,
      migrated: results.filter(r => r.status === 'migrated').length,
      failed: results.filter(r => r.status === 'failed').length,
      skipped: results.filter(r => r.status === 'skipped').length,
      pending: results.filter(r => r.status === 'pending').length
    }

    console.log(`🎉 Migration complete:`, stats)

    return NextResponse.json({
      success: true,
      message: `Batch migration completed`,
      results,
      stats,
      dryRun
    })

  } catch (err: unknown) {
    console.error('Batch migration error:', err)
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
 * Get migration status and statistics
 * GET /api/migrate-batch
 */
export async function GET() {
  try {
    const supabaseAdmin = createSupabaseAdmin() as SupabaseClient

    // Get total legacy users
    const { data: legacyUsers, error: legacyError } = await (supabaseAdmin as any)
      .from('legacy_user_raw')
      .select('user_id, user_email')

    if (legacyError) {
      return NextResponse.json(
        { error: 'Failed to fetch legacy users' }, 
        { status: 500 }
      )
    }

    // Get migrated users
    const { data: migratedUsers, error: migratedError } = await (supabaseAdmin as any)
      .from('artists_min')
      .select('legacy_user_id, auth_user_id, display_name')
      .not('auth_user_id', 'is', null)

    if (migratedError) {
      return NextResponse.json(
        { error: 'Failed to fetch migrated users' }, 
        { status: 500 }
      )
    }

    const stats = {
      totalLegacy: legacyUsers?.length || 0,
      totalMigrated: migratedUsers?.length || 0,
      remaining: (legacyUsers?.length || 0) - (migratedUsers?.length || 0)
    }

    return NextResponse.json({
      success: true,
      stats,
      legacyUsers: legacyUsers || [],
      migratedUsers: migratedUsers || []
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
