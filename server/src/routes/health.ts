import { OpenAPIHono, createRoute } from '@hono/zod-openapi'
import { z } from 'zod'
import { pingDatabase } from '../db/client.js'
import type { AppEnv } from '../http/context.js'

const healthRoute = createRoute({
  method: 'get',
  path: '/api/health',
  tags: ['ops'],
  summary: 'Liveness probe',
  responses: {
    200: {
      description: 'Process is up',
      content: {
        'application/json': {
          schema: z.object({ status: z.literal('ok'), uptime: z.number() }),
        },
      },
    },
  },
})

const readyRoute = createRoute({
  method: 'get',
  path: '/api/health/ready',
  tags: ['ops'],
  summary: 'Readiness probe including the database',
  responses: {
    200: {
      description: 'Ready to serve traffic',
      content: {
        'application/json': {
          schema: z.object({ status: z.literal('ready'), database: z.literal('up') }),
        },
      },
    },
    503: {
      description: 'A dependency is unavailable',
      content: {
        'application/json': {
          schema: z.object({ status: z.literal('degraded'), database: z.literal('down') }),
        },
      },
    },
  },
})

export function healthRoutes(app: OpenAPIHono<AppEnv>) {
  app.openapi(healthRoute, (c) =>
    c.json({ status: 'ok' as const, uptime: Math.round(process.uptime() * 1000) / 1000 }),
  )

  app.openapi(readyRoute, async (c) => {
    const database = await pingDatabase()
    if (!database) {
      return c.json({ status: 'degraded', database: 'down' } as const, 503)
    }
    return c.json({ status: 'ready', database: 'up' } as const, 200)
  })
}
