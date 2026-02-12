import { NextRequest } from 'next/server'

const ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'https://sunroad.io',
  'https://www.sunroad.io',
  'https://sunroad-frontend.vercel.app',
]

/**
 * Get CORS headers for API routes called from browser.
 * If Origin is in allowlist, set Access-Control-Allow-Origin to that origin; otherwise no CORS headers.
 */
export function getCorsHeaders(request: NextRequest): HeadersInit {
  const origin = request.headers.get('origin')
  const headers: HeadersInit = {
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  }
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    headers['Access-Control-Allow-Origin'] = origin
  }
  return headers
}
