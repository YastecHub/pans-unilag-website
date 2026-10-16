import { expect, type Page, test as base } from '@playwright/test'

/** Running against the live site: skip anything that sends a form or signs in. */
export const LIVE = !!process.env.E2E_BASE_URL

/** The test admin from server/scripts/e2e-server.ts (local runs only). */
export const E2E_ADMIN = {
  email: 'e2e-admin@pans.test',
  password: process.env.E2E_ADMIN_PASSWORD ?? 'e2e-only-password-not-a-secret',
}

/**
 * Every test fails on a JavaScript error or a console error in the page (a crash, a blocked
 * script, a failed request the app didn't handle), not only on what it asserts.
 */
export const test = base.extend<{ pageErrors: string[] }>({
  pageErrors: [
    async ({ page }, use) => {
      const errors: string[] = []
      page.on('pageerror', (error) => errors.push(`page error: ${error.message}`))
      page.on('console', (message) => {
        // A 401 is expected while signed out (the dashboard checks the session) or after a
        // wrong password; the browser logs it, but it isn't a fault.
        if (message.type() === 'error' && !/status of 401/.test(message.text()))
          errors.push(`console: ${message.text()}`)
      })
      await use(errors)
      expect(errors, 'errors in the page').toEqual([])
    },
    { auto: true },
  ],
})
export { expect }

/** The <main> landmark every page renders into. */
export const main = (page: Page) => page.locator('#main')

/** Every page the sitemap lists, as paths ("/", "/events"…). */
export async function sitemapPaths(page: Page): Promise<string[]> {
  const res = await page.request.get('/sitemap.xml')
  expect(res.ok(), 'sitemap.xml').toBe(true)
  const xml = await res.text()
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]!).pathname)
}

export async function signIn(page: Page) {
  await page.goto('/admin')
  await expect(page.getByRole('heading', { level: 1, name: 'Sign in' })).toBeVisible()
  await page.getByLabel('Email').fill(E2E_ADMIN.email)
  await page.getByLabel('Password', { exact: true }).fill(E2E_ADMIN.password)
  await page.getByRole('button', { name: 'Sign in' }).click()
  await expect(page.getByRole('heading', { level: 1, name: /^Welcome/ })).toBeVisible()
}
