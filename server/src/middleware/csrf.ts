import type { Context, MiddlewareHandler } from 'hono'
import { env } from '../env.js'
import { forbidden } from '../http/errors.js'
import type { AppEnv } from '../http/context.js'

export const CSRF_COOKIE = 'aranya_csrf'

const SAFE = new Set(['GET', 'HEAD', 'OPTIONS'])

/**
 * Session-establishing endpoints are exempt: they create the ambient authority
 * rather than act with it, and a cold client has no CSRF cookie yet.
 */
const EXEMPT = ['/api/auth/login', '/api/auth/register', '/api/auth/refresh', '/api/auth/logout']

/**
 * Cookie-authenticated mutations are protected by a double-submit token and an
 * Origin check. Bearer-authenticated requests are exempt: they cannot be
 * triggered cross-site because the browser will not attach the token.
 */
export const csrfProtection: MiddlewareHandler<AppEnv> = async (c, next) => {
  const method = c.req.method.toUpperCase()
  if (SAFE.has(method)) return next()

  if (EXEMPT.includes(new URL(c.req.url).pathname)) return next()

  const origin = c.req.header('origin')
  if (origin && env.corsOrigins.length > 0 && !env.corsOrigins.includes(origin)) {
    throw forbidden('Cross-origin request rejected', 'csrf_failed')
  }

  if (c.req.header('authorization')?.startsWith('Bearer ')) return next()

  // Nothing to forge without credentials, and skipping lets the route's own guard
  // answer 401 instead of leaking a 403 that implies the endpoint exists.
  if (!c.req.header('authorization') && !c.req.header('cookie')) return next()

  const cookieToken = getCookie(c, CSRF_COOKIE)
  const headerToken = c.req.header('x-csrf-token')
  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    throw forbidden('CSRF token missing or invalid', 'csrf_failed')
  }

  await next()
}

function getCookie(c: Context<AppEnv>, name: string): string | undefined {
  const raw = c.req.header('cookie')
  if (!raw) return undefined
  for (const part of raw.split(';')) {
    const [k, ...rest] = part.trim().split('=')
    if (k === name) return decodeURIComponent(rest.join('='))
  }
  return undefined
}
