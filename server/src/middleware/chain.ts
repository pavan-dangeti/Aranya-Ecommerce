import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { requestId } from 'hono/request-id'
import { bodyLimit } from 'hono/body-limit'
import { env } from '../env.js'
import { logger } from '../logger.js'
import type { AppEnv } from '../http/context.js'

export function applyMiddleware(app: Hono<AppEnv>) {
  app.use('*', requestId())

  app.use(
    '/api/*',
    cors({
      origin: (origin, c) => {
        if (!origin) return undefined
        if (env.corsOrigins.includes(origin)) return origin
        if (env.corsOrigins.includes('*')) return '*'
        void c
        return undefined
      },
      allowMethods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
      allowHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token', 'Idempotency-Key'],
      exposeHeaders: ['X-Request-Id'],
      credentials: true,
      maxAge: 600,
    }),
  )

  app.use(
    '/api/*',
    bodyLimit({
      maxSize: env.BODY_LIMIT_BYTES,
      onError: (c) =>
        c.json(
          {
            error: {
              code: 'payload_too_large',
              message: 'Request body is too large',
              requestId: c.get('requestId') ?? 'unknown',
            },
          },
          413,
        ),
    }),
  )

  app.use('*', async (c, next) => {
    const started = performance.now()
    await next()
    const ms = Math.round((performance.now() - started) * 100) / 100
    const level = c.res.status >= 500 ? 'error' : c.res.status >= 400 ? 'warn' : 'info'
    logger[level](
      {
        requestId: c.get('requestId'),
        method: c.req.method,
        path: new URL(c.req.url).pathname,
        status: c.res.status,
        durationMs: ms,
      },
      'request',
    )
  })
}
