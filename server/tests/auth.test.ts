import { describe, expect, it } from 'vitest'
import { eq } from 'drizzle-orm'
import { refreshCookieOptions } from '../src/lib/tokens.js'
import { clientKey } from '../src/middleware/rate-limit.js'
import * as authService from '../src/services/auth.service.js'
import { db } from '../src/db/client.js'
import { refreshTokens, users } from '../src/db/schema.js'
import {
  ADMIN,
  addToCart,
  clearedCookieNames,
  errorOf,
  json,
  loginAdmin,
  loginAs,
  refreshCookieFrom,
  registerCustomer,
  request,
} from './setup.js'

describe('registration', () => {
  it('creates a customer and returns an access token', async () => {
    const session = await registerCustomer('new@example.com')
    expect(session.role).toBe('customer')
    expect(session.accessToken.split('.')).toHaveLength(3)
  })

  it('never returns the password hash or the password', async () => {
    const res = await request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Hash Check',
        email: 'hash@example.com',
        password: 'Passw0rd!23',
      }),
    })
    const raw = await res.text()
    expect(raw).not.toContain('Passw0rd!23')
    expect(raw).not.toContain('argon2')
  })

  it('stores the email lowercased', async () => {
    await registerCustomer('MixedCase@Example.com')
    const rows = await db.select().from(users).where(eq(users.email, 'mixedcase@example.com'))
    expect(rows).toHaveLength(1)
  })

  it('rejects a duplicate email regardless of case', async () => {
    await registerCustomer('dupe@example.com')
    const res = await request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name: 'Dupe', email: 'DUPE@example.com', password: 'Passw0rd!23' }),
    })
    expect(res.status).toBe(409)
    expect((await errorOf(res)).code).toBe('email_taken')
  })

  it('rejects a weak password with field-level detail', async () => {
    const res = await request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name: 'Weak', email: 'weak@example.com', password: 'short' }),
    })
    expect(res.status).toBe(422)
    const error = await errorOf(res)
    expect(error.code).toBe('validation_failed')
    expect(error.details?.map((d) => d.path)).toContain('password')
  })

  it('rejects a malformed email', async () => {
    const res = await request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name: 'Bad', email: 'not-an-email', password: 'Passw0rd!23' }),
    })
    expect(res.status).toBe(422)
    expect((await errorOf(res)).details?.map((d) => d.path)).toContain('email')
  })
})

