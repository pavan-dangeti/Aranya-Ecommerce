import { expect, test } from '@playwright/test'
import {
  apiCustomer,
  expectNoSeriousA11yViolations,
  loginAdminViaUi,
  productBySlug,
} from './fixtures'

test.describe('admin console', () => {
  test.beforeEach(async ({ page }) => loginAdminViaUi(page))

  test('dashboard is accessible', async ({ page }) => {
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expectNoSeriousA11yViolations(page)
  })

  test('edit a product price', async ({ page, request }) => {
    const product = await productBySlug(request, 'amla-deep-hair-mask')
    const newPrice = product.price + 1

    await page.goto('/admin/products')
    await page.getByRole('button', { name: `Edit ${product.name}` }).click()
    const panel = page.getByRole('dialog', { name: 'Edit product' })
    await expectNoSeriousA11yViolations(page)
    await panel.getByLabel('Price (₹)').fill(String(newPrice))
    await panel.getByRole('button', { name: 'Save changes' }).click()
    await expect(panel).toBeHidden()

    await expect
      .poll(async () => (await productBySlug(request, 'amla-deep-hair-mask')).price)
      .toBe(newPrice)
  })

  test('move an order through the status state machine', async ({ page, request }) => {
    const customer = await apiCustomer(request)
    const product = await productBySlug(request, 'tulsi-elixir')
    await request.put(`/api/cart/items/${product.id}`, {
      headers: customer.headers,
      data: { qty: 1 },
    })
    const placed = await request.post('/api/orders', {
      headers: customer.headers,
      data: {
        address: {
          fullName: 'Setup Customer',
          email: customer.email,
          phone: '9876543210',
          addressLine: '1 Test Street',
          city: 'Pune',
          state: 'Maharashtra',
          postalCode: '411001',
          country: 'India',
        },
        paymentMethod: 'cod',
        idempotencyKey: crypto.randomUUID(),
      },
    })
    expect(placed.ok()).toBeTruthy()
    const { id } = (await placed.json()) as { id: string }

    await page.goto('/admin/orders')
    await page.getByRole('textbox', { name: 'Search orders' }).fill(id)
    const status = page.getByRole('combobox', { name: `Status of order ${id}` })
    await status.selectOption('Processing')
    await expect(page.getByRole('status').filter({ hasText: /marked processing/i })).toBeVisible()

    const order = await request.get(`/api/orders/${id}`, { headers: customer.headers })
    expect(((await order.json()) as { status: string }).status).toBe('Processing')
  })

  test('approve a pending review', async ({ page, request }) => {
    const customer = await apiCustomer(request)
    const product = await productBySlug(request, 'brahmi-botanical')
    const title = `Lovely focus blend ${Date.now()}`
    const created = await request.post('/api/reviews', {
      headers: customer.headers,
      data: {
        productId: product.id,
        rating: 5,
        title,
        body: 'Calm, steady mornings after two weeks of use.',
      },
    })
    expect(created.ok()).toBeTruthy()

    await page.goto('/admin/reviews')
    await page
      .getByRole('group', { name: 'Filter by moderation status' })
      .getByRole('button', { name: 'Pending' })
      .click()
    const card = page.getByRole('listitem').filter({ hasText: title })
    await card.getByRole('button', { name: /^Approve review by/ }).click()
    await expect(page.getByRole('status').filter({ hasText: 'Review approved' })).toBeVisible()
    await expect(card).toBeHidden()

    const reviews = await request.get(`/api/products/${product.id}/reviews`)
    expect(
      ((await reviews.json()) as Array<{ title: string }>).some((r) => r.title === title),
    ).toBe(true)
  })

  test('adjust inventory', async ({ page, request }) => {
    const product = await productBySlug(request, 'giloy-stem-capsules')
    await page.goto('/admin/inventory')
    await page.getByRole('button', { name: `Increase stock of ${product.name}` }).click()
    await expect
      .poll(async () => (await productBySlug(request, 'giloy-stem-capsules')).stock)
      .toBe(product.stock + 1)
  })
})
