import { migrate } from 'drizzle-orm/node-postgres/migrator'
import { db, closePool } from './client.js'
import { logger } from '../logger.js'

export async function runMigrations() {
  await migrate(db, { migrationsFolder: new URL('../../drizzle', import.meta.url).pathname })
}

if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    await runMigrations()
    logger.info('migrations applied')
    await closePool()
    process.exit(0)
  } catch (err) {
    logger.error({ err }, 'migration failed')
    await closePool().catch(() => undefined)
    process.exit(1)
  }
}