describe('login', () => {
  it('accepts correct credentials', async () => {
    await registerCustomer('login@example.com')
    const session = await loginAs('login@example.com', 'Passw0rd!23')
    expect(session.role).toBe('customer')
  })

  it('sets an httpOnly, Lax, path-scoped refresh cookie', async () => {
    await registerCustomer('login@example.com')
    const res = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'login@example.com', password: 'Passw0rd!23' }),
    })
    const cookie = res.headers.getSetCookie().find((c) => c.startsWith('aranya_rt='))
    expect(cookie).toBeDefined()
    expect(cookie).toContain('HttpOnly')
    expect(cookie).toContain('SameSite=Lax')
    expect(cookie).toContain('Path=/api/auth')
  })

  // A cross-site API (Vercel frontend, Render API) cannot use SameSite=Lax:
  // the browser withholds the cookie on every XHR, so the silent refresh fails
  // and the user is signed out on the next page load.
  it('only produces a cross-site cookie when asked for one', () => {
    expect(refreshCookieOptions(true).sameSite).toBe('Lax')
    expect(refreshCookieOptions(false).secure).toBe(false)

    const crossSite = refreshCookieOptions(false, 'none')
    expect(crossSite.sameSite).toBe('None')
    // Browsers only accept SameSite=None when Secure is also set, even in dev.
    expect(crossSite.secure).toBe(true)
  })

  it('rejects a wrong password without revealing which field failed', async () => {
    await registerCustomer('wrong@example.com')
    const res = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'wrong@example.com', password: 'Wr0ngPass!' }),
    })
    expect(res.status).toBe(401)
    expect((await errorOf(res)).message).toBe('Invalid email or password')
  })

  it('gives an unknown email the same message as a wrong password', async () => {
    const res = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'ghost@example.com', password: 'Passw0rd!23' }),
    })
    expect(res.status).toBe(401)
    expect((await errorOf(res)).message).toBe('Invalid email or password')
  })

  it('locks the account after repeated failures', async () => {
    await registerCustomer('lock@example.com')
    for (let i = 0; i < 8; i++) {
      await request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: 'lock@example.com', password: 'nope' }),
      })
    }
    const res = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'lock@example.com', password: 'Passw0rd!23' }),
    })
    expect(res.status).toBe(429)
  })

  it('clears the failure counter after a success', async () => {
    await registerCustomer('reset@example.com')
    const meta = { ip: '203.0.113.7' }
    const attempt = (password: string) =>
      authService.login({ email: 'reset@example.com', password }, meta).then(
        () => 'ok',
        (err: { status?: number }) => err.status,
      )
    for (let i = 0; i < 7; i++) expect(await attempt('nope')).toBe(401)
    expect(await attempt('Passw0rd!23')).toBe('ok')
    for (let i = 0; i < 7; i++) expect(await attempt('nope')).toBe(401)
    expect(await attempt('Passw0rd!23')).toBe('ok')
  })

  it('a stranger hammering an account cannot lock its owner out', async () => {
    await registerCustomer('victim@example.com')
    for (let i = 0; i < 12; i++) {
      await authService
        .login({ email: 'victim@example.com', password: 'nope' }, { ip: '198.51.100.66' })
        .catch(() => undefined)
    }
    await expect(
      authService.login({ email: 'victim@example.com', password: 'nope' }, { ip: '198.51.100.66' }),
    ).rejects.toMatchObject({ status: 429 })
    await expect(
      authService.login(
        { email: 'victim@example.com', password: 'Passw0rd!23' },
        { ip: '203.0.113.20' },
      ),
    ).resolves.toMatchObject({ user: { email: 'victim@example.com' } })
  })

  it('throttles unknown emails the same way, so a 429 reveals nothing', async () => {
    const statuses: Array<number | undefined> = []
    for (let i = 0; i < 9; i++) {
      statuses.push(
        await authService
          .login({ email: 'nobody@example.com', password: 'nope' }, { ip: '198.51.100.9' })
          .then(
            () => 200,
            (err: { status?: number }) => err.status,
          ),
      )
    }
    expect(statuses.slice(0, 8).every((s) => s === 401)).toBe(true)
    expect(statuses[8]).toBe(429)
  })
})

describe('refresh rotation', () => {
  it('issues a different refresh token each time', async () => {
    const session = await registerCustomer('rotate@example.com')
    const first = refreshCookieFrom(
      await request('/auth/refresh', { method: 'POST', body: '{}', session }),
    )
    const second = refreshCookieFrom(
      await request('/auth/refresh', {
        method: 'POST',
        body: '{}',
        session: { ...session, refreshCookie: first },
      }),
    )
    expect(second).not.toBe(first)
  })

  it('keeps the refresh token valid for the family', async () => {
    const session = await registerCustomer('family@example.com')
    const next = refreshCookieFrom(
      await request('/auth/refresh', { method: 'POST', body: '{}', session }),
    )
    const res = await request('/auth/refresh', {
      method: 'POST',
      body: '{}',
      session: { ...session, refreshCookie: next },
    })
    expect(res.status).toBe(200)
  })

  it('rejects an unknown refresh token', async () => {
    const res = await request('/auth/refresh', {
      method: 'POST',
      body: '{}',
      session: {
        accessToken: '',
        refreshCookie: 'aranya_rt=made-up-token',
        userId: '',
        role: 'customer',
      },
    })
    expect(res.status).toBe(401)
  })

  it('refuses a request with no refresh cookie at all', async () => {
    const res = await request('/auth/refresh', { method: 'POST', body: '{}' })
    expect(res.status).toBe(401)
  })
})

