import { expect, test } from './helpers.ts'

/**
 * Link previews (issue #45): WhatsApp and other crawlers get tags for the event itself, through
 * vercel.json's User-Agent rewrites; people get the normal app at the same address.
 */
const WHATSAPP = 'WhatsApp/2.24.20.89 A'
const tag = (html: string, property: string) =>
  new RegExp(`<meta property="${property}" content="([^"]*)">`).exec(html)?.[1]

test('a shared event link previews the event itself', async ({ page, baseURL }) => {
  const path = '/events/health-week-2026-day-1'
  const { title } = (await (await page.request.get(`/api${path}`)).json()) as { title: string }
  const bot = await page.request.get(path, { headers: { 'User-Agent': WHATSAPP } })
  expect(bot.status()).toBe(200)
  const html = await bot.text()
  expect(tag(html, 'og:title')).toBe(title.replace(/&/g, '&amp;'))
  expect(tag(html, 'og:url')).toBe(`${new URL(baseURL!).origin}${path}`)
  expect(tag(html, 'og:image')).toMatch(/^https?:\/\/.+/)
  expect(html).not.toContain('<script')

  // A person opening the same link gets the app.
  await page.goto(path)
  await expect(page.getByRole('heading', { level: 1 })).toContainText(title)
})

test('a link to a closed or unknown opportunity previews the site', async ({ page }) => {
  const res = await page.request.get('/opportunities/no-such-opportunity', {
    headers: { 'User-Agent': WHATSAPP },
  })
  expect(res.status()).toBe(404)
  expect(tag(await res.text(), 'og:title')).toBe('PANS UNILAG: Service to Humanity')
})
