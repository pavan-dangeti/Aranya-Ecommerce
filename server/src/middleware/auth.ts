import type { Context, MiddlewareHandler } from 'hono'
import { verifyAccessToken } from '../lib/tokens.js'
import { forbidden, unauthorized } from '../http/errors.js'
import type { AppEnv } from '../http/context.js'

/** Populates `auth` when a valid access token is present; never rejects. */
export const optionalAuth: MiddlewareHandler<AppEnv> = async (c, next) => {
  const header = c.req.header('authorization')
  if (header?.startsWith('Bearer ')) {
    try {
      c.set('auth', await verifyAccessToken(header.slice(7).trim()))
    } catch {
      c.set('auth', null)
    }
  } else {
    c.set('auth', null)
  }
  await next()
}

export function requireAuth(c: Context<AppEnv>): NonNullable<Context<AppEnv>['var']['auth']> {
  const auth = c.get('auth')
  if (!auth) throw unauthorized('Sign in to continue', 'unauthorized')
  return auth
}

function requireAdmin(c: Context<AppEnv>): NonNullable<Context<AppEnv>['var']['auth']> {
  const auth = requireAuth(c)
  if (auth.role !== 'admin') throw forbidden('Administrator access required', 'forbidden')
  return auth
}

/** Applied to the whole /api/admin surface so no handler can forget to check. */
export const requireAdminMiddleware: MiddlewareHandler<AppEnv> = async (c, next) => {
  requireAdmin(c)
  await next()
}

/** Runs ahead of request-body validation so an anonymous caller gets 401, not 422. */
export const requireAuthMiddleware: MiddlewareHandler<AppEnv> = async (c, next) => {
  requireAuth(c)
  await next()
}