describe('refresh token reuse detection', () => {
  it('kills the whole family when an already-rotated token is replayed', async () => {
    const session = await registerCustomer('reuse@example.com')
    const original = refreshCookieFrom(
      await request('/auth/refresh', { method: 'POST', body: '{}', session }),
    )
    const rotated = refreshCookieFrom(
      await request('/auth/refresh', {
        method: 'POST',
        body: '{}',
        session: { ...session, refreshCookie: original },
      }),
    )

    const replay = await request('/auth/refresh', {
      method: 'POST',
      body: '{}',
      session: { ...session, refreshCookie: original },
    })
    expect(replay.status).toBe(401)
    expect((await errorOf(replay)).code).toBe('refresh_reuse_detected')

    const afterKill = await request('/auth/refresh', {
      method: 'POST',
      body: '{}',
      session: { ...session, refreshCookie: rotated },
    })
    expect(afterKill.status).toBe(401)
  })

  it('marks every token in the family as revoked', async () => {
    const session = await registerCustomer('familykill@example.com')
    const original = refreshCookieFrom(
      await request('/auth/refresh', { method: 'POST', body: '{}', session }),
    )
    await request('/auth/refresh', {
      method: 'POST',
      body: '{}',
      session: { ...session, refreshCookie: original },
    })
    await request('/auth/refresh', { method: 'POST', body: '{}', session })

    const rows = await db
      .select()
      .from(refreshTokens)
      .where(eq(refreshTokens.userId, session.userId))
    expect(rows.length).toBeGreaterThan(0)
    expect(rows.every((r) => r.revokedAt !== null)).toBe(true)
  })
})

describe('logout', () => {
  it('invalidates the refresh cookie', async () => {
    const session = await registerCustomer('logout@example.com')
    await request('/auth/logout', { method: 'POST', body: '{}', session })
    const res = await request('/auth/refresh', { method: 'POST', body: '{}', session })
    expect(res.status).toBe(401)
  })

  it('clears the cookie on the response', async () => {
    const session = await registerCustomer('logoutclear@example.com')
    const res = await request('/auth/logout', { method: 'POST', body: '{}', session })
    expect(refreshCookieFrom(res)).toBe('')
    expect(clearedCookieNames(res)).toContain('aranya_rt')
    expect(clearedCookieNames(res)).toContain('aranya_session')
  })

  it('pairs the refresh cookie with a secret-free, readable session hint', async () => {
    const res = await request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name: 'Hint', email: 'hint@example.com', password: 'Passw0rd!23' }),
    })
    const hint = res.headers.getSetCookie().find((c) => c.startsWith('aranya_session='))
    expect(hint).toMatch(/^aranya_session=1;/)
    expect(hint).not.toMatch(/HttpOnly/i)
    expect(hint).toMatch(/Path=\//)
  })
})

describe('role enforcement', () => {
  it('refuses every admin route without a token', async () => {
    for (const path of [
      '/admin/dashboard',
      '/admin/products',
      '/admin/orders',
      '/admin/customers',
      '/admin/reviews',
      '/admin/inventory/low-stock',
      '/admin/audit',
    ]) {
      const res = await request(path)
      expect(res.status, `${path} should be unauthorised`).toBe(401)
    }
  })

  it('refuses every admin route for a customer, even with a valid token', async () => {
    const customer = await registerCustomer('notadmin@example.com')
    for (const path of ['/admin/dashboard', '/admin/products', '/admin/orders', '/admin/audit']) {
      const res = await request(path, { session: customer })
      expect(res.status, `${path} should be forbidden`).toBe(403)
    }
  })

  it('refuses admin writes for a customer', async () => {
    const customer = await registerCustomer('notadminwrite@example.com')
    const res = await request('/admin/products/arn-001', {
      method: 'PATCH',
      session: customer,
      body: JSON.stringify({ price: 1 }),
    })
    expect(res.status).toBe(403)
  })

  it('allows an admin through', async () => {
    const admin = await loginAdmin()
    const res = await request('/admin/dashboard', { session: admin })
    expect(res.status).toBe(200)
  })

  it('ignores a forged access token', async () => {
    const forged = [
      Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url'),
      Buffer.from(JSON.stringify({ sub: 'someone', role: 'admin' })).toString('base64url'),
      'not-a-real-signature',
    ].join('.')
    const res = await request('/admin/dashboard', {
      session: { accessToken: forged, refreshCookie: '', userId: 'someone', role: 'admin' },
    })
    expect(res.status).toBe(401)
  })

  it('rejects an admin role claim signed for the wrong audience', async () => {
    const res = await request('/admin/dashboard', {
      session: {
        accessToken: `${btoa('{"alg":"none"}')}.${btoa('{"role":"admin","sub":"x"}')}.`,
        refreshCookie: '',
        userId: 'x',
        role: 'admin',
      },
    })
    expect(res.status).toBe(401)
  })
})

