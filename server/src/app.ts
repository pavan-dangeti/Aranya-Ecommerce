import type { MiddlewareHandler } from 'hono'
import { OpenAPIHono, createRoute } from '@hono/zod-openapi'
import { getCookie, setCookie } from 'hono/cookie'
import { Scalar } from '@scalar/hono-api-reference'
import { z } from 'zod'
import { env } from './env.js'
import { applyMiddleware } from './middleware/chain.js'
import { optionalAuth, requireAdminMiddleware } from './middleware/auth.js'
import { csrfProtection, CSRF_COOKIE } from './middleware/csrf.js'
import { rateLimit } from './middleware/rate-limit.js'
import { notFoundHandler, onError } from './http/errors.js'
import { healthRoutes } from './routes/health.js'
import { authRoutes } from './routes/auth.js'
import { catalogRoutes } from './routes/catalog.js'
import { commerceRoutes } from './routes/commerce.js'
import { adminRoutes } from './routes/admin.js'
import { paymentProvider } from './services/payment/index.js'
import type { AppEnv } from './http/context.js'

const metaRoute = createRoute({
  method: 'get',
  path: '/api',
  tags: ['meta'],
  summary: 'API metadata',
  responses: {
    200: {
      description: 'Service metadata',
      content: {
        'application/json': {
          schema: z.object({
            name: z.string(),
            version: z.string(),
            environment: z.string(),
            paymentProvider: z.string(),
            docs: z.string(),
          }),
        },
      },
    },
  },
})

export function createApp() {
  const app = new OpenAPIHono<AppEnv>({
    strict: false,
    defaultHook: (result, c) => {
      if (result.success) return undefined
      return c.json(
        {
          error: {
            code: 'validation_failed',
            message: 'Some fields need attention',
            requestId: c.get('requestId') ?? 'unknown',
            details: result.error.issues.map((i) => ({
              path: i.path.map(String).join('.') || '_',
              message: i.message,
            })),
          },
        },
        422,
      )
    },
  })

  app.onError(onError)
  app.notFound(notFoundHandler)

  applyMiddleware(app)

  app.use('/api/*', securityHeaders)
  app.use('/api/auth/*', optionalAuth)
  app.use('/api/cart/*', optionalAuth)
  app.use('/api/wishlist/*', optionalAuth)
  app.use('/api/addresses/*', optionalAuth)
  app.use('/api/orders/*', optionalAuth)
  app.use('/api/reviews', optionalAuth)
  app.use('/api/reviews/*', optionalAuth)
  app.use('/api/admin/*', optionalAuth)
  app.use('/api/admin/*', csrfProtection)
  app.use('/api/admin/*', requireAdminMiddleware)
  app.use('/api/admin/*', rateLimit(env.RATE_LIMIT_MAX, env.RATE_LIMIT_WINDOW_MS, 'admin'))

  app.openapi(metaRoute, (c) =>
    c.json({
      name: 'aranya-api',
      version: '2.0.0',
      environment: env.NODE_ENV,
      paymentProvider: paymentProvider().name,
      docs: '/docs',
    }),
  )

  healthRoutes(app)
  authRoutes(app)
  catalogRoutes(app)
  commerceRoutes(app)
  adminRoutes(app)

  app.get('/docs', Scalar({ url: '/api/openapi.json', theme: 'purple' }))

  app.doc31('/api/openapi.json', {
    openapi: '3.1.0',
    info: {
      title: 'ARANYA API',
      version: '2.0.0',
      description:
        'Server-authoritative commerce API for ARANYA. Prices, shipping, stock and role checks are always decided here.',
    },
    servers: [{ url: env.PUBLIC_APP_URL.replace(/\/$/, '') }],
    tags: [
      { name: 'meta', description: 'Service metadata' },
      { name: 'auth', description: 'Sessions, profile and password reset' },
      { name: 'catalog', description: 'Products, categories, ingredients, journal' },
      { name: 'reviews', description: 'Approved reviews and moderation intake' },
      { name: 'cart', description: 'Server cart and guest cart merge' },
      { name: 'wishlist', description: 'Saved products' },
      { name: 'addresses', description: 'Saved delivery addresses' },
      { name: 'orders', description: 'Checkout and order history' },
      { name: 'admin', description: 'Operations console. Admin role enforced server-side.' },
      { name: 'ops', description: 'Liveness and readiness probes' },
    ],
  })

  return app
}

const securityHeaders: MiddlewareHandler<AppEnv> = async (c, next) => {
  c.header('X-Content-Type-Options', 'nosniff')
  c.header('X-Frame-Options', 'DENY')
  c.header('Referrer-Policy', 'strict-origin-when-cross-origin')
  c.header('Permissions-Policy', 'geolocation=(), microphone=(), camera=()')
  c.header('Cross-Origin-Resource-Policy', 'same-site')
  c.header(
    'Content-Security-Policy',
    "default-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'",
  )

  if (env.isProd) {
    c.header('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload')
  }

  if (!getCookie(c, CSRF_COOKIE)) {
    setCookie(c, CSRF_COOKIE, crypto.randomUUID(), {
      httpOnly: false,
      secure: env.isProd,
      sameSite: 'Lax',
      path: '/',
      maxAge: env.REFRESH_TOKEN_TTL_DAYS * 86_400,
      ...(env.COOKIE_DOMAIN ? { domain: env.COOKIE_DOMAIN } : {}),
    })
  }

  await next()
}
