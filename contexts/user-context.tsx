'use client'

import { createContext, useContext, useEffect, useState, useRef, ReactNode } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User, Session, AuthChangeEvent } from '@supabase/supabase-js'

interface BasicProfile {
  display_name: string | null
  avatar_url: string | null
}

interface UserContextType {
  user: User | null
  profile: BasicProfile | null
  loading: boolean
  profileLoading: boolean
  error: string | null
}

const UserContext = createContext<UserContextType | undefined>(undefined)

/**
 * UserProvider - Centralized user authentication and profile state management.
 * 
 * Simple, industry-standard implementation:
 * - Fetches user session ONCE on mount
 * - Fetches profile data when user.id changes
 * - Ignores TOKEN_REFRESHED events to prevent unnecessary refetches on tab focus
 * - Caches user and profile data in React state
 */
export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<BasicProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [profileLoading, setProfileLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Track previous user ID to only clear profile when user actually changes
  const prevUserIdRef = useRef<string | null>(null)

  // 1. Get session once on mount
  // 2. Listen to auth state changes (ignore TOKEN_REFRESHED to prevent refetch on tab focus)
  useEffect(() => {
    const supabase = createClient()

    supabase.auth.getSession().then((result: { data: { session: Session | null }, error: Error | null }) => {
      const { data, error: sessionError } = result
      if (sessionError) {
        console.error('Error getting session:', sessionError)
        setError('Failed to load session')
        setLoading(false)
        return
      }

      const initialUser = data.session?.user ?? null
      setUser(initialUser)
      prevUserIdRef.current = initialUser?.id ?? null
      setLoading(false)
    })

    // Subscribe to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event: AuthChangeEvent, session: Session | null) => {
        // Ignore token refresh so tab-switching doesn't trigger profile refetch
        if (event === 'TOKEN_REFRESHED') return

        const newUser = session?.user ?? null
        const prevUserId = prevUserIdRef.current

        // Only update user and clear profile if user ID actually changed
        // This prevents clearing profile on tab restore when Supabase fires SIGNED_IN/INITIAL_SESSION
        // but the user hasn't actually changed
        if (newUser?.id !== prevUserId) {
          setUser(newUser)
          prevUserIdRef.current = newUser?.id ?? null
          setProfile(null) // Only clear profile when user actually changes
        }

        setLoading(false)
        setError(null)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  // 3. Fetch profile when user.id changes
  useEffect(() => {
    if (!user) {
      setProfile(null)
      setProfileLoading(false)
      return
    }

    const fetchProfile = async () => {
      setProfileLoading(true)
      try {
        const supabase = createClient()
        const { data, error: profileError } = await supabase
          .from('artists_min')
          .select('display_name, avatar_url')
          .eq('auth_user_id', user.id)
          .maybeSingle()

        if (profileError) {
          // Only log actual errors, not "no rows" (which is normal during onboarding)
          if (profileError.code !== 'PGRST116') {
            console.error('Error fetching basic profile:', profileError)
          }
          setProfile(null)
          return
        }

        // Profile might not exist yet (during onboarding), that's normal
        if (!data) {
          setProfile(null)
          return
        }

        setProfile({
          display_name: data.display_name ?? null,
          avatar_url: data.avatar_url ?? null,
        })
      } catch (err) {
        console.error('Unexpected error fetching basic profile:', err)
        setProfile(null)
      } finally {
        setProfileLoading(false)
      }
    }

    fetchProfile()
  }, [user?.id])

  return (
    <UserContext.Provider value={{ user, profile, loading, profileLoading, error }}>
      {children}
    </UserContext.Provider>
  )
}

/**
 * useUser - Hook to access current user data AND profile data throughout the app.
 * 
 * Usage:
 *   const { user, profile, loading, profileLoading, error } = useUser()
 * 
 * Returns:
 * - user: Auth user object (email, id, etc.)
 * - profile: Basic profile data (display_name, avatar_url) - CACHED
 * - loading: Auth loading state
 * - profileLoading: Profile loading state
 * - error: Auth error state
 * 
 * Benefits:
 * - No duplicate API calls (uses cached context state)
 * - Profile data is fetched ONCE and cached
 * - Always up-to-date (reacts to auth state changes)
 * - Simple API - just call useUser() anywhere
 * - Available throughout the entire app
 * 
 * Example:
 *   const { user, profile } = useUser()
 *   const displayName = profile?.display_name || user?.email?.split('@')[0]
 *   const avatarUrl = profile?.avatar_url
 * 
 * @returns {UserContextType} User data, profile data, loading states, and error
 */
export function useUser(): UserContextType {
  const context = useContext(UserContext)
  
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider')
  }
  
  return context
}
