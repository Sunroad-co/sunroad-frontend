'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@/hooks/use-user'
import OnboardingForm from '@/components/onboarding-form'
import AuthLayout from '@/components/auth-layout'

export default function OnboardingPage() {
  const router = useRouter()
  const { user, loading, profile } = useUser()

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push('/signup')
    }
  }, [user, loading, router])

  // Redirect if profile already exists
  useEffect(() => {
    if (!loading && user && profile) {
      router.push('/dashboard/profile')
    }
  }, [user, profile, loading, router])

  if (loading) {
    return (
      <AuthLayout title="Setting up your profile" subtitle="Please wait...">
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin h-8 w-8 border-2 border-sunroad-amber-600 border-t-transparent rounded-full" />
        </div>
      </AuthLayout>
    )
  }

  if (!user) {
    return null // Will redirect
  }

  return (
    <AuthLayout containerClassName="w-full max-w-5xl py-2 lg:py-4 mx-auto">
      <OnboardingForm />
    </AuthLayout>
  )
}

