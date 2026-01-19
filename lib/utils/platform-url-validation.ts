/**
 * Platform-specific URL validation
 * Validates that a URL matches the expected platform domain
 */
export interface PlatformValidationResult {
  valid: boolean
  error?: string
}

export function validatePlatformUrl(url: string, platformKey: string): PlatformValidationResult {
  if (!url) return { valid: false, error: 'URL is required' }
  
  let urlObj: URL
  try {
    urlObj = new URL(url.startsWith('http') ? url : `https://${url}`)
  } catch {
    return { valid: false, error: 'Invalid URL format' }
  }
  
  const hostname = urlObj.hostname.toLowerCase().replace(/^www\./, '')
  
  // Platform-specific validation rules
  // All platforms that have icons should have validation rules
  const platformRules: Record<string, string[]> = {
    instagram: ['instagram.com'],
    facebook: ['facebook.com', 'fb.com'],
    linkedin: ['linkedin.com'],
    youtube: ['youtube.com', 'youtu.be'],
    x: ['x.com', 'twitter.com'],
    twitter: ['x.com', 'twitter.com'],
    pinterest: ['pinterest.com'],
    tiktok: ['tiktok.com'],
    etsy: ['etsy.com'],
    vimeo: ['vimeo.com'],
    soundcloud: ['soundcloud.com'],
    bandcamp: ['bandcamp.com'], // Also matches *.bandcamp.com
    spotify: ['spotify.com', 'open.spotify.com'],
    behance: ['behance.net'],
    dribbble: ['dribbble.com'],
    github: ['github.com'],
    gitlab: ['gitlab.com'],
    bitbucket: ['bitbucket.org'],
    codewars: ['codewars.com'],
    website: [], // Any valid URL
    custom: [], // Any valid URL
  }
  
  const allowedHosts = platformRules[platformKey.toLowerCase()]
  
  // website and custom allow any hostname
  if (platformKey === 'website' || platformKey === 'custom') {
    return { valid: true }
  }
  
  // Check if hostname matches allowed hosts
  if (!allowedHosts || allowedHosts.length === 0) {
    // Unknown platform - allow it but could log a warning
    return { valid: true }
  }
  
  const matches = allowedHosts.some(allowed => {
    if (platformKey === 'bandcamp') {
      return hostname === allowed || hostname.endsWith(`.${allowed}`)
    }
    return hostname === allowed || hostname.endsWith(`.${allowed}`)
  })
  
  if (!matches) {
    const platformName = platformKey.charAt(0).toUpperCase() + platformKey.slice(1)
    return { 
      valid: false, 
      error: `This URL doesn't appear to be a ${platformName} link. Expected domain: ${allowedHosts.join(' or ')}` 
    }
  }
  
  return { valid: true }
}

/**
 * Check if a URL matches its platform (for display/read-only validation)
 * Returns true if valid, false if mismatch detected
 */
export function checkPlatformUrlMatch(url: string, platformKey: string): boolean {
  const validation = validatePlatformUrl(url, platformKey)
  return validation.valid
}
