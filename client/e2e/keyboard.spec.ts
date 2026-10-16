import { expect, main, sitemapPaths, test } from './helpers.ts'

/**
 * Accessibility checks axe can't make on its own: reflow on a narrow phone, the skip link,
 * visible keyboard focus, and the phone menu's keyboard behaviour (docs/launch-qa.md).
 */

test('no page scrolls sideways at 320px wide (WCAG 1.4.10 reflow)', async ({ page }) => {
  test.setTimeout(120_000)
  await page.setViewportSize({ width: 320, height: 640 })
  const overflowing: string[] = []
  for (const path of await sitemapPaths(page)) {
    await page.goto(path)
    await expect(page.locator('h1').first()).toBeVisible()
    await page.waitForLoadState('networkidle')
    const { scroll, width } = await page.evaluate(() => ({
      scroll: document.documentElement.scrollWidth,
      width: window.innerWidth,
    }))
    if (scroll > width) overflowing.push(`${path}: ${scroll}px wide in a ${width}px window`)
  }
  expect(overflowing).toEqual([])
})

test('the skip link comes first and moves focus to the page content', async ({ page }) => {
  await page.goto('/events')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  await page.keyboard.press('Tab')
  const skip = page.getByRole('link', { name: 'Skip to main content' })
  await expect(skip).toBeFocused()
  await expect(skip).toBeVisible()
  await page.keyboard.press('Enter')
  await expect(main(page)).toBeFocused()
})

test('keyboard focus is always visible', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  const unmarked: string[] = []
  for (let i = 0; i < 12; i++) {
    await page.keyboard.press('Tab')
    const focus = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement | null
      if (!el || el === document.body) return null
      const style = getComputedStyle(el)
      return {
        name: `${el.tagName.toLowerCase()} "${(el.textContent ?? '').trim().slice(0, 30)}"`,
        outline: style.outlineStyle !== 'none' && parseFloat(style.outlineWidth) >= 2,
      }
    })
    if (focus && !focus.outline) unmarked.push(focus.name)
  }
  expect(unmarked).toEqual([])
})

test('the phone menu opens from the keyboard and Escape closes it', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 800 })
  await page.goto('/')
  const toggle = page.getByRole('button', { name: 'Menu' })
  await toggle.focus()
  await page.keyboard.press('Enter')
  const menu = page.getByRole('navigation', { name: 'Main menu' })
  await expect(menu).toBeVisible()
  await expect(page.getByRole('button', { name: 'Close' })).toHaveAttribute('aria-expanded', 'true')
  await menu.getByRole('button', { name: 'Events' }).focus()
  await page.keyboard.press('Escape')
  await expect(menu).toBeHidden()
  await expect(page.getByRole('button', { name: 'Menu' })).toBeFocused()
})
