import { z } from 'zod'
import { config } from 'dotenv'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const here = path.dirname(fileURLToPath(import.meta.url))
const serverRoot = path.resolve(here, '..')
const repoRoot = path.resolve(serverRoot, '..')

// Repo-level .env is the default; a server-local .env overrides it.
config({ path: path.join(repoRoot, '.env') })
config({ path: path.join(serverRoot, '.env'), override: true })

const boolish = z
  .union([z.boolean(), z.string()])
  .transform((v) =>
    typeof v === 'boolean' ? v : ['1', 'true', 'yes', 'on'].includes(v.toLowerCase()),
  )

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(8787),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),

  DATABASE_URL: z.string().url('DATABASE_URL must be a postgres connection string'),
  TEST_DATABASE_URL: z.string().url().optional(),

  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  ACCESS_TOKEN_TTL: z.coerce.number().int().min(60).default(900),
  REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().min(1).max(365).default(30),
  COOKIE_DOMAIN: z.string().optional(),
  /**
   * `lax` keeps the refresh cookie same-site, which is the tighter default and
   * correct behind the Vercel `/api` rewrite. Set to `none` only if the SPA calls
   * an API on another site directly — browsers then require `Secure`, and CORS
   * must allow the frontend origin.
   */
  COOKIE_SAME_SITE: z.enum(['lax', 'none']).default('lax'),

  CORS_ORIGINS: z.string().default('http://localhost:5173'),

  SEED_ADMIN_EMAIL: z.email().optional(),
  SEED_ADMIN_PASSWORD: z.string().min(12).optional(),
  SEED_DEMO_PASSWORD: z.string().min(8).optional(),
  RUN_MIGRATIONS: boolish.default(false),

  PAYMENT_PROVIDER: z.enum(['simulated', 'razorpay']).default('simulated'),
  RAZORPAY_KEY_ID: z.string().optional(),
  RAZORPAY_KEY_SECRET: z.string().optional(),
  RAZORPAY_WEBHOOK_SECRET: z.string().optional(),

  BODY_LIMIT_BYTES: z.coerce.number().int().min(1024).default(131_072),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().min(1000).default(60_000),
  RATE_LIMIT_MAX: z.coerce.number().int().min(1).default(120),
  AUTH_RATE_LIMIT_MAX: z.coerce.number().int().min(1).default(10),

  // Proxies between the internet and this process. 0 = trust no forwarding headers.
  TRUST_PROXY_HOPS: z.coerce.number().int().min(0).max(5).default(0),
  MAIL_ADAPTER: z.enum(['console', 'smtp']).default('console'),
  PUBLIC_APP_URL: z.url().default('http://localhost:5173'),
})

const parsed = envSchema.safeParse(process.env)

if (!parsed.success) {
  const issues = parsed.error.issues.map((i) => `  ${i.path.join('.')}: ${i.message}`).join('\n')
  throw new Error(
    `Invalid environment configuration:\n${issues}\n\nCopy .env.example to .env and fill it in.`,
  )
}

const raw = parsed.data

if (raw.PAYMENT_PROVIDER === 'razorpay' && !(raw.RAZORPAY_KEY_ID && raw.RAZORPAY_KEY_SECRET)) {
  throw new Error('PAYMENT_PROVIDER=razorpay requires RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.')
}

if (raw.NODE_ENV === 'production' && raw.JWT_SECRET.startsWith('replace-me')) {
  throw new Error(
    'JWT_SECRET still holds the placeholder value. Generate one with: openssl rand -base64 48',
  )
}

export const env = {
  ...raw,
  isProd: raw.NODE_ENV === 'production',
  isTest: raw.NODE_ENV === 'test',
  corsOrigins: raw.CORS_ORIGINS.split(',')
    .map((o) => o.trim())
    .filter(Boolean),
  databaseUrl:
    raw.TEST_DATABASE_URL && raw.NODE_ENV === 'test' ? raw.TEST_DATABASE_URL : raw.DATABASE_URL,
} as const
