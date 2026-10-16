import { expect, LIVE, sitemapPaths, test } from './helpers.ts'

/**
 * Follows every link on the site from the sitemap: each page on the site must load (no
 * "Page not found"), and every outside link must be https and open safely. The list of outside
 * links and the placeholder count per page are attached to the report for a person to check.
 */

test('every link on the site leads somewhere, and placeholders are marked', async ({
  page,
}, testInfo) => {
  test.setTimeout(300_000)
  const queue = await sitemapPaths(page)
  const seen = new Set(queue)
  const broken: string[] = []
  const unsafe: string[] = []
  const external = new Map<string, Set<string>>()
  const placeholders: string[] = []

  while (queue.length > 0) {
    const path = queue.shift()!
    const response = await page.goto(path)
    if (!response?.ok()) broken.push(`${path}: HTTP ${response?.status()}`)
    await expect(page.locator('h1').first()).toBeVisible()
    await page.waitForLoadState('networkidle')
    if ((await page.locator('h1').first().textContent()) === 'Page not found')
      broken.push(`${path}: Page not found`)

    const comingSoon = await page.getByText(/coming soon|to be announced|to be confirmed/i).count()
    if (comingSoon > 0) placeholders.push(`${path}: ${comingSoon}`)

    const links = await page.locator('a[href]').evaluateAll((anchors) =>
      anchors.map((a) => ({
        href: (a as HTMLAnchorElement).href,
        raw: a.getAttribute('href') ?? '',
        target: a.getAttribute('target'),
        rel: a.getAttribute('rel') ?? '',
      })),
    )
    const origin = new URL(page.url()).origin
    for (const link of links) {
      if (link.raw.startsWith('#') || link.raw.startsWith('mailto:')) continue
      const url = new URL(link.href)
      if (url.origin === origin) {
        // One visit per page: query strings only filter or page through it (and the month
        // calendar's "previous month" links would otherwise go back forever).
        const target = url.pathname
        // The dashboard needs a session; the API and downloads aren't pages.
        if (/^\/(admin|api)(\/|$)/.test(url.pathname) || /\.\w+$/.test(url.pathname)) continue
        if (!seen.has(target)) {
          seen.add(target)
          queue.push(target)
        }
        continue
      }
      if (url.protocol !== 'https:') unsafe.push(`${path}: not https: ${link.href}`)
      if (link.target === '_blank' && !/noopener|noreferrer/.test(link.rel))
        unsafe.push(`${path}: opens ${link.href} in a new tab without rel="noopener"`)
      const on = external.get(link.href) ?? new Set<string>()
      on.add(path)
      external.set(link.href, on)
    }
  }

  await testInfo.attach('outside-links.txt', {
    contentType: 'text/plain',
    body: [...external.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([href, on]) => `${href}\n    on ${[...on].join(', ')}`)
      .join('\n'),
  })
  await testInfo.attach('placeholders.txt', {
    contentType: 'text/plain',
    body: placeholders.join('\n') || 'none',
  })
  console.log(
    `Checked ${seen.size} pages${LIVE ? ' on the live site' : ''}; ${external.size} outside links; placeholders on ${placeholders.length} pages.`,
  )
  expect(broken, 'pages that did not load').toEqual([])
  expect(unsafe, 'unsafe outside links').toEqual([])
})
