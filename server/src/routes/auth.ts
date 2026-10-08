import { clientKey } from '../middleware/rate-limit.js'
import { OpenAPIHono, createRoute } from '@hono/zod-openapi'
import { deleteCookie, getCookie, setCookie } from 'hono/cookie'
import { z } from 'zod'
import { env } from '../env.js'
import { logger } from '../logger.js'
import { authRateLimit, sensitiveRateLimit } from '../middleware/rate-limit.js'
import { csrfProtection } from '../middleware/csrf.js'
import { requireAuth, requireAuthMiddleware } from '../middleware/auth.js'
import {
  authResponseSchema,
  changePasswordInputSchema,
  errorResponseSchema,
  forgotPasswordInputSchema,
  loginInputSchema,
  registerInputSchema,
  resetPasswordInputSchema,
  updateProfileInputSchema,
  userSchema,
} from '@aranya/shared'
import * as authService from '../services/auth.service.js'
import {
  DEVICE_COOKIE,
  REFRESH_COOKIE,
  SESSION_HINT_COOKIE,
  deviceToken,
  isTrustedDevice,
  refreshCookieOptions,
} from '../lib/tokens.js'
import { unauthorized } from '../http/errors.js'
import type { AppEnv } from '../http/context.js'

const COOKIE_SECURE = env.isProd

function refreshEnvelope(session: authService.IssuedSession) {
  return {
    accessToken: session.accessToken,
    tokenType: 'Bearer' as const,
    user: session.user,
    expiresIn: session.expiresIn,
  }
}

function requestMeta(c: Parameters<Parameters<OpenAPIHono<AppEnv>['openapi']>[1]>[0]) {
  return {
    userAgent: c.req.header('user-agent'),
    ip: clientKey(c),
  }
}

function bearer(c: { req: { header: (n: string) => string | undefined } }): string {
  const header = c.req.header('authorization')
  if (!header?.startsWith('Bearer ')) throw unauthorized('Sign in to continue', 'unauthorized')
  return header.slice(7).trim()
}

const errorResponses = {
  400: {
    description: 'Invalid request',
    content: { 'application/json': { schema: errorResponseSchema } },
  },
  401: {
    description: 'Not authenticated',
    content: { 'application/json': { schema: errorResponseSchema } },
  },
  403: {
    description: 'Forbidden',
    content: { 'application/json': { schema: errorResponseSchema } },
  },
  422: {
    description: 'Validation failed',
    content: { 'application/json': { schema: errorResponseSchema } },
  },
  429: {
    description: 'Rate limited',
    content: { 'application/json': { schema: errorResponseSchema } },
  },
} as const

const authPayload = {
  content: { 'application/json': { schema: authResponseSchema } },
}

const registerRoute = createRoute({
  middleware: authRateLimit(),
  method: 'post',
  path: '/api/auth/register',
  tags: ['auth'],
  summary: 'Create a customer account and start a session',
  request: { body: { content: { 'application/json': { schema: registerInputSchema } } } },
  responses: { 200: { description: 'Signed in', ...authPayload }, ...errorResponses },
})

const loginRoute = createRoute({
  middleware: authRateLimit(),
  method: 'post',
  path: '/api/auth/login',
  tags: ['auth'],
  summary: 'Exchange credentials for an access token and refresh cookie',
  request: { body: { content: { 'application/json': { schema: loginInputSchema } } } },
  responses: { 200: { description: 'Signed in', ...authPayload }, ...errorResponses },
})

const refreshRoute = createRoute({
  method: 'post',
  path: '/api/auth/refresh',
  tags: ['auth'],
  summary: 'Rotate the refresh token and mint a new access token',
  request: {
    body: { content: { 'application/json': { schema: z.object({}).optional() } } },
  },
  responses: { 200: { description: 'Rotated', ...authPayload }, ...errorResponses },
})

const logoutRoute = createRoute({
  method: 'post',
  path: '/api/auth/logout',
  tags: ['auth'],
  summary: 'Revoke the current refresh token',
  responses: {
    200: {
      description: 'Signed out',
      content: { 'application/json': { schema: z.object({ ok: z.literal(true) }) } },
    },
    ...errorResponses,
  },
})

const meRoute = createRoute({
  method: 'get',
  path: '/api/auth/me',
  tags: ['auth'],
  summary: 'Current session user',
  responses: { 200: { description: 'The signed-in user', ...authPayload }, ...errorResponses },
})

const profileRoute = createRoute({
  method: 'patch',
  path: '/api/auth/profile',
  tags: ['auth'],
  summary: 'Update name or phone',
  request: { body: { content: { 'application/json': { schema: updateProfileInputSchema } } } },
  responses: {
    200: { description: 'Updated', content: { 'application/json': { schema: userSchema } } },
    ...errorResponses,
  },
})

const passwordRoute = createRoute({
  middleware: sensitiveRateLimit(),
  method: 'post',
  path: '/api/auth/password',
  tags: ['auth'],
  summary: 'Change the password and revoke every session',
  request: { body: { content: { 'application/json': { schema: changePasswordInputSchema } } } },
  responses: {
    200: {
      description: 'Changed',
      content: { 'application/json': { schema: z.object({ ok: z.literal(true) }) } },
    },
    ...errorResponses,
  },
})

