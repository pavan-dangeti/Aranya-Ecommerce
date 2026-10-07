import { execFileSync } from 'node:child_process'
import { rmSync } from 'node:fs'
import { expect, test, type Page } from '@playwright/test'
import { loginAdminViaUi, registerViaUi } from './fixtures'

// Regenerates docs/media and the social preview: `npm run media` (needs ffmpeg).
test.skip(!process.env.CAPTURE_MEDIA, 'media capture runs on demand')
test.describe.configure({ mode: 'serial' })

const OUT = 'docs/media'

async function settle(page: Page, ms = 1500) {
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(ms)
}

test.use({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 })

test('desktop screens', async ({ page }) => {
  await page.goto('/')
  await settle(page, 4000)
  await page.screenshot({ path: `${OUT}/home-hero.png` })
  await page.setViewportSize({ width: 1200, height: 630 })
  await settle(page, 1500)
  await page.screenshot({ path: 'web/public/og-image.jpg', type: 'jpeg', quality: 85 })
  await page.setViewportSize({ width: 1440, height: 900 })

  await page.goto('/products')
  await settle(page)
  await page.screenshot({ path: `${OUT}/shop.png` })

  await page.goto('/products/kumkumadi-night-oil')
  await settle(page, 4000)
  await page.screenshot({ path: `${OUT}/product-3d.png` })

  await registerViaUi(page)
  await page.goto('/products/kumkumadi-night-oil')
  await page.getByTestId('pdp-add-to-cart').click()
  const cart = page.getByRole('dialog', { name: 'Shopping cart' })
  await expect(cart).toBeVisible()
  await settle(page, 800)
  await page.screenshot({ path: `${OUT}/cart.png` })

  await cart.getByRole('button', { name: 'Proceed to Checkout' }).click()
  await page.getByLabel('Street address').fill('12 Banyan Grove Road')
  await page.getByLabel('City').fill('Bengaluru')
  await page.getByLabel('State').fill('Karnataka')
  await page.getByLabel('PIN code').fill('560001')
  await page.getByLabel('UPI ID').fill('asha@okaxis')
  await settle(page, 600)
  await page.screenshot({ path: `${OUT}/checkout.png` })
  await page.getByRole('button', { name: /^Place Order/ }).click()
  await expect(page.getByRole('heading', { name: 'The forest thanks you' })).toBeVisible()

  await page.goto('/profile')
  await page.getByRole('tab', { name: 'Orders' }).click()
  await settle(page, 800)
  await page.screenshot({ path: `${OUT}/profile.png` })
})

test('admin dashboard', async ({ page }) => {
  await loginAdminViaUi(page)
  await settle(page, 1500)
  await page.screenshot({ path: `${OUT}/admin-dashboard.png` })
})

test.describe('mobile', () => {
  test.use({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  })

  test('mobile screens', async ({ page }) => {
    await page.goto('/')
    await settle(page)
    await page.screenshot({ path: `${OUT}/mobile-home.png` })
    await page.goto('/products/tulsi-elixir')
    await settle(page)
    await page.screenshot({ path: `${OUT}/mobile-product.png` })
  })
})

test('walkthrough video', async ({ browser, baseURL }) => {
  const context = await browser.newContext({
    baseURL,
    viewport: { width: 1280, height: 720 },
    recordVideo: { dir: 'test-results/video', size: { width: 1280, height: 720 } },
  })
  const page = await context.newPage()
  await page.goto('/')
  await settle(page, 3500)
  await page.mouse.move(900, 300, { steps: 25 })
  await page.mouse.wheel(0, 900)
  await page.waitForTimeout(1500)
  await page.mouse.wheel(0, 1100)
  await page.waitForTimeout(2500)
  await page.goto('/products')
  await settle(page, 800)
  await page.getByRole('checkbox', { name: 'Skin Care' }).click()
  await page.waitForTimeout(1200)
  await page.getByRole('button', { name: 'Search products' }).click()
  await page.keyboard.type('tulsi', { delay: 120 })
  await page.waitForTimeout(1200)
  await page.keyboard.press('Enter')
  await settle(page, 3000)
  await page.getByTestId('pdp-add-to-cart').click()
  await page.waitForTimeout(2000)
  await page.keyboard.press('Escape')
  await loginAdminViaUi(page)
  await settle(page, 2500)
  await page.goto('/admin/orders')
  await settle(page, 2000)
  await context.close()
  const raw = 'test-results/walkthrough.webm'
  await page.video()?.saveAs(raw)
  const ffmpeg = (...args: string[]) =>
    execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-i', raw, ...args])
  ffmpeg(
    '-c:v',
    'libx264',
    '-pix_fmt',
    'yuv420p',
    '-crf',
    '26',
    '-preset',
    'slow',
    '-movflags',
    '+faststart',
    '-an',
    `${OUT}/walkthrough.mp4`,
  )
  ffmpeg(
    '-vf',
    'fps=8,scale=720:-1:flags=lanczos,split[a][b];[a]palettegen=max_colors=96:stats_mode=diff[p];[b][p]paletteuse=dither=bayer:bayer_scale=5:diff_mode=rectangle',
    `${OUT}/walkthrough.gif`,
  )
  rmSync(raw)
})