describe('rate limiting', () => {
  it('limits login attempts', async () => {
    await registerCustomer('rl@example.com')
    let limited = false
    for (let i = 0; i < 15; i++) {
      const res = await request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: 'rl@example.com', password: 'nope' }),
      })
      if (res.status === 429) {
        limited = true
        expect((await errorOf(res)).code).toBe('rate_limited')
        break
      }
    }
    expect(limited).toBe(true)
  })

  it('cannot be bypassed by rotating X-Forwarded-For', async () => {
    await registerCustomer('spoof@example.com')
    const statuses: number[] = []
    for (let i = 0; i < 15; i++) {
      const res = await request('/auth/login', {
        method: 'POST',
        headers: { 'x-forwarded-for': `203.0.113.${i}`, 'x-real-ip': `198.51.100.${i}` },
        body: JSON.stringify({ email: 'spoof@example.com', password: 'nope' }),
      })
      statuses.push(res.status)
    }
    expect(statuses).toContain(429)
  })

  it('takes the client address from the trusted proxy hop, not the spoofable left side', () => {
    const ctx = (xff: string) =>
      ({ req: { header: () => xff } }) as unknown as Parameters<typeof clientKey>[0]
    expect(clientKey(ctx('6.6.6.6, 203.0.113.9, 76.76.21.1'), 2)).toBe('203.0.113.9')
    expect(clientKey(ctx('203.0.113.9'), 1)).toBe('203.0.113.9')
    expect(clientKey(ctx(''), 2)).toBe('unknown')
    expect(clientKey(ctx('6.6.6.6, 203.0.113.9'), 0)).toBe('local')
  })
})

describe('password reset', () => {
  it('always returns ok so emails cannot be probed', async () => {
    const known = await request('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email: 'known@example.com' }),
    })
    const unknown = await request('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email: 'nobody@example.com' }),
    })
    expect(known.status).toBe(200)
    expect(unknown.status).toBe(200)
    expect(await known.json()).toEqual(await unknown.json())
  })

  it('rejects an invalid reset token', async () => {
    const res = await request('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token: 'obviously-not-valid', password: 'NewPassw0rd!' }),
    })
    expect(res.status).toBe(400)
  })

  it('changes the password and revokes every existing session', async () => {
    const original = await registerCustomer('resetflow@example.com')
    const { issueResetTokenForTest } = await import('./reset-helper.js')
    const token = await issueResetTokenForTest('resetflow@example.com')

    const res = await request('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, password: 'BrandNewPass1!' }),
    })
    expect(res.status).toBe(200)

    const stale = await request('/auth/refresh', { method: 'POST', body: '{}', session: original })
    expect(stale.status).toBe(401)

    const fresh = await loginAs('resetflow@example.com', 'BrandNewPass1!')
    expect(fresh.role).toBe('customer')
  })

  it('cannot reuse a consumed reset token', async () => {
    await registerCustomer('resetreuse@example.com')
    const { issueResetTokenForTest } = await import('./reset-helper.js')
    const token = await issueResetTokenForTest('resetreuse@example.com')

    const first = await request('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, password: 'BrandNewPass1!' }),
    })
    expect(first.status).toBe(200)

    const second = await request('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, password: 'YetAnother9!' }),
    })
    expect(second.status).toBe(400)
  })
})

