import { defineConfig, devices } from '@playwright/test'

const E2E_DATABASE_URL =
  process.env.E2E_DATABASE_URL ?? 'postgresql://aranya:aranya@localhost:55432/aranya_e2e'
const WEB = 'http://localhost:4173'
// Off the default 8787 so a running `npm run dev` never answers the e2e suite.
const API = 'http://localhost:8788'

export const E2E_ADMIN = { email: 'admin@aranya.test', password: 'E2e-Admin-Password-2026' }

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL: WEB,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
  webServer: [
    {
      command: 'npm run db:reset && npm run start -w server',
      url: `${API}/api/health/ready`,
      timeout: 120_000,
      reuseExistingServer: !process.env.CI,
      env: {
        NODE_ENV: 'development',
        PORT: '8788',
        DATABASE_URL: E2E_DATABASE_URL,
        JWT_SECRET: 'e2e-secret-value-that-is-definitely-long-enough-32',
        CORS_ORIGINS: WEB,
        PUBLIC_APP_URL: WEB,
        SEED_ADMIN_EMAIL: E2E_ADMIN.email,
        SEED_ADMIN_PASSWORD: E2E_ADMIN.password,
        SEED_DEMO_PASSWORD: 'e2e-demo-password',
        RATE_LIMIT_MAX: '10000',
        AUTH_RATE_LIMIT_MAX: '10000',
        LOG_LEVEL: 'warn',
      },
    },
    {
      command: 'npm run preview -w web -- --port 4173 --strictPort',
      url: WEB,
      env: { API_ORIGIN: API },
      timeout: 60_000,
      reuseExistingServer: !process.env.CI,
    },
  ],
})
