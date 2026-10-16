import { expect, LIVE, main, signIn, test } from './helpers.ts'

/** The six launch journeys from issue #43, in a real browser, on desktop and a phone. */

test('home: the full name, motto, menu and footer', async ({ page }) => {
  const response = await page.goto('/')
  await expect(
    page.getByRole('heading', {
      level: 1,
      name: 'Pharmaceutical Association of Nigeria Students, University of Lagos',
    }),
  ).toBeVisible()
  await expect(page).toHaveTitle('PANS UNILAG: Service to Humanity')
  await expect(page.getByRole('banner')).toBeVisible()
  await expect(page.getByRole('contentinfo')).toBeVisible()
  await expect(main(page).getByText('Service to Humanity').first()).toBeVisible()
  // Served with the security headers from vercel.json.
  expect(response?.headers()['content-security-policy']).toContain("default-src 'self'")
})

test('events: the upcoming list leads to an event page', async ({ page }) => {
  await page.goto('/events')
  await expect(page.getByRole('heading', { level: 1, name: /events/i })).toBeVisible()
  await main(page)
    .getByRole('link', { name: /Freshers/ })
    .first()
    .click()
  await expect(page).toHaveURL(/\/events\/freshers-week-2026$/)
  await expect(page.getByRole('heading', { level: 1, name: /Freshers/ })).toBeVisible()
})

test('committees: the list leads to a committee with its officers', async ({ page }) => {
  await page.goto('/leadership/committees')
  await expect(page.getByRole('heading', { level: 1, name: 'Committees' })).toBeVisible()
  await main(page).getByRole('link', { name: /ADMAP/ }).first().click()
  await expect(page).toHaveURL(/\/leadership\/committees\/admap$/)
  await expect(page.getByRole('heading', { level: 1, name: /ADMAP/ })).toBeVisible()
  await expect(main(page).getByText('Dada Aishat')).toBeVisible()
})

test('CGPA calculator: works out a GPA from a score and a grade', async ({ page }) => {
  await page.goto('/academics/cgpa-calculator')
  await expect(page.getByRole('heading', { level: 1, name: 'CGPA calculator' })).toBeVisible()
  const course = (n: number) => main(page).getByRole('group', { name: `Semester 1, course ${n}` })
  // 72 is an A (5 points) × 3 units; C is 3 points × 2 units: 21 ÷ 5 = 4.20.
  await course(1).getByLabel('Units').selectOption('3')
  await course(1).getByLabel('Score or grade').fill('72')
  await course(2).getByLabel('Units').selectOption('2')
  await course(2).getByLabel('Score or grade').fill('C')
  const results = main(page).locator('section', {
    has: page.getByRole('heading', { name: 'Your results' }),
  })
  await expect(results).toContainText('4.20')
  await expect(results).toContainText('Pass')
})

test('feedback: a student sends a message and an admin reads it', async ({ page }) => {
  test.skip(LIVE, 'sends a form: local runs only')
  const message = `Smoke test ${Date.now()}: please publish the exam timetable earlier.`
  await page.goto('/connect/feedback')
  await page.getByRole('radio', { name: 'A suggestion' }).check()
  await page.getByLabel('Your message').fill(message)
  await page.getByRole('button', { name: 'Send message' }).click()
  await expect(page.getByRole('heading', { name: /your message was sent/ })).toBeVisible()

  await signIn(page)
  await page
    .getByRole('navigation', { name: 'Admin' })
    .getByRole('link', { name: 'Feedback' })
    .click()
  await expect(main(page).getByText(message)).toBeVisible()
})

test('admin: wrong password is refused, the right one signs in and out', async ({ page }) => {
  test.skip(LIVE, 'signs in: local runs only')
  await page.goto('/admin/placeholders')
  await expect(page).toHaveURL(/\/admin\/sign-in/)
  await page.getByLabel('Email').fill('e2e-admin@pans.test')
  await page.getByLabel('Password', { exact: true }).fill('not-the-password')
  await page.getByRole('button', { name: 'Sign in' }).click()
  await expect(page.getByRole('alert')).toContainText(/email or password/i)

  await signIn(page)
  await expect(page.getByRole('link', { name: /placeholders to fill/ })).toBeVisible()
  await page.getByRole('button', { name: 'Sign out' }).click()
  await expect(page.getByRole('heading', { level: 1, name: 'Sign in' })).toBeVisible()
})