describe('profile and password change', () => {
  it('updates the name', async () => {
    const session = await registerCustomer('profile@example.com')
    const res = await request('/auth/profile', {
      method: 'PATCH',
      session,
      body: JSON.stringify({ name: 'Renamed Person' }),
    })
    expect((await json<{ name: string }>(res)).name).toBe('Renamed Person')
  })

  it('refuses a profile update with no token before validating the body', async () => {
    const res = await request('/auth/profile', {
      method: 'PATCH',
      body: JSON.stringify({ name: 'valid-but-anonymous' }),
    })
    expect(res.status).toBe(401)
  })

  it('revokes every session after a password change', async () => {
    const session = await registerCustomer('pwchange@example.com')
    await request('/auth/password', {
      method: 'POST',
      session,
      body: JSON.stringify({ currentPassword: 'Passw0rd!23', newPassword: 'Different9!' }),
    })
    const res = await request('/auth/refresh', { method: 'POST', body: '{}', session })
    expect(res.status).toBe(401)
  })

  it('rejects the wrong current password', async () => {
    const session = await registerCustomer('pwwrong@example.com')
    const res = await request('/auth/password', {
      method: 'POST',
      session,
      body: JSON.stringify({ currentPassword: 'WrongPass1!', newPassword: 'Different9!' }),
    })
    expect(res.status).toBe(400)
  })
})

describe('seeded admin', () => {
  it('exists only once', async () => {
    const first = await loginAs(ADMIN.email, ADMIN.password)
    expect(first.role).toBe('admin')
  })
})

describe('wishlist', () => {
  it('adds then removes a product', async () => {
    const session = await registerCustomer('wish@example.com')
    const added = await request('/wishlist/arn-001', { method: 'POST', session })
    expect((await json<{ ids: string[] }>(added)).ids).toContain('arn-001')

    const removed = await request('/wishlist/arn-001', { method: 'POST', session })
    expect((await json<{ ids: string[] }>(removed)).ids).not.toContain('arn-001')
  })

  it('requires authentication', async () => {
    const res = await request('/wishlist/arn-001', { method: 'POST' })
    expect(res.status).toBe(401)
  })

  it('404s an unknown product', async () => {
    const session = await registerCustomer('wish404@example.com')
    const res = await request('/wishlist/not-a-product', { method: 'POST', session })
    expect(res.status).toBe(404)
  })
})

describe('cart', () => {
  it('adds a line and recomputes totals server-side', async () => {
    const session = await registerCustomer('cart@example.com')
    await addToCart(session, 'arn-001', 2)
    const cart = await json<{ subtotal: number; shipping: number; items: unknown[] }>(
      await request('/cart', { session }),
    )
    expect(cart.items).toHaveLength(1)
    expect(cart.subtotal).toBeGreaterThan(0)
  })

  it('rejects more than the per-line cap', async () => {
    const session = await registerCustomer('cartcap@example.com')
    const res = await request('/cart/items/arn-001', {
      method: 'PUT',
      session,
      body: JSON.stringify({ qty: 11 }),
    })
    expect(res.status).toBe(422)
  })

  it('removes a line when qty is zero', async () => {
    const session = await registerCustomer('cartzero@example.com')
    await addToCart(session, 'arn-001', 1)
    await request('/cart/items/arn-001', {
      method: 'PUT',
      session,
      body: JSON.stringify({ qty: 0 }),
    })
    const cart = await json<{ items: unknown[] }>(await request('/cart', { session }))
    expect(cart.items).toHaveLength(0)
  })

  it('merges a guest cart on login', async () => {
    const session = await registerCustomer('merge@example.com')
    const res = await request('/cart/merge', {
      method: 'POST',
      session,
      body: JSON.stringify({
        items: [
          { productId: 'arn-001', qty: 2 },
          { productId: 'arn-004', qty: 1 },
        ],
      }),
    })
    expect((await json<{ items: unknown[] }>(res)).items).toHaveLength(2)
  })

  it('skips guest items that are out of stock', async () => {
    const session = await registerCustomer('mergeoost@example.com')
    const admin = await loginAdmin()
    await request('/admin/products/arn-002/stock', {
      method: 'POST',
      session: admin,
      body: JSON.stringify({ stock: 0, reason: 'test' }),
    })
    const res = await request('/cart/merge', {
      method: 'POST',
      session,
      body: JSON.stringify({ items: [{ productId: 'arn-002', qty: 1 }] }),
    })
    expect((await json<{ items: unknown[] }>(res)).items).toHaveLength(0)
  })
})
