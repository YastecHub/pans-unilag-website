import { expect, main, test } from './helpers.ts'

/**
 * Install and offline reading (issue #46): once the service worker is running, pages a student
 * has opened still work with no connection, the CGPA calculator included, and the site says it's
 * offline.
 */
test('pages opened before still work offline', async ({ page, context }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  // The service worker installs after the first load and then takes over the page.
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready
    if (!navigator.serviceWorker.controller)
      await new Promise((resolve) =>
        navigator.serviceWorker.addEventListener('controllerchange', resolve, { once: true }),
      )
  })

  // Read two pages while online, so their content is saved.
  await page.goto('/about')
  await expect(page.getByRole('heading', { level: 2, name: 'Our motto' })).toBeVisible()
  await page.goto('/academics/cgpa-calculator')
  await expect(page.getByRole('heading', { level: 1, name: 'CGPA calculator' })).toBeVisible()
  await page.waitForLoadState('networkidle')

  await context.setOffline(true)
  try {
    // A fresh load of each page, with no network at all.
    await page.goto('/about')
    await expect(page.getByRole('heading', { level: 1, name: 'Who we are' })).toBeVisible()
    await expect(page.getByRole('heading', { level: 2, name: 'Our motto' })).toBeVisible()
    await expect(main(page)).toContainText('Service to Humanity')
    await expect(page.getByRole('status').filter({ hasText: 'You’re offline' })).toBeVisible()

    await page.goto('/academics/cgpa-calculator')
    const course = (n: number) => main(page).getByRole('group', { name: `Semester 1, course ${n}` })
    await course(1).getByLabel('Units').selectOption('3')
    await course(1).getByLabel('Score or grade').fill('72')
    await course(2).getByLabel('Units').selectOption('2')
    await course(2).getByLabel('Score or grade').fill('C')
    await expect(main(page)).toContainText('4.20')
  } finally {
    await context.setOffline(false)
  }
})

test('the site can be installed: manifest, icons and a service worker', async ({ page }) => {
  await page.goto('/')
  const manifest = (await (await page.request.get('/site.webmanifest')).json()) as {
    display: string
    start_url: string
    icons: { src: string; sizes: string }[]
  }
  expect(manifest.display).toBe('standalone')
  expect(manifest.start_url).toBe('/')
  for (const icon of manifest.icons) expect((await page.request.get(icon.src)).ok()).toBe(true)
  expect(manifest.icons.map((i) => i.sizes)).toEqual(expect.arrayContaining(['192x192', '512x512']))
  const scope = await page.evaluate(async () => (await navigator.serviceWorker.ready).scope)
  expect(new URL(scope).pathname).toBe('/')
  const sw = await page.request.get('/sw.js')
  expect(sw.headers()['cache-control']).toBe('no-cache')
})
