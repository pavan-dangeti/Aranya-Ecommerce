import { execFileSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(here, '../..')

const testDatabaseUrl =
  process.env.TEST_DATABASE_URL ?? 'postgresql://aranya:aranya@localhost:55432/aranya_test'

process.env.NODE_ENV = 'test'
process.env.DATABASE_URL = testDatabaseUrl
process.env.TEST_DATABASE_URL = testDatabaseUrl
process.env.JWT_SECRET = 'test-secret-value-that-is-definitely-long-enough-32'
process.env.LOG_LEVEL = 'silent'
process.env.CORS_ORIGINS = 'http://localhost:5173'
// Pin it so a developer's local .env cannot change what the suite asserts.
process.env.COOKIE_SAME_SITE = 'lax'
process.env.ACCESS_TOKEN_TTL = '900'
process.env.RATE_LIMIT_MAX = '1000'
process.env.AUTH_RATE_LIMIT_MAX = '10'
process.env.PAYMENT_PROVIDER = 'simulated'
process.env.SEED_ADMIN_EMAIL = 'admin@aranya.test'
process.env.SEED_ADMIN_PASSWORD = 'Admin-Test-Password-2026'
process.env.PUBLIC_APP_URL = 'http://localhost:5173'

export default async function globalSetup() {
  execFileSync('npm', ['run', 'build', '-w', '@aranya/shared'], { cwd: repoRoot, stdio: 'inherit' })
  execFileSync('npm', ['run', 'build', '-w', '@aranya/data'], { cwd: repoRoot, stdio: 'inherit' })

  execFileSync('npx', ['tsx', 'server/src/db/migrate.ts'], {
    cwd: repoRoot,
    stdio: 'inherit',
    env: { ...process.env },
  })
  execFileSync('npx', ['tsx', 'server/src/db/seed.ts'], {
    cwd: repoRoot,
    stdio: 'inherit',
    env: { ...process.env },
  })
}
