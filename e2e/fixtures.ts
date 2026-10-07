import AxeBuilder from '@axe-core/playwright'
import { expect, type APIRequestContext, type Page } from '@playwright/test'
import { E2E_ADMIN } from '../playwright.config'

export const PASSWORD = 'Passw0rd!23'

const uniqueEmail = (tag: string) =>
  `${tag}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}@example.com`

export async function registerViaUi(page: Page, email = uniqueEmail('shopper'), name = 'Asha Rao') {
  await page.goto('/register/customer')
  await page.getByLabel('Full name').fill(name)
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Phone').fill('9876543210')
  await page.getByLabel('Password', { exact: true }).fill(PASSWORD)
  await page.getByLabel('Confirm').fill(PASSWORD)
  await page.getByRole('button', { name: 'Create account' }).click()
  await expect(page).not.toHaveURL(/register/)
  return email
}

export async function loginAdminViaUi(page: Page) {
  await page.goto('/login/admin')
  await page.getByLabel('Admin email').fill(E2E_ADMIN.email)
  await page.getByLabel('Password').fill(E2E_ADMIN.password)
  await page.getByTestId('admin-login-submit').click()
  await expect(page).toHaveURL(/:\d+\/admin$/)
}

/** A signed-in customer created straight through the API, for test setup. */
export async function apiCustomer(request: APIRequestContext, email = uniqueEmail('api')) {
  const res = await request.post('/api/auth/register', {
    data: { name: 'Setup Customer', email, password: PASSWORD },
  })
  expect(res.ok()).toBeTruthy()
  const { accessToken } = (await res.json()) as { accessToken: string }
  return { email, headers: { Authorization: `Bearer ${accessToken}` } }
}

export async function productBySlug(request: APIRequestContext, slug: string) {
  const res = await request.get(`/api/products/${slug}`)
  expect(res.ok()).toBeTruthy()
  return (await res.json()) as { id: string; name: string; price: number; stock: number }
}

export async function expectNoSeriousA11yViolations(page: Page) {
  // Contrast is only meaningful once page transitions and dialog fades have settled.
  // Bounded, because framer-motion loops are restarted finite animations.
  await page
    .waitForFunction(
      () =>
        document
          .getAnimations()
          .every((a) => a.playState !== 'running' || a.effect?.getTiming().iterations === Infinity),
      undefined,
      { timeout: 3_000 },
    )
    .catch(() => undefined)
  await page.waitForTimeout(500)
  const { violations } = await new AxeBuilder({ page }).analyze()
  const serious = violations.filter((v) => v.impact === 'serious' || v.impact === 'critical')
  const report = serious.flatMap((v) =>
    v.nodes.map(
      (n) => `${v.id} ${n.target.join(' ')} — ${n.any[0]?.message ?? n.failureSummary ?? ''}`,
    ),
  )
  expect(report).toEqual([])
}
