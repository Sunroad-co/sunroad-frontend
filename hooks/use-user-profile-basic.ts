'use client'

import { useUser } from '@/hooks/use-user'

/**
 * @deprecated Use useUser() hook instead - profile data is now cached in UserContext
 * 
 * This hook is kept for backward compatibility but just re-exports from useUser().
 * 
 * Migration:
 *   // Old
 *   const { profile, loading } = useUserProfileBasic()
 *   
 *   // New (recommended)
 *   const { profile, profileLoading } = useUser()
 * 
 * Benefits of using useUser():
 * - Profile data is fetched ONCE and cached in context
 * - No duplicate API calls across components
 * - Available throughout the entire app
 */
export function useUserProfileBasic() {
  const { profile, profileLoading } = useUser()
  return { profile, loading: profileLoading }
}