const forgotRoute = createRoute({
  middleware: sensitiveRateLimit(),
  method: 'post',
  path: '/api/auth/forgot-password',
  tags: ['auth'],
  summary: 'Request a password reset link',
  request: { body: { content: { 'application/json': { schema: forgotPasswordInputSchema } } } },
  responses: {
    200: {
      description: 'Always 200 so callers cannot probe which emails exist',
      content: { 'application/json': { schema: z.object({ ok: z.literal(true) }) } },
    },
    ...errorResponses,
  },
})

const resetRoute = createRoute({
  middleware: sensitiveRateLimit(),
  method: 'post',
  path: '/api/auth/reset-password',
  tags: ['auth'],
  summary: 'Complete a password reset',
  request: { body: { content: { 'application/json': { schema: resetPasswordInputSchema } } } },
  responses: {
    200: {
      description: 'Reset',
      content: { 'application/json': { schema: z.object({ ok: z.literal(true) }) } },
    },
    ...errorResponses,
  },
})

export function authRoutes(app: OpenAPIHono<AppEnv>) {
  app.use('/api/auth/*', csrfProtection)
  app.use('/api/auth/profile', requireAuthMiddleware)
  app.use('/api/auth/password', requireAuthMiddleware)

  app.openapi(registerRoute, async (c) => {
    const body = c.req.valid('json')
    const session = await authService.register(body, requestMeta(c))
    setRefreshCookie(c, session)
    setDeviceCookie(c, body.email)
    return c.json(refreshEnvelope(session), 200)
  })

  app.openapi(loginRoute, async (c) => {
    const body = c.req.valid('json')
    const trustedDevice = isTrustedDevice(body.email, getCookie(c, DEVICE_COOKIE))
    const session = await authService.login(body, { ...requestMeta(c), trustedDevice })
    setRefreshCookie(c, session)
    setDeviceCookie(c, body.email)
    return c.json(refreshEnvelope(session), 200)
  })

  app.openapi(refreshRoute, async (c) => {
    const token = getCookie(c, REFRESH_COOKIE)
    if (!token) throw unauthorized('No active session', 'no_session')

    const session = await authService.refresh(token, requestMeta(c))
    setRefreshCookie(c, session)
    return c.json(refreshEnvelope(session), 200)
  })

  app.openapi(logoutRoute, async (c) => {
    await authService.logout(getCookie(c, REFRESH_COOKIE))
    clearRefreshCookie(c)
    return c.json({ ok: true as const }, 200)
  })

  app.openapi(meRoute, async (c) => {
    const user = await authService.me(bearer(c))
    return c.json(
      {
        accessToken: bearer(c),
        tokenType: 'Bearer' as const,
        user,
        expiresIn: env.ACCESS_TOKEN_TTL,
      },
      200,
    )
  })

  app.openapi(profileRoute, async (c) => {
    const auth = requireAuth(c)
    const user = await authService.updateProfile(auth.sub, c.req.valid('json'))
    return c.json(user, 200)
  })

  app.openapi(passwordRoute, async (c) => {
    const auth = requireAuth(c)
    await authService.changePassword(auth.sub, c.req.valid('json'))
    clearRefreshCookie(c)
    return c.json({ ok: true as const }, 200)
  })

  app.openapi(forgotRoute, async (c) => {
    const { email } = c.req.valid('json')
    const issued = await authService.requestPasswordReset(email)

    if (issued) {
      // Console mail adapter: the link is a bearer credential, so it never reaches production logs.
      const link = env.isProd
        ? undefined
        : `${env.PUBLIC_APP_URL}/reset-password?token=${issued.token}`
      logger.info({ userId: issued.user.id, link }, 'password reset requested')
    }

    return c.json({ ok: true as const }, 200)
  })

  app.openapi(resetRoute, async (c) => {
    const { token, password } = c.req.valid('json')
    await authService.resetPassword(token, password)
    return c.json({ ok: true as const }, 200)
  })
}

/** The CSRF cookie is owned by securityHeaders; only the refresh cookie lives here. */
function setRefreshCookie(c: Parameters<typeof setCookie>[0], session: authService.IssuedSession) {
  setCookie(c, REFRESH_COOKIE, session.refreshToken, refreshCookieOptions(COOKIE_SECURE))
  setCookie(c, SESSION_HINT_COOKIE, '1', {
    ...refreshCookieOptions(COOKIE_SECURE),
    httpOnly: false,
    path: '/',
  })
}

function setDeviceCookie(c: Parameters<typeof setCookie>[0], email: string) {
  setCookie(c, DEVICE_COOKIE, deviceToken(email), {
    ...refreshCookieOptions(COOKIE_SECURE),
    maxAge: 180 * 86_400,
  })
}

function clearRefreshCookie(c: Parameters<typeof setCookie>[0]) {
  deleteCookie(c, REFRESH_COOKIE, { path: '/api/auth' })
  deleteCookie(c, SESSION_HINT_COOKIE, { path: '/' })
}
