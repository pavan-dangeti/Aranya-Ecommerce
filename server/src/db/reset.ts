import { sql } from 'drizzle-orm'
import { closePool, db } from './client.js'
import { runMigrations } from './migrate.js'
import { refreshAllRatings, runSeed } from './seed.js'
import { logger } from '../logger.js'
import { ensureSeedAdmin } from '../services/auth.service.js'

/**
 * Drops the migration ledger too. Without that, drizzle still believes the
 * migrations ran and `db:reset` silently leaves an empty database behind.
 */
await db.execute(sql`drop schema if exists drizzle cascade`)
await db.execute(sql`drop schema if exists public cascade`)
await db.execute(sql`create schema public`)

await runMigrations()
const counts = await runSeed()
await refreshAllRatings()

logger.info({ ...counts, adminCreated: await ensureSeedAdmin() }, 'database reset and seeded')
await closePool()
