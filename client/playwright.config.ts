import { defineConfig, devices } from '@playwright/test'

/**
 * Launch smoke tests in a real browser (issue #43). By default they run against the built site
 * and the real API with the seed content in memory (server/scripts/e2e-server.ts), with the same
 * headers as Vercel, so no database is needed:
 *
 *   npx playwright install chromium        (once)
 *   npm run e2e -w client
 *
 * Against the live site (read-only: tests that send forms or sign in are skipped):
 *
 *   $env:E2E_BASE_URL = "https://pans-unilag.vercel.app"; npm run e2e -w client
 */
const PORT = 4321
const live = process.env.E2E_BASE_URL

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'playwright-report' }]],
  use: {
    baseURL: live ?? `http://localhost:${PORT}`,
    trace: 'retain-on-failure',
    // Optional: use a Chromium that's already installed instead of `npx playwright install`.
    ...(process.env.PW_CHROMIUM_PATH && {
      launchOptions: { executablePath: process.env.PW_CHROMIUM_PATH },
    }),
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
  webServer: live
    ? undefined
    : {
        command: 'npm run build -w client && npm run e2e:server -w server',
        cwd: '..',
        url: `http://localhost:${PORT}/api/health`,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
})
