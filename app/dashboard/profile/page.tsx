'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@/hooks/use-user'
import { useUserProfile } from '@/hooks/use-user-profile'
import ProfileHeader from '@/components/dashboard/profile-header'
import ProfileContent from '@/components/dashboard/profile-content'
import WorksSection from '@/components/dashboard/works-section'
import ProfilePageSkeleton from '@/components/dashboard/profile-page-skeleton'

export default function DashboardProfilePage() {
  const router = useRouter()
  // Use centralized user hook (cached, no duplicate API calls)
  const { user, loading, error } = useUser()
  const { profile, loading: profileLoading, error: profileError, refetch } = useUserProfile(user)

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login')
    }
  }, [user, loading, router])

  // Show loading while fetching user or profile
  if (loading || profileLoading) {
    return <ProfilePageSkeleton />
  }

  // Show error if any
  if (error || profileError) {
    return (
      <div className="min-h-screen bg-sunroad-cream flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-sunroad-brown-800 mb-4">Error</h1>
          <p className="text-sunroad-brown-600 mb-4">{error || profileError}</p>
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

  if (!user || !profile) {
    return null // Will redirect to login or show loading
  }

  return (
    <main className="min-h-screen bg-sunroad-cream">
      {/* Hero Section */}
      <ProfileHeader user={user} profile={profile} onProfileUpdate={refetch} />
      
      {/* Content */}
      <article className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 md:pt-8">
        <ProfileContent user={user} profile={profile} onProfileUpdate={refetch} />
        
        {/* Works Section */}
        <WorksSection user={user} profile={profile} onRefreshProfile={refetch} />
      </article>
    </main>
  )
}
