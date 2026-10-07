import { expect, test } from '@playwright/test'
import { apiCustomer, registerViaUi } from './fixtures'

test('a customer forcing /admin is redirected, and the API answers 403', async ({
  page,
  request,
}) => {
  await registerViaUi(page)
  await page.goto('/admin')
  await expect(page).not.toHaveURL(/\/admin/)

  const customer = await apiCustomer(request)
  const res = await request.get('/api/admin/dashboard', { headers: customer.headers })
  expect(res.status()).toBe(403)
  expect(((await res.json()) as { error: { code: string } }).error.code).toBe('forbidden')
})

test('writing role=admin into browser storage grants nothing', async ({ page }) => {
  await registerViaUi(page)
  const forged = JSON.stringify({ id: 'x', role: 'admin', name: 'Mallory', email: 'm@example.com' })
  await page.evaluate((user) => {
    for (const store of [localStorage, sessionStorage]) {
      for (const key of ['aranya-user', 'aranya-auth', 'user', 'role']) store.setItem(key, user)
      store.setItem('role', 'admin')
    }
    document.cookie = 'role=admin; path=/'
  }, forged)

  const adminCalls: number[] = []
  page.on('response', (r) => r.url().includes('/api/admin/') && adminCalls.push(r.status()))

  await page.goto('/admin')
  await expect(page).not.toHaveURL(/\/admin/)
  expect(adminCalls.every((s) => s === 401 || s === 403)).toBe(true)
})

test('an anonymous visitor to /admin lands on the admin sign-in', async ({ page }) => {
  await page.goto('/admin/orders')
  await expect(page).toHaveURL(/\/login\/admin/)
})
