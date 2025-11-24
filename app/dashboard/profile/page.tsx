'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import { useUserProfile } from '@/hooks/use-user-profile'
import ProfileHeader from '@/components/dashboard/profile-header'
import ProfileContent from '@/components/dashboard/profile-content'
import WorksSection from '@/components/dashboard/works-section'
import ProfilePageSkeleton from '@/components/dashboard/profile-page-skeleton'

export default function DashboardProfilePage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const { profile, loading: profileLoading, error: profileError, refetch } = useUserProfile(user)

  useEffect(() => {
    async function getUser() {
      try {
        const supabase = createClient()
        const { data: { user }, error } = await supabase.auth.getUser()
        
        if (error) {
          console.error('Error fetching user:', error)
          setError('Failed to load user data')
          return
        }

        if (!user) {
          router.push('/auth/login')
          return
        }

        setUser(user)
      } catch (err) {
        console.error('Unexpected error:', err)
        setError('An unexpected error occurred')
      } finally {
        setLoading(false)
      }
    }

    getUser()
  }, [router])

  if (loading || profileLoading) {
    return <ProfilePageSkeleton />
  }

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
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-20">
        <ProfileContent user={user} profile={profile} />
        
        {/* Works Section */}
        <WorksSection user={user} profile={profile} />
      </div>
    </main>
  )
}
