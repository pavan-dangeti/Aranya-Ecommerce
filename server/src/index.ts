import { serve, type ServerType } from '@hono/node-server'
import { createApp } from './app.js'
import { closePool } from './db/client.js'
import { env } from './env.js'
import { logger } from './logger.js'
import { ensureSeedAdmin, purgeExpiredTokens } from './services/auth.service.js'
import { runMigrations } from './db/migrate.js'

// Render's free plan has no pre-deploy hook, so the container can migrate itself.
if (env.RUN_MIGRATIONS) {
  await runMigrations()
  logger.info('migrations applied')
}

const app = createApp()

const server = serve({ fetch: app.fetch, port: env.PORT }, (info) => {
  logger.info({ port: info.port, env: env.NODE_ENV }, 'aranya-api listening')
})

if (env.SEED_ADMIN_EMAIL && env.SEED_ADMIN_PASSWORD) {
  try {
    const created = await ensureSeedAdmin()
    if (created) logger.info({ email: env.SEED_ADMIN_EMAIL }, 'seeded admin account')
  } catch (err) {
    logger.error({ err }, 'failed to seed admin account')
  }
}

const sweeper = setInterval(() => {
  purgeExpiredTokens().catch((err) => logger.warn({ err }, 'token sweep failed'))
}, 60 * 60_000)
sweeper.unref()

let shuttingDown = false

async function shutdown(signal: string) {
  if (shuttingDown) return
  shuttingDown = true
  logger.info({ signal }, 'shutting down')

  const force = setTimeout(() => {
    logger.error('graceful shutdown timed out, forcing exit')
    process.exit(1)
  }, 10_000)
  force.unref()

  await closeServer(server)
  await closePool().catch((err) => logger.error({ err }, 'error closing database pool'))

  clearTimeout(force)
  process.exit(0)
}

function closeServer(instance: ServerType): Promise<void> {
  return new Promise((resolve) => instance.close(() => resolve()))
}

process.on('SIGTERM', () => void shutdown('SIGTERM'))
process.on('SIGINT', () => void shutdown('SIGINT'))
process.on('unhandledRejection', (reason) => logger.error({ reason }, 'unhandled rejection'))
process.on('uncaughtException', (err) => {
  logger.fatal({ err }, 'uncaught exception, exiting')
  process.exit(1)
})
