import { MAIN_NAV } from './siteMap.ts'

/**
 * Search engines and link previews (README → Performance, SEO and accessibility). Used by
 * vite.config.ts at build time, so keep this free of browser-only code.
 */

/** Used when VITE_SITE_URL isn't set (local builds and CI); production must set it. */
export const DEV_SITE_URL = 'http://localhost:5173'

/** "https://pans.example/" → "https://pans.example". Throws for anything that isn't http(s). */
export function siteUrl(raw: string | undefined): string {
  const value = (raw ?? '').trim().replace(/\/+$/, '')
  if (!value) return DEV_SITE_URL
  const url = new URL(value)
  if (url.protocol !== 'https:' && url.protocol !== 'http:')
    throw new Error(`VITE_SITE_URL must be an http(s) address, not "${raw}"`)
  return value
}

/** Every public page with a fixed address: the home page and the menu's pages. */
export function sitemapPaths(): string[] {
  const paths = ['/', ...MAIN_NAV.flatMap((s) => [s.to, ...(s.children ?? []).map((c) => c.to)])]
  return [...new Set(paths)]
}

const escapeXml = (text: string) =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

export function sitemapXml(base: string, paths: string[] = sitemapPaths()): string {
  const urls = paths.map((p) => `  <url><loc>${escapeXml(`${base}${p}`)}</loc></url>`).join('\n')
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`
}

/** Everything may be crawled except the dashboard and the developers' UI kit. */
export function robotsTxt(base: string): string {
  return `User-agent: *
Disallow: /admin
Disallow: /_ui

Sitemap: ${base}/sitemap.xml
`
}
