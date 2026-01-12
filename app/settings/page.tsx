'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@/hooks/use-user'
import { useDashboardSnapshot } from '@/hooks/use-dashboard-snapshot'
import { useBillingPrices } from '@/hooks/use-billing-prices'
import { createClient } from '@/lib/supabase/client'
import Toast from '@/components/ui/toast'

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
      setToastMessage(null)

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

      if (invokeError) {
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
                <div>
                  <h3 className="text-sm font-medium text-sunroad-brown-700 mb-2">Current Plan</h3>
                  <p className="text-2xl font-bold text-sunroad-brown-900">{getPlanLabel()}</p>
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
                          {usage.public_active_works ?? 0} / {limits.max_works ?? 0}
                        </span>
                      </div>
                      <div className="w-full bg-sunroad-cream rounded-full h-2">
                        <div
                          className="bg-sunroad-amber-600 h-2 rounded-full transition-all"
                          style={{
                            width: `${limits.max_works > 0 ? Math.min((usage.public_active_works ?? 0) / limits.max_works * 100, 100) : 0}%`,
                          }}
                        />
                      </div>
                    </div>

                    {/* Categories Usage */}
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm text-sunroad-brown-600">Categories</span>
                        <span className="text-sm font-medium text-sunroad-brown-900">
                          {usage.categories_count ?? 0} / {limits.max_categories ?? 0}
                        </span>
                      </div>
                      <div className="w-full bg-sunroad-cream rounded-full h-2">
                        <div
                          className="bg-sunroad-amber-600 h-2 rounded-full transition-all"
                          style={{
                            width: `${limits.max_categories > 0 ? Math.min((usage.categories_count ?? 0) / limits.max_categories * 100, 100) : 0}%`,
                          }}
                        />
                      </div>
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

                {/* Directory Listing */}
                {profile && (
                  <div>
                    <h3 className="text-sm font-medium text-sunroad-brown-700 mb-2">Directory Listing</h3>
                    <div className="flex items-center">
                      {profile.is_listed ? (
                        <>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Listed
                          </span>
                          <span className="ml-2 text-sm text-sunroad-brown-600">
                            Your profile appears in the directory
                          </span>
                        </>
                      ) : (
                        <>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            Not listed
                          </span>
                          <span className="ml-2 text-sm text-sunroad-brown-600">
                            Your profile is hidden from the directory
                          </span>
                        </>
                      )}
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
                                className={`flex-1 px-4 py-3 rounded-lg border-2 transition-colors ${
                                  selectedInterval === 'year'
                                    ? 'border-sunroad-amber-600 bg-sunroad-amber-50'
                                    : 'border-sunroad-amber-200 bg-white hover:border-sunroad-amber-300'
                                } ${upgradeLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                              >
                                <div className="text-sm font-semibold text-sunroad-brown-900">Yearly</div>
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
                            disabled={upgradeLoading}
                            className="w-full px-4 py-3 bg-sunroad-amber-600 text-white rounded-lg hover:bg-sunroad-amber-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                          >
                            {upgradeLoading ? (
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

                  {/* Pro without subscription (Founding/Manual): Show message only, no buttons */}
                  {tier === 'pro' && !subscription && (
                    <div className="text-sm text-sunroad-brown-600">
                      Your plan is managed by Sunroad.
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
    </main>
  )
}

