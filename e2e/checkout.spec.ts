import { expect, test } from '@playwright/test'
import { PASSWORD, expectNoSeriousA11yViolations, registerViaUi } from './fixtures'

test('register, check out, find the order in the profile, log out, log back in', async ({
  page,
}) => {
  const email = await registerViaUi(page)

  await page.goto('/products/tulsi-elixir')
  await page.getByTestId('pdp-add-to-cart').click()
  const cart = page.getByRole('dialog', { name: 'Shopping cart' })
  await cart.getByRole('button', { name: 'Proceed to Checkout' }).click()

  await expect(page).toHaveURL(/\/checkout$/)
  await expect(page.getByLabel('Email')).toHaveValue(email)
  await expect(page.getByLabel('Phone')).toHaveValue('9876543210')
  await page.getByLabel('Street address').fill('12 Banyan Grove Road')
  await page.getByLabel('City').fill('Bengaluru')
  await page.getByLabel('State').fill('Karnataka')
  await page.getByLabel('PIN code').fill('560001')
  await page.getByLabel('UPI ID').fill('asha@okaxis')

  const summary = page.getByRole('complementary', { name: 'Order summary' })
  await expect(summary).toContainText('₹499')
  await expect(summary).toContainText('₹79')
  await expectNoSeriousA11yViolations(page)
  await page.getByRole('button', { name: /^Place Order · ₹578$/ }).click()

  await expect(page.getByRole('heading', { name: 'The forest thanks you' })).toBeVisible()
  const orderId = page.url().split('/order/')[1]
  expect(orderId).toBeTruthy()

  await page.goto('/profile')
  await page.getByRole('tab', { name: 'Orders' }).click()
  await expect(page.getByRole('link', { name: new RegExp(orderId!) })).toBeVisible()

  await page.getByTestId('logout').click()
  await page.getByRole('dialog').getByRole('button', { name: 'Sign out' }).click()
  await expect(page).toHaveURL(/\/$/)

  await page.goto('/profile')
  await expect(page).toHaveURL(/\/login\/customer/)
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Password').fill(PASSWORD)
  await page.getByTestId('customer-login-submit').click()
  await expect(page).toHaveURL(/\/profile$/)
})

test('a guest at checkout signs in and comes back with the basket intact', async ({
  page,
  request,
}) => {
  const email = `returning-${Date.now()}@example.com`
  await request.post('/api/auth/register', {
    data: { name: 'Returning Guest', email, password: PASSWORD },
  })

  await page.goto('/products/tulsi-elixir')
  await page.getByTestId('pdp-add-to-cart').click()
  await page.goto('/checkout')
  await expect(page).toHaveURL(/\/login\/customer/)

  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Password').fill(PASSWORD)
  await page.getByTestId('customer-login-submit').click()
  await expect(page).toHaveURL(/\/checkout$/)
  await expect(page.getByRole('complementary', { name: 'Order summary' })).toContainText(
    'Tulsi Elixir',
  )
})

test('server validation errors appear inline on registration', async ({ page }) => {
  await page.goto('/register/customer')
  await page.getByLabel('Full name').fill('Asha Rao')
  await page.getByLabel('Email').fill('admin@aranya.test')
  await page.getByLabel('Password', { exact: true }).fill(PASSWORD)
  await page.getByLabel('Confirm').fill(PASSWORD)
  await page.getByRole('button', { name: 'Create account' }).click()
  await expect(page.getByRole('alert')).toBeVisible()
  await expect(page).toHaveURL(/register/)
})
