import type { Context, MiddlewareHandler } from 'hono'
import { getConnInfo } from '@hono/node-server/conninfo'
import { env } from '../env.js'
import type { AppEnv } from '../http/context.js'

interface Bucket {
  count: number
  resetAt: number
}

const buckets = new Map<string, Bucket>()

setInterval(() => {
  const now = Date.now()
  for (const [key, bucket] of buckets) if (bucket.resetAt <= now) buckets.delete(key)
}, 60_000).unref()

/**
 * The leftmost X-Forwarded-For entries are whatever the client sent, so they
 * cannot key a rate limit. Each trusted proxy appends the address it saw; with
 * N hops the client is the Nth entry from the right. Without a proxy only the
 * socket address counts.
 */
export function clientKey(c: Context<AppEnv>, hops = env.TRUST_PROXY_HOPS): string {
  if (hops > 0) {
    const chain = (c.req.header('x-forwarded-for') ?? '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
    return chain[chain.length - hops] ?? 'unknown'
  }
  try {
    return getConnInfo(c).remote.address ?? 'unknown'
  } catch {
    // In-process requests (tests) have no socket.
    return 'local'
  }
}

export function rateLimit(max: number, windowMs: number, scope: string): MiddlewareHandler<AppEnv> {
  return async (c, next) => {
    const key = `${scope}:${clientKey(c)}`
    const now = Date.now()
    const bucket = buckets.get(key)

    if (!bucket || bucket.resetAt <= now) {
      buckets.set(key, { count: 1, resetAt: now + windowMs })
    } else if (bucket.count >= max) {
      const retryAfter = Math.ceil((bucket.resetAt - now) / 1000)
      c.header('Retry-After', String(retryAfter))
      c.header('X-RateLimit-Limit', String(max))
      c.header('X-RateLimit-Remaining', '0')
      return c.json(
        {
          error: {
            code: 'rate_limited',
            message: `Too many ${scope} attempts. Try again in ${retryAfter}s.`,
            requestId: c.get('requestId') ?? 'unknown',
          },
        },
        429,
      )
    } else {
      bucket.count += 1
      c.header('X-RateLimit-Limit', String(max))
      c.header('X-RateLimit-Remaining', String(Math.max(0, max - bucket.count)))
    }

    await next()
  }
}

export function resetRateLimits(): void {
  buckets.clear()
}

export function authRateLimit(): MiddlewareHandler<AppEnv> {
  return rateLimit(env.AUTH_RATE_LIMIT_MAX, env.RATE_LIMIT_WINDOW_MS, 'login')
}

export function sensitiveRateLimit(): MiddlewareHandler<AppEnv> {
  return rateLimit(
    Math.max(3, Math.floor(env.AUTH_RATE_LIMIT_MAX / 2)),
    env.RATE_LIMIT_WINDOW_MS,
    'auth',
  )
}
