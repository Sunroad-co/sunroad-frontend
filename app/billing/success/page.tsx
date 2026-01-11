'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@/hooks/use-user'
import { useDashboardSnapshot } from '@/hooks/use-dashboard-snapshot'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

// Backoff schedule: [0, 1000, 1500, 2000, 3000, 5000, 8000, 12000] (cap total duration ~60s)
const BACKOFF_SCHEDULE = [0, 1000, 1500, 2000, 3000, 5000, 8000, 12000]
const MAX_TOTAL_DURATION_MS = 60000 // 60 seconds
const REDIRECT_DELAY_MS = 3000 // 3 seconds
const REDIRECT_TARGET = '/dashboard/profile'

export default function BillingSuccessPage() {
  const router = useRouter()
  const { user, loading: userLoading } = useUser()
  const { tier, refresh, isLoading } = useDashboardSnapshot()
  
  const [pollingState, setPollingState] = useState<'idle' | 'polling' | 'success' | 'timeout'>('idle')
  const [redirectCountdown, setRedirectCountdown] = useState<number | null>(null)
  const [portalLoading, setPortalLoading] = useState(false)
  
  // Timer refs for cleanup
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const redirectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const mountedRef = useRef(true)
  const startTimeRef = useRef<number>(0)
  const attemptIndexRef = useRef<number>(0)

  // Cleanup all timers on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      if (redirectTimeoutRef.current) {
        clearTimeout(redirectTimeoutRef.current)
      }
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current)
      }
    }
  }, [])

  // Start redirect countdown when success is detected
  const startRedirectCountdown = useCallback(() => {
    let countdown = Math.floor(REDIRECT_DELAY_MS / 1000)
    setRedirectCountdown(countdown)

    // Update countdown every second
    countdownIntervalRef.current = setInterval(() => {
      if (!mountedRef.current) return
      
      countdown -= 1
      if (countdown > 0) {
        setRedirectCountdown(countdown)
      } else {
        if (countdownIntervalRef.current) {
          clearInterval(countdownIntervalRef.current)
        }
        setRedirectCountdown(null)
        // Redirect
        router.push(REDIRECT_TARGET)
      }
    }, 1000)

    // Fallback redirect timeout
    redirectTimeoutRef.current = setTimeout(() => {
      if (mountedRef.current) {
        if (countdownIntervalRef.current) {
          clearInterval(countdownIntervalRef.current)
        }
        setRedirectCountdown(null)
        router.push(REDIRECT_TARGET)
      }
    }, REDIRECT_DELAY_MS)
  }, [router])

  // Single polling function with backoff schedule
  const poll = useCallback(() => {
    if (!mountedRef.current) return

    // Check if tier is already pro (success condition) - check before scheduling next poll
    if (tier === 'pro') {
      if (mountedRef.current) {
        setPollingState('success')
        startRedirectCountdown()
      }
      return
    }

    // Check if we've exceeded max duration
    const elapsed = Date.now() - startTimeRef.current
    if (elapsed >= MAX_TOTAL_DURATION_MS) {
      if (mountedRef.current) {
        setPollingState('timeout')
      }
      return
    }

    // Get next backoff delay
    const nextDelay = BACKOFF_SCHEDULE[attemptIndexRef.current] ?? BACKOFF_SCHEDULE[BACKOFF_SCHEDULE.length - 1]
    
    // Schedule next poll
    timeoutRef.current = setTimeout(() => {
      if (!mountedRef.current) return
      
      attemptIndexRef.current += 1
      
      // Call refresh only here (single source of truth)
      refresh()
      
      // Schedule next poll check (recursive)
      poll()
    }, nextDelay)
  }, [tier, refresh, startRedirectCountdown])

  // Start polling function
  const startPolling = useCallback(() => {
    // Clear any existing timers
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    if (redirectTimeoutRef.current) {
      clearTimeout(redirectTimeoutRef.current)
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current)
    }

    // Reset state
    setPollingState('polling')
    setRedirectCountdown(null)
    attemptIndexRef.current = 0
    startTimeRef.current = Date.now()

    // Initial refresh
    refresh()

    // Start polling with first backoff (0ms = immediate)
    poll()
  }, [poll, refresh])


  // Start polling when component mounts and user is loaded
  useEffect(() => {
    if (userLoading || !user) return

    // If tier is already pro, show success immediately
    if (tier === 'pro') {
      setPollingState('success')
      startRedirectCountdown()
      return
    }

    // Otherwise start polling
    startPolling()
  }, [user, userLoading, tier, startPolling, startRedirectCountdown])

  // Monitor tier changes during polling
  useEffect(() => {
    if (tier === 'pro' && pollingState === 'polling') {
      // Stop polling immediately
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
      
      setPollingState('success')
      startRedirectCountdown()
    }
  }, [tier, pollingState, startRedirectCountdown])

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!userLoading && !user) {
      router.push('/auth/login')
    }
  }, [user, userLoading, router])

  // Handle retry (restarts polling)
  const handleRetry = () => {
    startPolling()
  }

  // Handle billing portal
  const handleOpenBillingPortal = async () => {
    try {
      setPortalLoading(true)

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
      console.error('Failed to open billing portal:', err)
      setPortalLoading(false)
      // Could show a toast here, but keeping it simple
    }
  }

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

  // Success state: tier is pro
  if (pollingState === 'success') {
    return (
      <div className="min-h-screen bg-sunroad-cream flex items-center justify-center">
        <div className="max-w-md w-full mx-4">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="mb-6">
              <svg className="w-16 h-16 text-green-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-sunroad-brown-900 mb-4">You're upgraded to Pro!</h1>
            <p className="text-sunroad-brown-600 mb-6">
              Your subscription is now active. You can start using all Pro features.
            </p>
            {redirectCountdown !== null && (
              <p className="text-sm text-sunroad-brown-500 mb-4">
                Redirecting in {redirectCountdown}...
              </p>
            )}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href={REDIRECT_TARGET}
                className="px-4 py-2 bg-sunroad-amber-600 text-white rounded-lg hover:bg-sunroad-amber-700 transition-colors font-medium"
              >
                Go to Dashboard
              </Link>
              <Link
                href="/settings"
                className="px-4 py-2 bg-sunroad-amber-100 text-sunroad-amber-700 rounded-lg hover:bg-sunroad-amber-200 transition-colors font-medium"
              >
                Go to Settings
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Timeout state
  if (pollingState === 'timeout') {
    return (
      <div className="min-h-screen bg-sunroad-cream flex items-center justify-center">
        <div className="max-w-md w-full mx-4">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="mb-6">
              <svg className="w-16 h-16 text-amber-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-sunroad-brown-900 mb-4">Processing Your Subscription</h1>
            <p className="text-sunroad-brown-600 mb-6">
              We've received your checkout return. Stripe may take a moment to confirm. Your Pro access will appear shortly.
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={handleRetry}
                disabled={portalLoading}
                className="px-4 py-2 bg-sunroad-amber-600 text-white rounded-lg hover:bg-sunroad-amber-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Check again
              </button>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  href="/settings"
                  className="px-4 py-2 bg-sunroad-amber-100 text-sunroad-amber-700 rounded-lg hover:bg-sunroad-amber-200 transition-colors font-medium text-center"
                >
                  Go to Settings
                </Link>
                <button
                  onClick={handleOpenBillingPortal}
                  disabled={portalLoading}
                  className="px-4 py-2 bg-sunroad-amber-100 text-sunroad-amber-700 rounded-lg hover:bg-sunroad-amber-200 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {portalLoading ? 'Opening...' : 'Open Billing Portal'}
                </button>
              </div>
              <a
                href="mailto:support@sunroad.io?subject=Billing%20Question"
                className="text-sm text-sunroad-brown-500 hover:text-sunroad-brown-700 underline"
              >
                Contact support
              </a>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Polling state: showing "Updating your plan..."
  return (
    <div className="min-h-screen bg-sunroad-cream flex items-center justify-center">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="mb-6">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-sunroad-amber-600 mx-auto"></div>
          </div>
          <h1 className="text-2xl font-bold text-sunroad-brown-900 mb-4">Updating your plan...</h1>
          <p className="text-sunroad-brown-600 mb-2">
            Please wait while we activate your Pro subscription.
          </p>
        </div>
      </div>
    </div>
  )
}
