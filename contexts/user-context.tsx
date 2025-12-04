'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
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
 * This provider:
 * - Fetches user session ONCE on mount
 * - Fetches basic profile data (display_name, avatar_url) ONCE when user is authenticated
 * - Subscribes to auth state changes (login/logout)
 * - Caches ALL user data in React state (no duplicate API calls)
 * - Can be used throughout the app via useUser() hook
 * 
 * Benefits:
 * - Single source of truth for user AND profile data
 * - No duplicate getSession()/getUser() calls
 * - No duplicate profile fetches (cached in context)
 * - Automatic updates when auth state changes
 * - Efficient caching in memory
 * - Available throughout the entire app
 */
export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<BasicProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [profileLoading, setProfileLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch basic profile data when user is authenticated
  useEffect(() => {
    if (!user) {
      setProfile(null)
      setProfileLoading(false)
      return
    }

    // Capture user.id to avoid closure issues
    const userId = user.id

    async function fetchBasicProfile() {
      try {
        setProfileLoading(true)
        const supabase = createClient()
        
        const { data, error } = await supabase
          .from('artists_min')
          .select('display_name, avatar_url')
          .eq('auth_user_id', userId)
          .single()

        if (error) {
          // Profile might not exist yet, that's okay
          console.error('Error fetching basic profile:', error)
          setProfile(null)
          return
        }

        setProfile({
          display_name: data?.display_name || null,
          avatar_url: data?.avatar_url || null
        })
      } catch (err) {
        console.error('Unexpected error fetching basic profile:', err)
        setProfile(null)
      } finally {
        setProfileLoading(false)
      }
    }

    fetchBasicProfile()
  }, [user])

  useEffect(() => {
    const supabase = createClient()

    // Get initial session (fast, uses cached session)
    // getSession() is faster than getUser() because it uses cached session data
    supabase.auth.getSession().then(({ data, error: sessionError }: { data: { session: Session | null }, error: Error | null }) => {
      if (sessionError) {
        console.error('Error getting session:', sessionError)
        setError('Failed to load session')
        setLoading(false)
        return
      }

      setUser(data.session?.user || null)
      setLoading(false)
    })

    // Subscribe to auth state changes (login, logout, token refresh, etc.)
    // This ensures all components using useUser() get updated automatically
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: Session | null) => {
        // Update user state when auth changes
        setUser(session?.user || null)
        setLoading(false)
        setError(null)

        // Log auth events for debugging (optional)
        if (event === 'SIGNED_OUT') {
          // Clear any cached data if needed
          setUser(null)
          setProfile(null)
        }
      }
    )

    // Cleanup subscription on unmount
    return () => {
      subscription.unsubscribe()
    }
  }, [])

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
