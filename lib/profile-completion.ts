/**
 * Mapping of profile completion missing keys to user-friendly labels and deep links
 * Supports both backend keys (avatar, banner, bio, location, categories, work)
 * and frontend keys (avatar_url, banner_url, bio, location_id, categories, works)
 */
export const PROFILE_COMPLETION_MAP: Record<string, { label: string; href: string }> = {
  // Frontend keys
  avatar_url: {
    label: 'Profile photo',
    href: '/dashboard/profile#avatar',
  },
  banner_url: {
    label: 'Banner image',
    href: '/dashboard/profile#banner',
  },
  bio: {
    label: 'Bio',
    href: '/dashboard/profile#bio',
  },
  location_id: {
    label: 'Location',
    href: '/dashboard/profile#location',
  },
  categories: {
    label: 'At least 1 category',
    href: '/dashboard/profile#categories',
  },
  works: {
    label: 'At least 1 work',
    href: '/dashboard/profile#works',
  },
  // Backend keys (normalized to frontend keys)
  avatar: {
    label: 'Profile photo',
    href: '/dashboard/profile#avatar',
  },
  banner: {
    label: 'Banner image',
    href: '/dashboard/profile#banner',
  },
  location: {
    label: 'Location',
    href: '/dashboard/profile#location',
  },
  work: {
    label: 'At least 1 work',
    href: '/dashboard/profile#works',
  },
}

/**
 * Mapping from backend keys to frontend keys
 */
const BACKEND_TO_FRONTEND_KEY_MAP: Record<string, string> = {
  avatar: 'avatar_url',
  banner: 'banner_url',
  location: 'location_id',
  work: 'works',
  // These are the same in both
  bio: 'bio',
  categories: 'categories',
}

/**
 * Stable order for missing keys (for consistent rendering)
 */
const KEY_ORDER = ['avatar_url', 'banner_url', 'bio', 'location_id', 'categories', 'works']

/**
 * Normalize missing keys from backend format to frontend format
 * - Maps backend keys (avatar, banner, location, work) to frontend keys (avatar_url, banner_url, location_id, works)
 * - Deduplicates keys
 * - Returns in stable order
 */
export function normalizeMissingKeys(keys: string[]): string[] {
  // Map backend keys to frontend keys
  const normalized = keys.map(key => BACKEND_TO_FRONTEND_KEY_MAP[key] || key)
  
  // Deduplicate
  const unique = Array.from(new Set(normalized))
  
  // Sort by stable order (keys in order appear first, then any others)
  return unique.sort((a, b) => {
    const indexA = KEY_ORDER.indexOf(a)
    const indexB = KEY_ORDER.indexOf(b)
    
    // If both are in order, sort by order
    if (indexA !== -1 && indexB !== -1) {
      return indexA - indexB
    }
    // If only one is in order, it comes first
    if (indexA !== -1) return -1
    if (indexB !== -1) return 1
    // Otherwise maintain original order
    return 0
  })
}

/**
 * Get friendly label for a missing key
 */
export function getMissingLabel(key: string): string {
  return PROFILE_COMPLETION_MAP[key]?.label || key
}

/**
 * Get deep link href for a missing key
 */
export function getMissingHref(key: string): string {
  return PROFILE_COMPLETION_MAP[key]?.href || '/dashboard/profile'
}
