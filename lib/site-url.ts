/**
 * Canonical public site URL for metadata, OG, sitemap, and links.
 * Priority: NEXT_PUBLIC_SITE_URL → VERCEL_URL → http://localhost:3000
 * 
 * - Ensures protocol prefix (https://) if missing
 * - Removes trailing slash
 * - Returns protocol+host only (no path)
 */
export function getSiteUrl(): string {
  let url: string | undefined

  // Priority 1: NEXT_PUBLIC_SITE_URL
  if (typeof process.env.NEXT_PUBLIC_SITE_URL === 'string' && process.env.NEXT_PUBLIC_SITE_URL.trim()) {
    url = process.env.NEXT_PUBLIC_SITE_URL.trim()
  }
  // Priority 2: VERCEL_URL (auto-set by Vercel)
  else if (typeof process.env.VERCEL_URL === 'string' && process.env.VERCEL_URL.trim()) {
    url = process.env.VERCEL_URL.trim()
  }
  // Priority 3: localhost fallback
  else {
    return 'http://localhost:3000'
  }

  // Remove all trailing slashes
  url = url.replace(/\/+$/, '')

  // Add protocol if missing (assume https for production, http for localhost)
  if (!url.match(/^https?:\/\//)) {
    url = url.includes('localhost') || url.includes('127.0.0.1') ? `http://${url}` : `https://${url}`
  }

  return url
}
