import { NextResponse } from 'next/server'

/**
 * Constant-time string comparison to prevent timing attacks on secrets.
 */
export function constantTimeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let out = 0
  for (let i = 0; i < a.length; i++) {
    out |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return out === 0
}

/**
 * Return a JSON response with status. Use for consistent API errors; does not leak secrets.
 */
export function jsonResponse(
  body: Record<string, unknown>,
  status: number,
  headers?: HeadersInit
): NextResponse {
  return NextResponse.json(body, { status, headers })
}

/**
 * 429 rate limit response with optional Retry-After (seconds).
 */
export function rateLimitResponse(retryAfterSeconds?: number): NextResponse {
  const headers: HeadersInit = {}
  if (retryAfterSeconds != null && retryAfterSeconds > 0) {
    headers['Retry-After'] = String(Math.ceil(retryAfterSeconds))
  }
  return jsonResponse(
    { error: 'Too many requests. Please try again later.' },
    429,
    headers
  )
}
