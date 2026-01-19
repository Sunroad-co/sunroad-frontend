/**
 * Platform-specific URL validation
 * Validates that a URL matches the expected platform domain
 * 
 * Priority:
 * 1. Backend host_patterns (if provided) - most up-to-date
 * 2. Frontend constants - reliable fallback
 * 3. Allow any URL for website/custom platforms
 */
import { getPlatformHostPatterns, getPlatformDisplayName } from '@/lib/constants/social-platforms'

export interface PlatformValidationResult {
  valid: boolean
  error?: string
}

export function validatePlatformUrl(
  url: string, 
  platformKey: string, 
  backendHostPatterns?: string[] | null
): PlatformValidationResult {
  if (!url) return { valid: false, error: 'URL is required' }
  
  let urlObj: URL
  try {
    urlObj = new URL(url.startsWith('http') ? url : `https://${url}`)
  } catch {
    return { valid: false, error: 'Invalid URL format' }
  }
  
  const hostname = urlObj.hostname.toLowerCase().replace(/^www\./, '')
  
  // Priority: Use backend host_patterns if provided, otherwise use frontend constants
  let allowedHosts: string[] | null = null
  
  if (backendHostPatterns !== undefined) {
    // Backend data provided (could be null, empty array, or array of patterns)
    allowedHosts = backendHostPatterns
  } else {
    // Fallback to frontend constants
    allowedHosts = getPlatformHostPatterns(platformKey)
  }
  
  // website and custom allow any hostname (null means no restrictions)
  if (platformKey === 'website' || platformKey === 'custom' || !allowedHosts || allowedHosts.length === 0) {
    return { valid: true }
  }
  
  // Check if hostname matches allowed hosts
  const matches = allowedHosts.some(allowed => {
    // Special handling for bandcamp subdomains (e.g., artist.bandcamp.com)
    if (platformKey === 'bandcamp') {
      return hostname === allowed || hostname.endsWith(`.${allowed}`)
    }
    // For other platforms, match exact domain or subdomain
    return hostname === allowed || hostname.endsWith(`.${allowed}`)
  })
  
  if (!matches) {
    const platformName = getPlatformDisplayName(platformKey)
    return { 
      valid: false, 
      error: `This URL doesn't appear to be a ${platformName} link. Expected domain: ${allowedHosts.join(', ')}` 
    }
  }
  
  return { valid: true }
}

/**
 * Check if a URL matches its platform (for display/read-only validation)
 * Returns true if valid, false if mismatch detected
 * Note: This doesn't have access to platform data, so uses fallback rules
 */
export function checkPlatformUrlMatch(url: string, platformKey: string): boolean {
  const validation = validatePlatformUrl(url, platformKey)
  return validation.valid
}
