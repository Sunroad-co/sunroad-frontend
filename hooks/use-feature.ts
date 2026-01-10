'use client'

import { useDashboardSnapshot } from '@/hooks/use-dashboard-snapshot'

export type FeatureName = 'upload_work' | 'add_category' | 'directory_listed' | 'contact_form'

interface FeatureCheckResult {
  allowed: boolean
  reason: string | null
  limit: number | null
  used: number | null
}

/**
 * Feature configuration mapping
 */
const FEATURE_CONFIG: Record<FeatureName, {
  check: (snapshot: {
    tier: string | null
    profile: any
    limits: any
    usage: any
  }) => FeatureCheckResult
}> = {
  upload_work: {
    check: ({ tier, limits, usage }) => {
      const maxWorks = limits?.max_works ?? 0
      const currentWorks = usage?.public_active_works ?? 0
      const allowed = currentWorks < maxWorks

      if (allowed) {
        return {
          allowed: true,
          reason: null,
          limit: maxWorks,
          used: currentWorks,
        }
      }

      // Generate user-facing reason using tier field
      const tierName = tier === 'pro' ? 'Pro' : 'Free'
      return {
        allowed: false,
        reason: `${tierName} plan allows ${maxWorks} works. Upgrade to add more.`,
        limit: maxWorks,
        used: currentWorks,
      }
    },
  },
  add_category: {
    check: ({ tier, limits, usage }) => {
      const maxCategories = limits?.max_categories ?? 0
      const currentCategories = usage?.categories_count ?? 0
      const allowed = currentCategories < maxCategories

      if (allowed) {
        return {
          allowed: true,
          reason: null,
          limit: maxCategories,
          used: currentCategories,
        }
      }

      // Generate user-facing reason using tier field
      // For Pro users at limit, don't show upgrade option
      if (tier === 'pro') {
        return {
          allowed: false,
          reason: `You have reached the limit of ${maxCategories} categories for the Pro plan. We don't have a higher tier available at this time.`,
          limit: maxCategories,
          used: currentCategories,
        }
      }

      // For Free users, show upgrade option
      return {
        allowed: false,
        reason: `Free plan allows ${maxCategories} categories. Upgrade to add more.`,
        limit: maxCategories,
        used: currentCategories,
      }
    },
  },
  directory_listed: {
    check: ({ profile }) => {
      const isListed = profile?.is_listed === true
      return {
        allowed: isListed,
        reason: isListed ? null : 'Your profile is not listed in the directory.',
        limit: null,
        used: null,
      }
    },
  },
  contact_form: {
    check: ({ tier, profile }) => {
      const isPro = tier === 'pro'
      const isListed = profile?.is_listed === true
      const allowed = isPro && isListed

      if (allowed) {
        return {
          allowed: true,
          reason: null,
          limit: null,
          used: null,
        }
      }

      // Generate user-facing reason
      if (!isPro) {
        return {
          allowed: false,
          reason: 'Contact form is available on Pro plan. Upgrade to enable.',
          limit: null,
          used: null,
        }
      }
      if (!isListed) {
        return {
          allowed: false,
          reason: 'Contact form requires your profile to be listed in the directory.',
          limit: null,
          used: null,
        }
      }

      return {
        allowed: false,
        reason: 'Contact form is not available.',
        limit: null,
        used: null,
      }
    },
  },
}

/**
 * Hook to check feature access based on dashboard snapshot
 * 
 * @param featureName - The feature to check
 * @returns Feature check result with allowed status, reason, limit, and used count
 * 
 * @example
 * const { allowed, reason } = useFeature('upload_work')
 * if (!allowed) {
 *   return <div>{reason}</div>
 * }
 */
export function useFeature(featureName: FeatureName): FeatureCheckResult {
  const { tier, profile, limits, usage, isLoading } = useDashboardSnapshot()

  // If still loading, return neutral state (assume not allowed until data loads)
  if (isLoading) {
    return {
      allowed: false,
      reason: 'Loading...',
      limit: null,
      used: null,
    }
  }

  // If no data available, return not allowed
  if (!tier && !profile && !limits && !usage) {
    return {
      allowed: false,
      reason: 'Unable to check feature access.',
      limit: null,
      used: null,
    }
  }

  // Get feature config and run check
  const config = FEATURE_CONFIG[featureName]
  if (!config) {
    return {
      allowed: false,
      reason: `Unknown feature: ${featureName}`,
      limit: null,
      used: null,
    }
  }

  return config.check({ tier, profile, limits, usage })
}

