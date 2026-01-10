'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@/hooks/use-user'
import { useDashboardSnapshot } from '@/hooks/use-dashboard-snapshot'
import Link from 'next/link'

const MAX_ATTEMPTS = 20
const POLL_INTERVAL_MS = 1500

export default function BillingSuccessPage() {
  const router = useRouter()
  const { user, loading: userLoading } = useUser()
  const { tier, refresh, isLoading } = useDashboardSnapshot()
  
  const [attempts, setAttempts] = useState(0)
  const [isPolling, setIsPolling] = useState(false)
  const [hasTimedOut, setHasTimedOut] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const mountedRef = useRef(true)

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

  // Start polling when component mounts and user is loaded
  useEffect(() => {
    if (userLoading || !user) return

    const startPolling = () => {
      setIsPolling(true)
      setHasTimedOut(false)
      setAttempts(0)

      // Initial refresh
      refresh()

      intervalRef.current = setInterval(() => {
        if (!mountedRef.current) {
          if (intervalRef.current) {
            clearInterval(intervalRef.current)
          }
          return
        }

        setAttempts(prev => {
          const nextAttempt = prev + 1

          // Check if we've reached max attempts
          if (nextAttempt >= MAX_ATTEMPTS) {
            if (intervalRef.current) {
              clearInterval(intervalRef.current)
            }
            setIsPolling(false)
            setHasTimedOut(true)
            return nextAttempt
          }

          // Refresh snapshot
          refresh()

          return nextAttempt
        })
      }, POLL_INTERVAL_MS)
    }

    startPolling()
  }, [user, userLoading])

  // Check tier and stop polling if pro detected
  useEffect(() => {
    if (tier === 'pro' && isPolling && intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
      setIsPolling(false)
    }
  }, [tier, isPolling])

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!userLoading && !user) {
      router.push('/auth/login')
    }
  }, [user, userLoading, router])

  // Handle retry
  const handleRetry = () => {
    setAttempts(0)
    setHasTimedOut(false)
    setIsPolling(true)

    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }

    // Initial refresh
    refresh()

    // Start polling again
    intervalRef.current = setInterval(() => {
      if (!mountedRef.current) {
        if (intervalRef.current) {
          clearInterval(intervalRef.current)
        }
        return
      }

      setAttempts(prev => {
        const nextAttempt = prev + 1

        if (nextAttempt >= MAX_ATTEMPTS) {
          if (intervalRef.current) {
            clearInterval(intervalRef.current)
          }
          setIsPolling(false)
          setHasTimedOut(true)
          return nextAttempt
        }

        refresh()
        return nextAttempt
      })
    }, POLL_INTERVAL_MS)
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
  if (tier === 'pro' && !isPolling) {
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
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/settings"
                className="px-4 py-2 bg-sunroad-amber-600 text-white rounded-lg hover:bg-sunroad-amber-700 transition-colors font-medium"
              >
                Go to Settings
              </Link>
              <Link
                href="/dashboard/profile"
                className="px-4 py-2 bg-sunroad-amber-100 text-sunroad-amber-700 rounded-lg hover:bg-sunroad-amber-200 transition-colors font-medium"
              >
                Go to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Timeout state
  if (hasTimedOut) {
    return (
      <div className="min-h-screen bg-sunroad-cream flex items-center justify-center">
        <div className="max-w-md w-full mx-4">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="mb-6">
              <svg className="w-16 h-16 text-amber-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-sunroad-brown-900 mb-4">Still Syncing</h1>
            <p className="text-sunroad-brown-600 mb-6">
              Your plan update is still processing. Please refresh in a moment or try again.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={handleRetry}
                className="px-4 py-2 bg-sunroad-amber-600 text-white rounded-lg hover:bg-sunroad-amber-700 transition-colors font-medium"
              >
                Retry
              </button>
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
          {attempts > 0 && (
            <p className="text-sm text-sunroad-brown-500">
              Checking... ({attempts}/{MAX_ATTEMPTS})
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

