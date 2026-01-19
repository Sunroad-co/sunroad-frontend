/**
 * Social Platform Host Patterns
 * 
 * This file maintains the canonical list of platform host patterns for URL validation.
 * These patterns match the database schema in social_platforms table.
 * 
 * When backend platform data is available, it takes precedence, but these constants
 * serve as a reliable fallback and ensure validation works even without API calls.
 */

export interface PlatformHostPatterns {
  key: string
  display_name: string
  host_patterns: string[] | null
  sort_order: number
}

/**
 * Platform host patterns matching the database schema
 * null = allows any valid URL (website, custom)
 * empty array = no restrictions
 * string[] = specific domains that are allowed
 */
export const PLATFORM_HOST_PATTERNS: Record<string, PlatformHostPatterns> = {
  website: {
    key: 'website',
    display_name: 'Website',
    host_patterns: null, // Any valid URL
    sort_order: 10,
  },
  instagram: {
    key: 'instagram',
    display_name: 'Instagram',
    host_patterns: ['instagram.com'],
    sort_order: 20,
  },
  facebook: {
    key: 'facebook',
    display_name: 'Facebook',
    host_patterns: ['facebook.com', 'fb.me', 'fb.com'],
    sort_order: 30,
  },
  linkedin: {
    key: 'linkedin',
    display_name: 'LinkedIn',
    host_patterns: ['linkedin.com'],
    sort_order: 35,
  },
  x: {
    key: 'x',
    display_name: 'X',
    host_patterns: ['x.com', 'twitter.com'],
    sort_order: 40,
  },
  twitter: {
    key: 'twitter',
    display_name: 'Twitter',
    host_patterns: ['x.com', 'twitter.com'], // Twitter redirects to X
    sort_order: 40,
  },
  youtube: {
    key: 'youtube',
    display_name: 'YouTube',
    host_patterns: ['youtube.com', 'youtu.be'],
    sort_order: 60,
  },
  tiktok: {
    key: 'tiktok',
    display_name: 'TikTok',
    host_patterns: ['tiktok.com'],
    sort_order: 70,
  },
  spotify: {
    key: 'spotify',
    display_name: 'Spotify',
    host_patterns: ['spotify.com', 'open.spotify.com'],
    sort_order: 80,
  },
  soundcloud: {
    key: 'soundcloud',
    display_name: 'SoundCloud',
    host_patterns: ['soundcloud.com'],
    sort_order: 90,
  },
  bandcamp: {
    key: 'bandcamp',
    display_name: 'Bandcamp',
    host_patterns: ['bandcamp.com'], // Also matches *.bandcamp.com
    sort_order: 100,
  },
  pinterest: {
    key: 'pinterest',
    display_name: 'Pinterest',
    host_patterns: ['pinterest.com', 'pin.it'],
    sort_order: 110,
  },
  etsy: {
    key: 'etsy',
    display_name: 'Etsy',
    host_patterns: ['etsy.com'],
    sort_order: 120,
  },
  behance: {
    key: 'behance',
    display_name: 'Behance',
    host_patterns: ['behance.net'],
    sort_order: 130,
  },
  dribbble: {
    key: 'dribbble',
    display_name: 'Dribbble',
    host_patterns: ['dribbble.com'],
    sort_order: 140,
  },
  vimeo: {
    key: 'vimeo',
    display_name: 'Vimeo',
    host_patterns: ['vimeo.com'],
    sort_order: 150,
  },
  'link-in-bio': {
    key: 'link-in-bio',
    display_name: 'Link in Bio',
    host_patterns: ['linktr.ee', 'linktree.com', 'msha.ke', 'beacons.ai', 'bio.link'],
    sort_order: 160,
  },
  custom: {
    key: 'custom',
    display_name: 'Custom',
    host_patterns: null, // Any valid URL
    sort_order: 1000,
  },
}

/**
 * Get host patterns for a platform
 * Returns the patterns from constants, or null if platform allows any URL
 */
export function getPlatformHostPatterns(platformKey: string): string[] | null {
  const platform = PLATFORM_HOST_PATTERNS[platformKey.toLowerCase()]
  return platform?.host_patterns ?? null
}

/**
 * Get display name for a platform
 */
export function getPlatformDisplayName(platformKey: string): string {
  const platform = PLATFORM_HOST_PATTERNS[platformKey.toLowerCase()]
  return platform?.display_name ?? platformKey.charAt(0).toUpperCase() + platformKey.slice(1)
}
