'use client'

import { useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@/hooks/use-user'
import { useDashboardSnapshot } from '@/hooks/use-dashboard-snapshot'
import { UserProfile } from '@/hooks/use-user-profile'
import ProfileHeader from '@/components/dashboard/profile-header'
import ProfileContent from '@/components/dashboard/profile-content'
import WorksSection from '@/components/dashboard/works-section'
import ProfilePageSkeleton from '@/components/dashboard/profile-page-skeleton'

export default function DashboardProfilePage() {
  const router = useRouter()
  // Use centralized user hook (cached, no duplicate API calls)
  const { user, loading, error } = useUser()
  // Use snapshot as primary data source for profile basics
  const { snapshot, isLoading: snapshotLoading, error: snapshotError, refresh } = useDashboardSnapshot()

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login')
    }
  }, [user, loading, router])

  // Redirect to onboarding if snapshot loaded and has_profile is false
  useEffect(() => {
    if (!loading && user && !snapshotLoading && snapshot && snapshot.has_profile === false) {
      router.push('/onboarding')
    }
  }, [user, snapshot, loading, snapshotLoading, router])

  // Build profile object from snapshot.profile to match UserProfile type
  const profile: UserProfile | null = useMemo(() => {
    if (!snapshot?.profile) {
      return null
    }

    const snapshotProfile = snapshot.profile
    return {
      id: snapshotProfile.artist_id,
      handle: snapshotProfile.handle,
      display_name: snapshotProfile.display_name,
      bio: snapshotProfile.bio,
      avatar_url: snapshotProfile.avatar_url,
      banner_url: snapshotProfile.banner_url,
      website_url: null, // Not in snapshot, will be fetched separately if needed
      instagram_url: null, // Not in snapshot, will be fetched separately if needed
      facebook_url: null, // Not in snapshot, will be fetched separately if needed
      categories: snapshotProfile.categories.map(cat => cat.name),
      category_ids: snapshotProfile.categories.map(cat => cat.id),
      location_id: snapshotProfile.location?.location_id ?? null,
      location: snapshotProfile.location
        ? {
            city: snapshotProfile.location.city ?? undefined,
            state: snapshotProfile.location.state ?? undefined,
            formatted: snapshotProfile.location.formatted,
          }
        : null,
      works: [], // Works are fetched separately in WorksSection
    }
  }, [snapshot])

  // Show loading while fetching user or snapshot
  if (loading || snapshotLoading) {
    return <ProfilePageSkeleton />
  }

  // Show error if any
  if (error || snapshotError) {
    return (
      <div className="min-h-screen bg-sunroad-cream flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-sunroad-brown-800 mb-4">Error</h1>
          <p className="text-sunroad-brown-600 mb-4">{error || snapshotError?.message || 'Failed to load dashboard'}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-sunroad-amber-600 text-white rounded-lg hover:bg-sunroad-amber-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  // Don't render ProfileContent/ProfileHeader until snapshot is loaded and has_profile is known
  if (!user || !snapshot || snapshot.has_profile === false || !profile) {
    return null // Will redirect to login/onboarding or show loading
  }

  return (
    <main className="min-h-screen bg-sunroad-cream">
      {/* Hero Section */}
      <ProfileHeader user={user} profile={profile} onProfileUpdate={refresh} />
      
      {/* Content */}
      <article className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 md:pt-8">
        <ProfileContent user={user} profile={profile} onProfileUpdate={refresh} />
        
        {/* Works Section */}
        <WorksSection user={user} profile={profile} onRefreshProfile={refresh} />
      </article>
    </main>
  )
}
