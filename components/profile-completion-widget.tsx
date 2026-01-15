'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@/hooks/use-user'
import { useDashboardSnapshot } from '@/hooks/use-dashboard-snapshot'
import { createClient } from '@/lib/supabase/client'
import ProfileCompletionGate from '@/components/profile-completion-gate'
import { normalizeMissingKeys } from '@/lib/profile-completion'

interface CompletionItem {
  key: string
  completed: boolean
}

/**
 * Floating widget that shows profile completion progress and upgrade CTA
 * Only visible when user is logged in and tier === 'free'
 */
export default function ProfileCompletionWidget() {
  const router = useRouter()
  const { user } = useUser()
  const { snapshot, profile, tier } = useDashboardSnapshot()
  const [showModal, setShowModal] = useState(false)
  const [checkingEligibility, setCheckingEligibility] = useState(false)
  const [backendMissing, setBackendMissing] = useState<string[]>([])
  const [isMinimized, setIsMinimized] = useState(false)

  // Compute completion items (EXCLUDING works - works checked via RPC only)
  // MUST be called before any early returns to follow Rules of Hooks
  const completionItems: CompletionItem[] = useMemo(() => {
    if (!profile) {
      return []
    }
    const items: CompletionItem[] = [
      {
        key: 'avatar_url',
        completed: !!(profile.avatar_url && profile.avatar_url.trim() !== ''),
      },
      {
        key: 'banner_url',
        completed: !!(profile.banner_url && profile.banner_url.trim() !== ''),
      },
      {
        key: 'bio',
        completed: !!(profile.bio && profile.bio.trim() !== ''),
      },
      {
        key: 'location_id',
        completed: !!(profile.location && profile.location.location_id),
      },
      {
        key: 'categories',
        completed: !!(profile.categories && profile.categories.length >= 1),
      },
      // Works removed - only checked via RPC on upgrade click
    ]
    return items
  }, [profile])

  // Calculate completion stats
  const { completed, total, percentage, missing } = useMemo(() => {
    const completedCount = completionItems.filter(item => item.completed).length
    const totalCount = completionItems.length
    const missingItems = completionItems
      .filter(item => !item.completed)
      .map(item => item.key)

    return {
      completed: completedCount,
      total: totalCount,
      percentage: totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0,
      missing: missingItems,
    }
  }, [completionItems])

  // Only show widget if user is logged in and tier is free
  // MUST be after all hooks to follow Rules of Hooks
  if (!user || tier !== 'free' || !snapshot || !profile) {
    return null
  }

  // Handle upgrade button click
  const handleUpgradeClick = async () => {
    // Always check backend eligibility (includes works check) - backend is source of truth
    setCheckingEligibility(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase.rpc('get_profile_upgrade_eligibility')

      if (error) {
        console.error('Error checking eligibility:', error)
        // On error, show modal with frontend missing items
        setBackendMissing(missing)
        setShowModal(true)
        return
      }

      if (data?.eligible) {
        // Eligible, navigate to settings/upgrade
        router.push('/settings')
      } else {
        // Not eligible, normalize and show modal with backend missing items
        const normalizedMissing = normalizeMissingKeys(data?.missing || missing)
        setBackendMissing(normalizedMissing)
        setShowModal(true)
      }
    } catch (err) {
      console.error('Unexpected error checking eligibility:', err)
      setBackendMissing(missing)
      setShowModal(true)
    } finally {
      setCheckingEligibility(false)
    }
  }


  // Calculate circular progress SVG
  const desktopRadius = 24
  const desktopCircumference = 2 * Math.PI * desktopRadius
  const desktopOffset = desktopCircumference - (percentage / 100) * desktopCircumference
  
  const mobileRadius = 20
  const mobileCircumference = 2 * Math.PI * mobileRadius
  const mobileOffset = mobileCircumference - (percentage / 100) * mobileCircumference

  // Get progress color based on percentage buckets
  const getProgressColor = (percent: number): string => {
    if (percent >= 100) return '#16a34a' // green-600
    if (percent >= 75) return '#ca8a04' // amber-600 (yellow)
    if (percent >= 50) return '#ea580c' // orange-600
    return '#dc2626' // red-600
  }

  // Message ladder based on percentage
  const getMessages = (percent: number): { title: string; subtitle: string } => {
    if (percent >= 100) {
      return {
        title: "You're ready",
        subtitle: "Upgrade to Pro to be discoverable"
      }
    }
    if (percent >= 75) {
      return {
        title: "Almost there",
        subtitle: "Complete a few more items to unlock Pro"
      }
    }
    if (percent >= 50) {
      return {
        title: "Getting started",
        subtitle: "Complete your profile basics to unlock Pro"
      }
    }
    return {
      title: "Profile strength",
      subtitle: "Complete basics to unlock Pro"
    }
  }

  const { title: titleText, subtitle: subtitleText } = getMessages(percentage)
  const progressColor = getProgressColor(percentage)

  return (
    <>
      {/* Desktop: Floating widget bottom-right */}
      <div className="hidden md:block fixed bottom-6 right-6 z-40">
        {isMinimized ? (
          <button
            onClick={() => setIsMinimized(false)}
            className="bg-white rounded-lg shadow-lg border border-sunroad-amber-100 p-3 hover:bg-sunroad-cream transition-colors"
            aria-label="Show profile completion widget"
          >
            <svg className="w-5 h-5 text-sunroad-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
        ) : (
          <div className="bg-white rounded-lg shadow-lg border border-sunroad-amber-100 p-4 w-72">
            <div className="flex items-start gap-2 mb-3">
              <div className="flex items-center gap-4 flex-1">
                {/* Circular Progress */}
                <div className="relative flex-shrink-0">
                  <svg className="w-14 h-14 transform -rotate-90" viewBox="0 0 56 56">
                    {/* Background circle */}
                    <circle
                      cx="28"
                      cy="28"
                      r={desktopRadius}
                      fill="none"
                      stroke="#FEF3C7"
                      strokeWidth="4"
                    />
                    {/* Progress circle */}
                    <circle
                      cx="28"
                      cy="28"
                      r={desktopRadius}
                      fill="none"
                      stroke={progressColor}
                      strokeWidth="4"
                      strokeDasharray={desktopCircumference}
                      strokeDashoffset={desktopOffset}
                      strokeLinecap="round"
                      className="transition-all duration-300"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-sm font-semibold text-sunroad-brown-900">
                      {percentage}%
                    </span>
                  </div>
                </div>

                {/* Text Content */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-sunroad-brown-900 mb-1">
                    {titleText}
                  </p>
                  <p className="text-xs text-sunroad-brown-600 mb-3">
                    {subtitleText}
                  </p>
                  <button
                    onClick={handleUpgradeClick}
                    disabled={checkingEligibility}
                    className="w-full px-3 py-1.5 text-xs font-medium bg-sunroad-amber-600 text-white rounded-md hover:bg-sunroad-amber-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {checkingEligibility
                      ? 'Checking...'
                      : percentage === 100
                      ? 'View plans'
                      : 'Upgrade to Pro'}
                  </button>
                </div>
              </div>
              {/* Minimize button (X icon) */}
              <button
                onClick={() => setIsMinimized(true)}
                className="p-1 hover:bg-sunroad-cream rounded transition-colors flex-shrink-0"
                aria-label="Minimize"
              >
                <svg className="w-4 h-4 text-sunroad-brown-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Mobile: Sticky bottom bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-sunroad-amber-100 shadow-lg">
        {isMinimized ? (
          <div className="px-4 py-2">
            <button
              onClick={() => setIsMinimized(false)}
              className="w-full px-3 py-2 bg-sunroad-amber-50 border border-sunroad-amber-200 rounded-lg text-xs font-medium text-sunroad-brown-900 hover:bg-sunroad-amber-100 transition-colors flex items-center justify-center gap-2"
            >
              <span>Profile {percentage}%</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
        ) : (
          <div className="px-4 py-3">
            <div className="flex items-center gap-3">
              {/* Circular Progress */}
              <div className="relative flex-shrink-0">
                <svg className="w-12 h-12 transform -rotate-90" viewBox="0 0 48 48">
                  {/* Background circle */}
                  <circle
                    cx="24"
                    cy="24"
                    r={mobileRadius}
                    fill="none"
                    stroke="#FEF3C7"
                    strokeWidth="3"
                  />
                  {/* Progress circle */}
                  <circle
                    cx="24"
                    cy="24"
                    r={mobileRadius}
                    fill="none"
                    stroke={progressColor}
                    strokeWidth="3"
                    strokeDasharray={mobileCircumference}
                    strokeDashoffset={mobileOffset}
                    strokeLinecap="round"
                    className="transition-all duration-300"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xs font-semibold text-sunroad-brown-900">
                    {percentage}%
                  </span>
                </div>
              </div>

              {/* Text Content */}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-sunroad-brown-900 mb-0.5">
                  {titleText}
                </p>
                <p className="text-xs text-sunroad-brown-600 mb-2">
                  {subtitleText}
                </p>
                <button
                  onClick={handleUpgradeClick}
                  disabled={checkingEligibility}
                  className="w-full px-3 py-1.5 text-xs font-medium bg-sunroad-amber-600 text-white rounded-md hover:bg-sunroad-amber-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {checkingEligibility
                    ? 'Checking...'
                    : percentage === 100
                    ? 'View plans'
                    : 'Upgrade to Pro'}
                </button>
              </div>
              
              {/* Minimize button (X icon) */}
              <button
                onClick={() => setIsMinimized(true)}
                className="p-1 hover:bg-sunroad-cream rounded transition-colors flex-shrink-0"
                aria-label="Minimize"
              >
                <svg className="w-5 h-5 text-sunroad-brown-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal for incomplete profile */}
      {showModal && (
        <ProfileCompletionGate
          missing={backendMissing.length > 0 ? backendMissing : missing}
          variant="modal"
          onClose={() => {
            setShowModal(false)
            setBackendMissing([])
          }}
        />
      )}
    </>
  )
}
