import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { NextRequest, NextResponse } from 'next/server'
import { rateLimitResponse } from './api-response'
import { createHash } from 'crypto'

const REDIS_URL = process.env.KV_REST_API_URL
const REDIS_TOKEN = process.env.KV_REST_API_TOKEN

let redis: Redis | null = null
let ratelimitStrict: Ratelimit | null = null
let ratelimitModerate: Ratelimit | null = null
let ratelimitLoose: Ratelimit | null = null
let ratelimitWebhook: Ratelimit | null = null

function getRedis(): Redis | null {
  if (redis) return redis
  if (REDIS_URL && REDIS_TOKEN) {
    redis = new Redis({ url: REDIS_URL, token: REDIS_TOKEN })
    return redis
  }
  return null
}

/**
 * Derive client IP from request (Vercel-safe).
 * Checks: x-forwarded-for → x-real-ip → cf-connecting-ip → request.ip → null
 * Returns null if IP cannot be determined (not 'unknown' to avoid shared bucket).
 */
export function getClientIp(request: NextRequest): string | null {
  // 1. x-forwarded-for (first IP in chain)
  const xff = request.headers.get('x-forwarded-for')
  if (xff && xff.trim()) {
    const firstIp = xff.split(',')[0].trim()
    if (firstIp) return firstIp
  }

  // 2. x-real-ip (Vercel, nginx)
  const xRealIp = request.headers.get('x-real-ip')
  if (xRealIp && xRealIp.trim()) {
    return xRealIp.trim()
  }

  // 3. cf-connecting-ip (Cloudflare)
  const cfIp = request.headers.get('cf-connecting-ip')
  if (cfIp && cfIp.trim()) {
    return cfIp.trim()
  }

  // 4. request.ip (Next.js may set this)
  const ip = (request as NextRequest & { ip?: string }).ip
  if (ip && ip.trim()) {
    return ip.trim()
  }

  // 5. No IP found - return null (not 'unknown')
  return null
}

/**
 * Generate a hash from User-Agent + Accept-Language for fallback rate limiting.
 * Used when IP cannot be determined to avoid shared 'unknown' bucket.
 */
function getUserAgentHash(request: NextRequest): string {
  const ua = request.headers.get('user-agent') || ''
  const acceptLang = request.headers.get('accept-language') || ''
  const combined = `${ua}:${acceptLang}`
  return createHash('sha256').update(combined).digest('hex').substring(0, 16)
}

function getOrCreateStrict(): Ratelimit | null {
  const r = getRedis()
  if (!r) return null
  if (!ratelimitStrict) {
    ratelimitStrict = new Ratelimit({
      redis: r,
      limiter: Ratelimit.slidingWindow(30, '10 s'),
      analytics: true,
    })
  }
  return ratelimitStrict
}

function getOrCreateModerate(): Ratelimit | null {
  const r = getRedis()
  if (!r) return null
  if (!ratelimitModerate) {
    ratelimitModerate = new Ratelimit({
      redis: r,
      limiter: Ratelimit.slidingWindow(10, '10 s'),
      analytics: true,
    })
  }
  return ratelimitModerate
}

function getOrCreateLoose(): Ratelimit | null {
  const r = getRedis()
  if (!r) return null
  if (!ratelimitLoose) {
    ratelimitLoose = new Ratelimit({
      redis: r,
      limiter: Ratelimit.slidingWindow(60, '60 s'),
      analytics: true,
    })
  }
  return ratelimitLoose
}

function getOrCreateWebhook(): Ratelimit | null {
  const r = getRedis()
  if (!r) return null
  if (!ratelimitWebhook) {
    ratelimitWebhook = new Ratelimit({
      redis: r,
      limiter: Ratelimit.slidingWindow(30, '60 s'),
      analytics: true,
    })
  }
  return ratelimitWebhook
}

export type RateLimitResult = { limited: true; response: NextResponse } | { limited: false }

/**
 * Strict: 30 requests per 10s per IP.
 * keySuffix optional (e.g. route name) to namespace keys.
 * If IP is null, falls back to UA hash to avoid shared 'unknown' bucket.
 */
export async function rateLimitStrict(
  request: NextRequest,
  keySuffix?: string
): Promise<RateLimitResult> {
  const limiter = getOrCreateStrict()
  if (!limiter) return { limited: false }

  const ip = getClientIp(request)
  const identifier = ip ?? `ua:${getUserAgentHash(request)}`
  const key = keySuffix ? `strict:${keySuffix}:${identifier}` : `strict:${identifier}`
  const result = await limiter.limit(key)

  if (!result.success) {
    const retryAfter = result.reset ? Math.max(0, result.reset - Math.floor(Date.now() / 1000)) : undefined
    return { limited: true, response: rateLimitResponse(retryAfter) }
  }
  return { limited: false }
}

/**
 * Moderate: 10 requests per 10s per (userId if present else IP).
 * If IP is null and no userId, falls back to UA hash to avoid shared 'unknown' bucket.
 */
export async function rateLimitModerate(
  request: NextRequest,
  userId?: string | null
): Promise<RateLimitResult> {
  const limiter = getOrCreateModerate()
  if (!limiter) return { limited: false }

  const ip = getClientIp(request)
  const identifier = userId ?? (ip ?? `ua:${getUserAgentHash(request)}`)
  const key = `moderate:${identifier}`
  const result = await limiter.limit(key)

  if (!result.success) {
    const retryAfter = result.reset ? Math.max(0, result.reset - Math.floor(Date.now() / 1000)) : undefined
    return { limited: true, response: rateLimitResponse(retryAfter) }
  }
  return { limited: false }
}

/**
 * Loose: 60 requests per 60s per IP.
 * If IP is null, falls back to UA hash to avoid shared 'unknown' bucket.
 */
export async function rateLimitLoose(request: NextRequest): Promise<RateLimitResult> {
  const limiter = getOrCreateLoose()
  if (!limiter) return { limited: false }

  const ip = getClientIp(request)
  const identifier = ip ?? `ua:${getUserAgentHash(request)}`
  const key = `loose:${identifier}`
  const result = await limiter.limit(key)

  if (!result.success) {
    const retryAfter = result.reset ? Math.max(0, result.reset - Math.floor(Date.now() / 1000)) : undefined
    return { limited: true, response: rateLimitResponse(retryAfter) }
  }
  return { limited: false }
}

/**
 * Very loose for webhooks: 30 requests per 60s per IP (do not break legitimate spikes).
 * For webhooks with signed secrets, if IP is null, rate limit by route name to avoid shared bucket.
 * This is safe because webhooks are authenticated via secret verification.
 */
export async function rateLimitWebhookLoose(
  request: NextRequest,
  routeName?: string
): Promise<RateLimitResult> {
  const limiter = getOrCreateWebhook()
  if (!limiter) return { limited: false }

  const ip = getClientIp(request)
  // For webhooks with secrets, if IP missing, use route name (safe because secret is verified)
  // Otherwise fall back to UA hash
  const identifier = ip ?? (routeName ? `route:${routeName}` : `ua:${getUserAgentHash(request)}`)
  const key = `webhook:${identifier}`
  const result = await limiter.limit(key)

  if (!result.success) {
    const retryAfter = result.reset ? Math.max(0, result.reset - Math.floor(Date.now() / 1000)) : undefined
    return { limited: true, response: rateLimitResponse(retryAfter) }
  }
  return { limited: false }
}
