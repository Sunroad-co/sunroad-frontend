'use client'

import { useUser } from '@/contexts/user-context'
import { createClient } from '@/lib/supabase/client'

interface UseNavbarUserReturn {
  user: ReturnType<typeof useUser>['user']
  loading: ReturnType<typeof useUser>['loading']
  handleLogout: () => Promise<void>
}

/**
 * Hook to manage navbar user authentication state and logout logic.
 * 
 * Now uses the centralized useUser() hook to avoid duplicate API calls.
 * The user data is cached in UserContext, so this hook just provides
 * logout functionality and re-exports the cached user state.
 * 
 * Benefits:
 * - No duplicate getSession() calls (uses cached context)
 * - Automatic updates when auth state changes
 * - Same API as before, but more efficient
 */
export function useNavbarUser(): UseNavbarUserReturn {
  // Use centralized user context (cached, no duplicate calls)
  const { user, loading } = useUser()

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    // Redirect to login page
    // Note: The UserContext will automatically update user to null via onAuthStateChange
    window.location.href = '/auth/login'
  }

  return { user, loading, handleLogout }
}

