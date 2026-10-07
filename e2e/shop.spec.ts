import { expect, test } from '@playwright/test'
import { expectNoSeriousA11yViolations } from './fixtures'

test.describe('storefront', () => {
  test('browse, filter by category and sort the catalogue', async ({ page, isMobile }) => {
    await page.goto('/products')
    await expect(page.getByRole('heading', { level: 1, name: 'All Products' })).toBeVisible()
    const count = page.getByRole('region', { name: 'Products' }).getByRole('status')
    await expect(count).toHaveText(/\d+ preparations/)
    const total = Number((await count.textContent())?.match(/\d+/)?.[0])

    if (isMobile) await page.getByRole('button', { name: 'Filters' }).click()
    const hairCare = page.getByRole('checkbox', { name: 'Hair Care' })
    await hairCare.click()
    await expect(hairCare).toBeChecked()
    if (isMobile) await page.getByRole('button', { name: /^Show \d+ results$/ }).click()

    await expect(page).toHaveURL(/cat=hair-care/)
    await expect(count).not.toHaveText(`${total} preparations`)
    const cards = page.getByRole('region', { name: 'Products' }).getByRole('article')
    await expect(cards.first().getByText('Hair Care')).toBeVisible()

    await page.getByRole('combobox', { name: 'Sort' }).selectOption('price-asc')
    await expect(page).toHaveURL(/sort=price-asc/)
  })

  test('search from the ⌘K palette opens the product', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'Search products' }).click()
    const palette = page.getByRole('dialog', { name: 'Search products' })
    await palette.getByRole('combobox').fill('tulsi')
    await expect(palette.getByRole('option').first()).toContainText('Tulsi')
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(/\/products\/[a-z-]*tulsi/)
    await expect(palette).toBeHidden()
  })

  test('the palette opens with the keyboard shortcut and closes with Escape, restoring focus', async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, 'keyboard shortcut is a desktop affordance')
    await page.goto('/products')
    const trigger = page.getByRole('button', { name: 'Search products' })
    await trigger.focus()
    await page.keyboard.press('ControlOrMeta+k')
    const palette = page.getByRole('dialog', { name: 'Search products' })
    await expect(palette).toBeVisible()
    await expect(palette.getByRole('combobox')).toBeFocused()
    await page.keyboard.press('Escape')
    await expect(palette).toBeHidden()
    await expect(trigger).toBeFocused()
  })

  test('quick view adds to the cart and the drawer is keyboard-dismissable', async ({ page }) => {
    await page.goto('/products')
    await page.getByRole('button', { name: 'Quick view Tulsi Elixir' }).click()
    const quickView = page.getByRole('dialog', { name: 'Quick view — Tulsi Elixir' })
    await expect(quickView.getByRole('heading', { name: 'Tulsi Elixir' })).toBeVisible()
    await quickView.getByRole('button', { name: 'Increase quantity' }).click()
    await quickView.getByRole('button', { name: 'Add to Cart' }).click()

    const cart = page.getByRole('dialog', { name: 'Shopping cart' })
    await expect(cart).toBeVisible()
    await expect(quickView).toBeHidden()
    await expect(cart.getByRole('group', { name: 'Quantity of Tulsi Elixir' })).toContainText('2')
    await expectNoSeriousA11yViolations(page)

    await page.keyboard.press('Escape')
    await expect(cart).toBeHidden()
  })

  test('a guest is sent to sign in when saving to the wishlist', async ({ page }) => {
    await page.goto('/products')
    await page.getByRole('button', { name: 'Add Tulsi Elixir to wishlist' }).click()
    await expect(page).toHaveURL(/\/login\/customer/)
    await expect(
      page.getByRole('status').filter({ hasText: 'Sign in to save products' }),
    ).toBeVisible()
  })

  test('deep links render on a hard load', async ({ page }) => {
    const response = await page.goto('/products/tulsi-elixir')
    expect(response?.status()).toBe(200)
    await expect(page.getByRole('heading', { level: 1, name: 'Tulsi Elixir' })).toBeVisible()
    await expect(page).toHaveTitle('Tulsi Elixir — ARANYA')
    const ld = JSON.parse((await page.locator('#ld-product').textContent()) ?? '{}') as {
      '@type': string
      offers: { priceCurrency: string }
    }
    expect(ld['@type']).toBe('Product')
    expect(ld.offers.priceCurrency).toBe('INR')
  })

  for (const path of ['/', '/products', '/products/tulsi-elixir', '/journal', '/login/customer']) {
    test(`no serious accessibility violations on ${path}`, async ({ page }) => {
      await page.goto(path)
      await page.waitForLoadState('networkidle')
      await expectNoSeriousA11yViolations(page)
    })
  }
})
