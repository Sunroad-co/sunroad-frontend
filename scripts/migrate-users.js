/**
 * Manual User Migration Script
 * 
 * This script can be run directly to migrate users from legacy system to Supabase Auth
 * 
 * Usage:
 * 1. Set environment variables:
 *    - NEXT_PUBLIC_SUPABASE_URL
 *    - SUPABASE_SECRET_KEY
 * 
 * 2. Run the script:
 *    node scripts/migrate-users.js
 * 
 * 3. Options:
 *    - DRY_RUN=true node scripts/migrate-users.js (test run)
 *    - BATCH_SIZE=5 node scripts/migrate-users.js (smaller batches)
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

// Configuration
const BATCH_SIZE = parseInt(process.env.BATCH_SIZE) || 10
const DRY_RUN = process.env.DRY_RUN === 'true'

// Initialize Supabase Admin client
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

function decodeLegacyPassword(encoded) {
  try {
    return Buffer.from(encoded, 'base64').toString('utf-8')
  } catch {
    throw new Error('Invalid Base64 password format')
  }
}

async function migrateAllUsers() {
  console.log(`🚀 Starting migration (Batch Size: ${BATCH_SIZE}, Dry Run: ${DRY_RUN})`)
  
  try {
    // 1. Fetch all legacy users
    const { data: legacyUsers, error: fetchError } = await supabaseAdmin
      .from('legacy_user_raw')
      .select('user_id, user_email, user_password')

    if (fetchError) {
      throw new Error(`Failed to fetch legacy users: ${fetchError.message}`)
    }

    if (!legacyUsers || legacyUsers.length === 0) {
      console.log('📭 No legacy users found')
      return
    }

    console.log(`📊 Found ${legacyUsers.length} legacy users`)

    // 2. Check existing migrations
    const { data: existingUsers } = await supabaseAdmin
      .from('artists_min')
      .select('legacy_user_id, auth_user_id')
      .not('auth_user_id', 'is', null)

    const existingMigrations = existingUsers?.reduce((acc, user) => {
      if (user.legacy_user_id) {
        acc[user.legacy_user_id] = user.auth_user_id
      }
      return acc
    }, {}) || {}

    console.log(`✅ Found ${Object.keys(existingMigrations).length} already migrated users`)

    // 3. Filter users to migrate
    const usersToMigrate = legacyUsers.filter(user => !existingMigrations[user.user_id])
    console.log(`🎯 ${usersToMigrate.length} users need migration`)

    if (usersToMigrate.length === 0) {
      console.log('🎉 All users already migrated!')
      return
    }

    // 4. Process in batches
    const batches = []
    for (let i = 0; i < usersToMigrate.length; i += BATCH_SIZE) {
      batches.push(usersToMigrate.slice(i, i + BATCH_SIZE))
    }

    let migrated = 0
    let failed = 0
    let skipped = 0

    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const batch = batches[batchIndex]
      console.log(`\n📦 Processing batch ${batchIndex + 1}/${batches.length} (${batch.length} users)`)

      const batchPromises = batch.map(async (legacyUser) => {
        try {
          // Validate email
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
          if (!emailRegex.test(legacyUser.user_email)) {
            console.log(`❌ Invalid email: ${legacyUser.user_email}`)
            failed++
            return
          }

          // Decode password
          const plainPassword = decodeLegacyPassword(legacyUser.user_password || '')

          if (DRY_RUN) {
            console.log(`🔍 [DRY RUN] Would migrate ${legacyUser.user_email}`)
            skipped++
            return
          }

          // Create user in Supabase Auth
          const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email: legacyUser.user_email,
            password: plainPassword,
            email_confirm: true
          })

          if (authError) {
            console.error(`❌ Auth creation failed for ${legacyUser.user_email}:`, authError.message)
            failed++
            return
          }

          const authUserId = authData.user?.id
          if (!authUserId) {
            console.error(`❌ No auth user ID for ${legacyUser.user_email}`)
            failed++
            return
          }

          // Link to artists_min
          const { error: linkError } = await supabaseAdmin
            .from('artists_min')
            .update({ auth_user_id: authUserId })
            .eq('legacy_user_id', legacyUser.user_id)

          if (linkError) {
            console.error(`⚠️ Linking failed for ${legacyUser.user_email}:`, linkError.message)
            failed++
            return
          }

          console.log(`✅ Migrated ${legacyUser.user_email} → ${authUserId}`)
          migrated++

        } catch (err) {
          console.error(`💥 Unexpected error for ${legacyUser.user_email}:`, err.message)
          failed++
        }
      })

      // Wait for batch to complete
      await Promise.all(batchPromises)

      // Small delay between batches
      if (batchIndex < batches.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 100))
      }
    }

    // 5. Final stats
    console.log(`\n🎉 Migration complete!`)
    console.log(`✅ Migrated: ${migrated}`)
    console.log(`❌ Failed: ${failed}`)
    console.log(`⏭️ Skipped: ${skipped}`)
    console.log(`📊 Total processed: ${migrated + failed + skipped}`)

  } catch (error) {
    console.error('💥 Migration failed:', error.message)
    process.exit(1)
  }
}

// Run migration
migrateAllUsers()
  .then(() => {
    console.log('🏁 Script completed successfully')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Script failed:', error)
    process.exit(1)
  })
