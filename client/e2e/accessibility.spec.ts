import AxeBuilder from '@axe-core/playwright'
import type { Page } from '@playwright/test'
import { expect, LIVE, main, signIn, sitemapPaths, test } from './helpers.ts'

/**
 * Automated WCAG 2.2 AA checks (axe-core) on every page, in light and dark themes. Automated
 * tools find roughly a third of accessibility problems; the manual review is in docs/launch-qa.md.
 */

const WCAG = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']

/** Pages outside the sitemap: details, search, the 404 page and the admin sign-in. */
const EXTRA = [
  '/events/freshers-week-2026',
  '/leadership/committees/admap',
  '/gallery/health-week-2026-day-1',
  '/search?q=health',
  '/this-page-does-not-exist',
  '/admin/sign-in',
]

async function audit(page: Page, path: string) {
  await page.goto(path)
  await expect(page.locator('h1').first()).toBeVisible()
  // Let data load and lazy parts render before checking.
  await page.waitForLoadState('networkidle')
  const { violations } = await new AxeBuilder({ page }).withTags(WCAG).analyze()
  return violations.map(
    (v) =>
      `${path} [${v.impact}] ${v.id}: ${v.help} → ${v.nodes
        .slice(0, 3)
        .map((n) => n.target.join(' '))
        .join(' | ')}`,
  )
}

for (const scheme of ['light', 'dark'] as const) {
  test.describe(`${scheme} theme`, () => {
    test.use({ colorScheme: scheme })

    test('every public page passes the automated WCAG checks', async ({ page }) => {
      test.setTimeout(180_000)
      const paths = [...(await sitemapPaths(page)), ...EXTRA]
      const problems: string[] = []
      for (const path of paths) problems.push(...(await audit(page, path)))
      expect(problems).toEqual([])
    })

    test('the signed-in dashboard passes too', async ({ page }) => {
      test.skip(LIVE, 'signs in: local runs only')
      test.setTimeout(120_000)
      await signIn(page)
      const problems: string[] = []
      for (const path of [
        '/admin',
        '/admin/content',
        '/admin/placeholders',
        '/admin/events',
        '/admin/committees',
        '/admin/feedback',
        '/admin/accounts',
      ])
        problems.push(...(await audit(page, path)))
      // An editor with its row lists and photo fields.
      await page.goto('/admin/committees')
      await main(page).getByRole('link', { name: /ADMAP/ }).click()
      await expect(page.getByRole('heading', { level: 1, name: 'Edit committee' })).toBeVisible()
      problems.push(...(await audit(page, page.url().replace(/^https?:\/\/[^/]+/, ''))))
      expect(problems).toEqual([])
    })
  })
}
