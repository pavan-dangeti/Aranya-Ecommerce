import { afterAll, beforeEach } from 'vitest'
import { createApp } from '../src/app.js'
import { closePool, db } from '../src/db/client.js'
import { ensureSeedAdmin } from '../src/services/auth.service.js'
import { resetRateLimits } from '../src/middleware/rate-limit.js'
import { refreshAllRatings } from '../src/db/seed.js'
import { sql } from 'drizzle-orm'

export const app = createApp()

export const ADMIN = { email: 'admin@aranya.test', password: 'Admin-Test-Password-2026' }

const RESET_TABLES = `
  truncate table
    audit_logs, inventory_movements, order_items, orders, cart_items, carts,
    wishlists, addresses, reviews, products, ingredients, articles, testimonials,
    faqs, categories, password_reset_tokens, refresh_tokens, users
  restart identity cascade
`

beforeEach(async () => {
  await db.execute(sql.raw(RESET_TABLES))
  resetRateLimits()
  await seedCatalog()
  await ensureSeedAdmin()
  await refreshAllRatings()
})

afterAll(async () => {
  await closePool()
})

async function seedCatalog() {
  const { runSeed } = await import('../src/db/seed.js')
  await runSeed()
}

export interface Session {
  accessToken: string
  refreshCookie: string
  userId: string
  role: 'customer' | 'admin'
}

/** Talks to the Hono app in-process, so no port or network is involved. */
export async function request(
  path: string,
  init: RequestInit & { session?: Session; csrf?: boolean } = {},
): Promise<Response> {
  const headers = new Headers(init.headers)
  if (init.body && !headers.has('content-type')) headers.set('content-type', 'application/json')

  const session = init.session
  if (session) {
    headers.set('authorization', `Bearer ${session.accessToken}`)
    if (session.refreshCookie) headers.append('cookie', session.refreshCookie)
  }

  if (init.csrf !== false && init.method && init.method !== 'GET') {
    headers.set('x-csrf-token', TEST_CSRF)
    headers.append('cookie', `${CSRF_COOKIE}=${TEST_CSRF}`)
  }

  return app.fetch(new Request(`http://localhost/api${path}`, { ...init, headers }))
}

export const TEST_CSRF = 'test-csrf-token'
export const CSRF_COOKIE = 'aranya_csrf'

export async function json<T = unknown>(res: Response): Promise<T> {
  return (await res.json()) as T
}

export async function registerCustomer(email: string, password = 'Passw0rd!23'): Promise<Session> {
  const res = await request('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name: 'Test Customer', email, password }),
  })
  if (res.status !== 200) throw new Error(`register failed: ${res.status} ${await res.text()}`)
  return sessionFrom(res)
}

export async function loginAs(
  email: string,
  password: string,
  path = '/auth/login',
): Promise<Session> {
  const res = await request(path, { method: 'POST', body: JSON.stringify({ email, password }) })
  if (res.status !== 200) throw new Error(`login failed: ${res.status} ${await res.text()}`)
  return sessionFrom(res)
}

export async function loginAdmin(): Promise<Session> {
  return loginAs(ADMIN.email, ADMIN.password)
}

async function sessionFrom(res: Response): Promise<Session> {
  const body = (await res.json()) as {
    accessToken: string
    user: { id: string; role: 'customer' | 'admin' }
  }
  return {
    accessToken: body.accessToken,
    refreshCookie: refreshCookieFrom(res),
    userId: body.user.id,
    role: body.user.role,
  }
}

export function refreshCookieFrom(res: Response): string {
  const all = res.headers.getSetCookie()
  return (
    all.find((c) => c.startsWith('aranya_rt=') && !c.startsWith('aranya_rt=;'))?.split(';')[0] ?? ''
  )
}

export function clearedCookieNames(res: Response): string[] {
  return res.headers
    .getSetCookie()
    .filter((c) => /=\s*;/.test(c))
    .map((c) => c.split('=')[0] ?? '')
}

export async function errorOf(res: Response) {
  const body = (await res.json()) as {
    error: {
      code: string
      message: string
      requestId: string
      details?: Array<{ path: string; message: string }>
    }
  }
  return body.error
}

const VALID_ADDRESS = {
  fullName: 'Test Customer',
  email: 'buyer@example.com',
  phone: '9876543210',
  addressLine: '12 Test Street',
  city: 'Bengaluru',
  state: 'Karnataka',
  postalCode: '560001',
  country: 'India',
}

export function addressFor(email: string) {
  return { ...VALID_ADDRESS, email }
}

export function checkoutBody(key: string, overrides: Record<string, unknown> = {}) {
  return JSON.stringify({
    address: addressFor('buyer@example.com'),
    paymentMethod: 'upi',
    upiId: 'buyer@okaxis',
    idempotencyKey: key,
    ...overrides,
  })
}

export async function addToCart(session: Session, productId: string, qty: number) {
  const res = await request(`/cart/items/${productId}`, {
    method: 'PUT',
    session,
    body: JSON.stringify({ qty }),
  })
  if (res.status !== 200) throw new Error(`cart add failed: ${res.status} ${await res.text()}`)
}
