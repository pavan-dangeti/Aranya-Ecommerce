import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres'
import pg from 'pg'
import { env } from '../env.js'
import { logger } from '../logger.js'
import * as schema from './schema.js'

const pool = new pg.Pool({
  connectionString: env.databaseUrl,
  max: env.isProd ? 10 : 5,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 10_000,
  ...(env.isProd ? { ssl: { rejectUnauthorized: false } } : {}),
})

pool.on('error', (err) => logger.error({ err }, 'unexpected idle client error'))

export const db: NodePgDatabase<typeof schema> = drizzle(pool, { schema })

export type Db = typeof db
export type Tx = Parameters<Parameters<Db['transaction']>[0]>[0]

export async function pingDatabase(): Promise<boolean> {
  try {
    await pool.query('select 1')
    return true
  } catch {
    return false
  }
}

export async function closePool(): Promise<void> {
  await pool.end()
}
