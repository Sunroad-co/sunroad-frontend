'use client'

import { ReactNode } from 'react'
import { useFeature, FeatureName } from '@/hooks/use-feature'

interface FeatureGateProps {
  feature: FeatureName
  fallback?: ReactNode
  children: ReactNode
}

/**
 * Component to conditionally render children based on feature access
 * 
 * @param feature - The feature to check
 * @param fallback - Optional fallback content to show when feature is not allowed
 * @param children - Content to render when feature is allowed
 * 
 * @example
 * <FeatureGate feature="upload_work" fallback={<div>Upgrade to add more works</div>}>
 *   <UploadButton />
 * </FeatureGate>
 */
export default function FeatureGate({ feature, fallback = null, children }: FeatureGateProps) {
  const { allowed } = useFeature(feature)

  if (!allowed) {
    return <>{fallback}</>
  }

  return <>{children}</>
}

