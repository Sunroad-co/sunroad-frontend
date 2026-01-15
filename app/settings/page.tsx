'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@/hooks/use-user'
import { useDashboardSnapshot } from '@/hooks/use-dashboard-snapshot'
import { useBillingPrices } from '@/hooks/use-billing-prices'
import { createClient } from '@/lib/supabase/client'
import Toast from '@/components/ui/toast'
import ProfileCompletionGate from '@/components/profile-completion-gate'
import { normalizeMissingKeys } from '@/lib/profile-completion'

export default function SettingsPage() {
  const router = useRouter()
  const { user, loading: userLoading } = useUser()
  const { snapshot, profile, tier, limits, usage, subscription, isLoading, error, refresh } = useDashboardSnapshot()
  const { monthlyPrice, yearlyPrice, loading: pricesLoading } = useBillingPrices()
  
  const [toastVisible, setToastVisible] = useState(false)
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [upgradeLoading, setUpgradeLoading] = useState(false)
  const [manageLoading, setManageLoading] = useState(false)
  const [selectedInterval, setSelectedInterval] = useState<'month' | 'year'>('month')
  const [showCompletionModal, setShowCompletionModal] = useState(false)
  const [missingItems, setMissingItems] = useState<string[]>([])
  const [eligibilityLoading, setEligibilityLoading] = useState(false)

  // Precompute missing items from dashboard snapshot (instant check for most fields)
  // MUST be called before any early returns to follow Rules of Hooks
  const precomputedMissing = useMemo(() => {
    if (!profile || tier === 'pro') {
      return []
    }

    const missing: string[] = []

    // Check avatar_url
    if (!profile.avatar_url || profile.avatar_url.trim() === '') {
      missing.push('avatar_url')
    }

    // Check banner_url
    if (!profile.banner_url || profile.banner_url.trim() === '') {
      missing.push('banner_url')
    }

    // Check bio
    if (!profile.bio || profile.bio.trim() === '') {
      missing.push('bio')
    }

    // Check location_id
    if (!profile.location || !profile.location.location_id) {
      missing.push('location_id')
    }

    // Check categories (at least 1)
    if (!profile.categories || profile.categories.length === 0) {
      missing.push('categories')
    }

    // Note: works check requires RPC call (can't be precomputed from snapshot)
    return missing
  }, [profile, tier])

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!userLoading && !user) {
      router.push('/auth/login')
    }
  }, [user, userLoading, router])

  // Show error toast when error occurs
  useEffect(() => {
    if (error) {
      setToastMessage(error.message || 'Failed to load dashboard snapshot')
      setToastVisible(true)
    }
  }, [error])

  // Calculate profile completion percentage (for ProfileStrength block)
  // MUST be called before any early returns to follow Rules of Hooks
  const profileCompletion = useMemo(() => {
    if (!profile || tier === 'pro') {
      return { percentage: 100, completed: 5, total: 5 }
    }

    let completed = 0
    const total = 5 // avatar, banner, bio, location, categories (works excluded)

    if (profile.avatar_url && profile.avatar_url.trim() !== '') completed++
    if (profile.banner_url && profile.banner_url.trim() !== '') completed++
    if (profile.bio && profile.bio.trim() !== '') completed++
    if (profile.location && profile.location.location_id) completed++
    if (profile.categories && profile.categories.length >= 1) completed++

    return {
      percentage: Math.round((completed / total) * 100),
      completed,
      total,
    }
  }, [profile, tier])

  // Calculate yearly savings percentage
  // MUST be called before any early returns to follow Rules of Hooks
  const yearlySavings = useMemo(() => {
    if (!monthlyPrice || !yearlyPrice || !monthlyPrice.unit_amount || !yearlyPrice.unit_amount) {
      return null
    }

    const monthlyAnnual = monthlyPrice.unit_amount * 12
    const yearlyAmount = yearlyPrice.unit_amount
    const savings = monthlyAnnual - yearlyAmount
    const savingsPercent = Math.round((savings / monthlyAnnual) * 100)

    return savingsPercent > 0 ? savingsPercent : null
  }, [monthlyPrice, yearlyPrice])

  // Show loading while fetching user
  if (userLoading) {
    return (
      <div className="min-h-screen bg-sunroad-cream flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sunroad-amber-600 mx-auto"></div>
          <p className="mt-4 text-sunroad-brown-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null // Will redirect to login
  }

  // Determine current plan label
  const getPlanLabel = () => {
    if (tier === 'pro') {
      return 'Pro'
    }
    return 'Free'
  }

  // Format date helper
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'N/A'
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    } catch {
      return dateString
    }
  }

  // Format price helper
  const formatPrice = (amount: number | null | undefined, currency: string | null | undefined = 'usd') => {
    if (amount === null || amount === undefined) {
      return 'N/A'
    }
    const currencyCode = (currency || 'usd').toUpperCase()
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode,
    }).format(amount / 100)
  }

  // Check full eligibility including works via RPC
  const checkFullEligibility = async (): Promise<{ eligible: boolean; missing: string[] }> => {
    if (!user) {
      return { eligible: false, missing: [] }
    }

    try {
      const supabase = createClient()
      const { data, error } = await supabase.rpc('get_profile_upgrade_eligibility')

      if (error) {
        console.error('Error checking eligibility:', error)
        // On error, assume not eligible and use precomputed missing
        return { eligible: false, missing: precomputedMissing }
      }

      return {
        eligible: data?.eligible ?? false,
        missing: normalizeMissingKeys(data?.missing || []),
      }
    } catch (err) {
      console.error('Unexpected error checking eligibility:', err)
      // On error, assume not eligible and use precomputed missing
      return { eligible: false, missing: precomputedMissing }
    }
  }

  // Handle upgrade to Pro
  const handleUpgrade = async () => {
    const selectedPrice = selectedInterval === 'month' ? monthlyPrice : yearlyPrice
    if (!selectedPrice) {
      setToastMessage('No price available for selected interval')
      setToastVisible(true)
      return
    }

    try {
      setUpgradeLoading(true)
      setEligibilityLoading(true)
      setToastMessage(null)

      // First check eligibility (includes works check via RPC)
      const eligibility = await checkFullEligibility()

      if (!eligibility.eligible) {
        setMissingItems(normalizeMissingKeys(eligibility.missing))
        setShowCompletionModal(true)
        setUpgradeLoading(false)
        setEligibilityLoading(false)
        return
      }

      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        throw new Error('Not authenticated')
      }

      const { data, error: invokeError } = await supabase.functions.invoke('stripe-checkout', {
        body: { price_id: selectedPrice.stripe_price_id },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      })

      // Handle 400 response with PROFILE_INCOMPLETE code
      if (invokeError) {
        // Supabase Edge Functions return error details in invokeError.context or message
        // The response body from a 400 status with JSON is typically in error.context or error.message
        let errorData: any = null
        
        // Check context first (Supabase JS client may put response body here)
        if (invokeError.context) {
          try {
            errorData = typeof invokeError.context === 'string' 
              ? JSON.parse(invokeError.context) 
              : invokeError.context
          } catch {
            // Not JSON, continue to try message
          }
        }
        
        // If no data from context, try parsing message as JSON
        if (!errorData && invokeError.message) {
          try {
            errorData = JSON.parse(invokeError.message)
          } catch {
            // Not JSON, will treat as regular error message below
          }
        }

        // Check if this is a PROFILE_INCOMPLETE error (from Edge Function 400 response)
        if (errorData?.code === 'PROFILE_INCOMPLETE' && Array.isArray(errorData.missing)) {
          setMissingItems(normalizeMissingKeys(errorData.missing))
          setShowCompletionModal(true)
          setUpgradeLoading(false)
          setEligibilityLoading(false)
          return
        }

        // For other errors, show the error message
        throw new Error(invokeError.message || 'Failed to create checkout session')
      }

      if (!data?.url) {
        throw new Error('No checkout URL returned')
      }

      // Redirect to Stripe checkout
      window.location.href = data.url
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start upgrade process'
      setToastMessage(errorMessage)
      setToastVisible(true)
      setUpgradeLoading(false)
      setEligibilityLoading(false)
    }
  }

  // Handle manage subscription
  const handleManageSubscription = async () => {
    try {
      setManageLoading(true)
      setToastMessage(null)

      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        throw new Error('Not authenticated')
      }

      const { data, error: invokeError } = await supabase.functions.invoke('stripe-portal', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      })

      if (invokeError) {
        throw new Error(invokeError.message || 'Failed to create portal session')
      }

      if (!data?.url) {
        throw new Error('No portal URL returned')
      }

      // Redirect to Stripe customer portal
      window.location.href = data.url
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to open billing portal'
      setToastMessage(errorMessage)
      setToastVisible(true)
      setManageLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-sunroad-cream">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-sunroad-brown-900 mb-8">Settings</h1>
        
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sunroad-amber-600 mx-auto"></div>
            <p className="mt-4 text-sunroad-brown-600">Loading dashboard snapshot...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-red-900 mb-2">Error Loading Data</h2>
            <p className="text-red-700 mb-4">{error.message || 'Failed to load dashboard snapshot'}</p>
            <button
              onClick={() => refresh()}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Plan & Billing Card */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-sunroad-brown-900 mb-6">Plan & Billing</h2>
              
              <div className="space-y-6">
                {/* Current Plan */}
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-sunroad-brown-700 mb-2">Current Plan</h3>
                    <p className="text-xs text-sunroad-brown-600">
                      {tier === 'pro' 
                        ? 'Discoverable in search/browse • Contact button • Higher limits'
                        : 'Shareable link • Basic limits'}
                    </p>
                  </div>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${
                    tier === 'pro'
                      ? 'bg-sunroad-amber-100 text-sunroad-amber-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {getPlanLabel()}
                  </span>
                </div>

                {/* Usage Section */}
                {(usage && limits) && (
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium text-sunroad-brown-700 mb-3">Usage</h3>
                    
                    {/* Works Usage */}
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm text-sunroad-brown-600">Works</span>
                        <span className="text-sm font-medium text-sunroad-brown-900">
                          {limits.max_works && limits.max_works > 0
                            ? `${usage.public_active_works ?? 0} / ${limits.max_works}`
                            : '—'}
                        </span>
                      </div>
                      {limits.max_works && limits.max_works > 0 && (
                        <div className="w-full bg-sunroad-cream rounded-full h-2">
                          <div
                            className="bg-sunroad-amber-600 h-2 rounded-full transition-all"
                            style={{
                              width: `${Math.min((usage.public_active_works ?? 0) / limits.max_works * 100, 100)}%`,
                            }}
                          />
                        </div>
                      )}
                    </div>

                    {/* Categories Usage */}
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm text-sunroad-brown-600">Categories</span>
                        <span className="text-sm font-medium text-sunroad-brown-900">
                          {limits.max_categories && limits.max_categories > 0
                            ? `${usage.categories_count ?? 0} / ${limits.max_categories}`
                            : '—'}
                        </span>
                      </div>
                      {limits.max_categories && limits.max_categories > 0 && (
                        <div className="w-full bg-sunroad-cream rounded-full h-2">
                          <div
                            className="bg-sunroad-amber-600 h-2 rounded-full transition-all"
                            style={{
                              width: `${Math.min((usage.categories_count ?? 0) / limits.max_categories * 100, 100)}%`,
                            }}
                          />
                        </div>
                      )}
                    </div>

                    {/* Archived Warning */}
                    {usage.archived_tier_limit && usage.archived_tier_limit > 0 && limits && (
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                        <div className="flex items-start">
                          <svg className="w-5 h-5 text-amber-600 mt-0.5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                          <div className="flex-1">
                            <h4 className="text-sm font-semibold text-amber-900 mb-1">
                              {usage.archived_tier_limit} work{usage.archived_tier_limit !== 1 ? 's' : ''} archived due to tier limits
                            </h4>
                            {tier === 'pro' ? (
                              <p className="text-sm text-amber-800">
                                You've reached your current limit. Archive or remove older works to restore these.
                              </p>
                            ) : (
                              <>
                                <p className="text-sm text-amber-800 mb-3">
                                  Upgrade to Pro to restore these works and unlock up to {limits.max_works ?? 12} works and {limits.max_categories ?? 5} categories.
                                </p>
                                <button
                                  className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors text-sm font-medium"
                                  onClick={() => {
                                    // Scroll to billing actions section
                                    const billingSection = document.querySelector('[data-billing-actions]')
                                    if (billingSection) {
                                      billingSection.scrollIntoView({ behavior: 'smooth', block: 'start' })
                                      // Small delay to ensure scroll completes before focusing
                                      setTimeout(() => {
                                        const firstPriceButton = billingSection.querySelector('button')
                                        firstPriceButton?.focus()
                                      }, 500)
                                    }
                                  }}
                                >
                                  Upgrade to Pro
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Discoverability */}
                {profile && (
                  <div className="space-y-3">
                    <div>
                      <h3 className="text-sm font-medium text-sunroad-brown-700 mb-2">Discoverability</h3>
                      <div className="flex items-start gap-2">
                        {profile.is_listed ? (
                          <>
                            <svg className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            <p className="text-sm text-sunroad-brown-600 flex-1">
                              Visible on Sunroad — your profile can appear in search and browse.
                            </p>
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4 text-gray-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                            </svg>
                            <p className="text-sm text-sunroad-brown-600 flex-1">
                              Not visible on Sunroad yet, your profile  won't appear in search/browse. You can still share your public link.
                            </p>
                          </>
                        )}
                      </div>
                    </div>
                    
                    {/* Share profile link */}
                    <div className="flex items-center justify-between gap-3 pt-2 border-t border-sunroad-amber-100">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <svg className="w-4 h-4 text-sunroad-brown-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                        </svg>
                        <span className="text-xs text-sunroad-brown-600 truncate">
                          /artists/{profile.handle}
                        </span>
                      </div>
                      <button
                        onClick={async () => {
                          if (typeof window === 'undefined') return
                          const url = `${window.location.origin}/artists/${profile.handle}`
                          try {
                            await navigator.clipboard.writeText(url)
                            setToastMessage('Profile link copied to clipboard')
                            setToastVisible(true)
                          } catch (err) {
                            setToastMessage('Failed to copy link')
                            setToastVisible(true)
                          }
                        }}
                        className="px-2 py-1 text-xs font-medium text-sunroad-amber-700 bg-sunroad-amber-50 border border-sunroad-amber-200 rounded hover:bg-sunroad-amber-100 transition-colors flex-shrink-0"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                )}

                {/* Subscription Summary */}
                {subscription && (
                  <div className="border-t border-sunroad-amber-100 pt-6">
                    <h3 className="text-sm font-medium text-sunroad-brown-700 mb-4">Subscription</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-sunroad-brown-600">Status</span>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          subscription.status === 'active' 
                            ? 'bg-green-100 text-green-800'
                            : subscription.status === 'canceled' || subscription.status === 'past_due'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {subscription.status ? subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1) : 'Unknown'}
                        </span>
                      </div>
                      {subscription.period_end && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-sunroad-brown-600">Period End</span>
                          <span className="text-sm font-medium text-sunroad-brown-900">
                            {formatDate(subscription.period_end)}
                          </span>
                        </div>
                      )}
                      {subscription.will_cancel && (
                        <div className="flex items-center">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                            Will Cancel
                          </span>
                          <span className="ml-2 text-sm text-sunroad-brown-600">
                            Subscription will cancel at period end
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Profile Strength (only for free tier) */}
                {tier === 'free' && profile && (
                  <div className="border-t border-sunroad-amber-100 pt-6 mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-medium text-sunroad-brown-700">Profile Strength</h3>
                      <span className="text-sm font-semibold text-sunroad-brown-900">
                        {profileCompletion.percentage}%
                      </span>
                    </div>
                    <div className="w-full bg-sunroad-cream rounded-full h-2 mb-3">
                      <div
                        className="bg-sunroad-amber-600 h-2 rounded-full transition-all"
                        style={{ width: `${profileCompletion.percentage}%` }}
                      />
                    </div>
                    {(profileCompletion.percentage < 100 && precomputedMissing.length > 0) && (
                      <button
                        onClick={() => {
                          const normalized = normalizeMissingKeys(precomputedMissing)
                          setMissingItems(normalized)
                          setShowCompletionModal(true)
                        }}
                        className="text-xs text-sunroad-amber-700 hover:text-sunroad-amber-800 hover:underline"
                      >
                        See what's missing
                      </button>
                    )}
                  </div>
                )}

                {/* Billing Actions */}
                <div className="border-t border-sunroad-amber-100 pt-6" data-billing-actions>
                  <h3 className="text-sm font-medium text-sunroad-brown-700 mb-4">Billing Actions</h3>
                  
                  {/* Free tier: Show upgrade UI */}
                  {tier === 'free' && (
                    <div className="space-y-4">
                      {pricesLoading ? (
                        <div className="text-sm text-sunroad-brown-600">Loading pricing...</div>
                      ) : monthlyPrice || yearlyPrice ? (
                        <>
                          {/* Price Selection */}
                          <div className="flex gap-3">
                            {monthlyPrice && (
                              <button
                                onClick={() => setSelectedInterval('month')}
                                disabled={upgradeLoading}
                                className={`flex-1 px-4 py-3 rounded-lg border-2 transition-colors ${
                                  selectedInterval === 'month'
                                    ? 'border-sunroad-amber-600 bg-sunroad-amber-50'
                                    : 'border-sunroad-amber-200 bg-white hover:border-sunroad-amber-300'
                                } ${upgradeLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                              >
                                <div className="text-sm font-semibold text-sunroad-brown-900">Monthly</div>
                                <div className="text-lg font-bold text-sunroad-brown-900 mt-1">
                                  {formatPrice(monthlyPrice.unit_amount, monthlyPrice.currency)}
                                </div>
                                <div className="text-xs text-sunroad-brown-600 mt-1">per month</div>
                              </button>
                            )}
                            {yearlyPrice && (
                              <button
                                onClick={() => setSelectedInterval('year')}
                                disabled={upgradeLoading}
                                className={`flex-1 px-4 py-3 rounded-lg border-2 transition-colors relative ${
                                  selectedInterval === 'year'
                                    ? 'border-sunroad-amber-600 bg-sunroad-amber-50'
                                    : 'border-sunroad-amber-200 bg-white hover:border-sunroad-amber-300'
                                } ${upgradeLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                              >
                                {yearlySavings && yearlySavings > 0 && (
                                  <span className="absolute -top-2 -right-2 bg-green-600 text-white text-xs font-semibold px-2 py-0.5 rounded-full">
                                    Save {yearlySavings}%
                                  </span>
                                )}
                                <div className="flex items-center justify-center gap-1.5">
                                  <div className="text-sm font-semibold text-sunroad-brown-900">Yearly</div>
                                  {selectedInterval === 'year' && yearlySavings && yearlySavings > 0 && (
                                    <span className="text-xs font-medium text-sunroad-amber-700 bg-sunroad-amber-100 px-1.5 py-0.5 rounded">
                                      Best value
                                    </span>
                                  )}
                                </div>
                                <div className="text-lg font-bold text-sunroad-brown-900 mt-1">
                                  {formatPrice(yearlyPrice.unit_amount, yearlyPrice.currency)}
                                </div>
                                <div className="text-xs text-sunroad-brown-600 mt-1">per year</div>
                              </button>
                            )}
                          </div>

                          {/* Upgrade Button */}
                          <button
                            onClick={handleUpgrade}
                            disabled={upgradeLoading || eligibilityLoading}
                            className="w-full px-4 py-3 bg-sunroad-amber-600 text-white rounded-lg hover:bg-sunroad-amber-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                          >
                            {upgradeLoading || eligibilityLoading ? (
                              <>
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Processing...
                              </>
                            ) : (
                              'Upgrade to Pro'
                            )}
                          </button>

                          {/* Pro includes and cancel info */}
                          <div className="mt-4 space-y-2">
                            <div className="text-xs text-sunroad-brown-600">
                              <p className="font-medium mb-1">Pro includes:</p>
                              <ul className="list-disc list-inside space-y-0.5 ml-2">
                                <li>Discoverable in search/browse</li>
                                <li>More works & categories</li>
                                <li>Contact button on profile</li>
                              </ul>
                            </div>
                            <p className="text-xs text-sunroad-brown-500">Cancel anytime</p>
                          </div>
                        </>
                      ) : (
                        <div className="text-sm text-sunroad-brown-600">No pricing available at this time.</div>
                      )}
                    </div>
                  )}

                  {/* Pro with subscription: Show Manage Subscription button */}
                  {tier === 'pro' && subscription && (
                    <button
                      onClick={handleManageSubscription}
                      disabled={manageLoading}
                      className="w-full px-4 py-3 bg-sunroad-amber-600 text-white rounded-lg hover:bg-sunroad-amber-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                      {manageLoading ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Opening...
                        </>
                      ) : (
                        'Manage Subscription'
                      )}
                    </button>
                  )}

                  {/* Pro without subscription (Founding/Manual): Complimentary Pro card */}
                  {tier === 'pro' && !subscription && (
                    <div className="bg-sunroad-amber-50 border border-sunroad-amber-200 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <svg className="w-5 h-5 text-sunroad-amber-700 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-sunroad-brown-900 mb-1">
                            Thanks for being an early supporter ❤️ Your Pro plan is on us. ☀️
                          </p>
                          <p className="text-xs text-sunroad-brown-600">
                            No billing details needed.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Toast for errors */}
      <Toast
        message={toastMessage || ''}
        isVisible={toastVisible}
        onClose={() => {
          setToastVisible(false)
          setToastMessage(null)
        }}
      />

      {/* Profile completion modal */}
      {showCompletionModal && (
        <ProfileCompletionGate
          missing={missingItems.length > 0 ? missingItems : precomputedMissing}
          variant="modal"
          onClose={() => {
            setShowCompletionModal(false)
            setMissingItems([])
          }}
        />
      )}
    </main>
  )
}

