'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@/hooks/use-user'
import SignupForm from "@/components/signup-form";
import AuthLayout from "@/components/auth-layout";

export default function Page() {
  const router = useRouter()
  const { user, loading, profile } = useUser()

  // Redirect if already authenticated
  useEffect(() => {
    if (!loading && user) {
      if (profile) {
        router.push('/dashboard/profile')
      } else {
        router.push('/onboarding')
      }
    }
  }, [user, profile, loading, router])

  if (loading) {
    return (
      <AuthLayout title="Join Sun Road" subtitle="Please wait...">
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin h-8 w-8 border-2 border-sunroad-amber-600 border-t-transparent rounded-full" />
        </div>
      </AuthLayout>
    )
  }

  if (user) {
    return null // Will redirect
  }

  return (
    <AuthLayout title="Join Sun Road" subtitle="Create your account and connect with local creatives">
      <SignupForm />
    </AuthLayout>
  );
}

