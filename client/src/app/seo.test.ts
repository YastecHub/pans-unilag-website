import { matchRoutes } from 'react-router'
import { describe, expect, it } from 'vitest'
import { SITE } from '../lib/site.ts'
import { routes } from './routes.tsx'
import { DEV_SITE_URL, robotsTxt, sitemapPaths, sitemapXml, siteUrl } from './seo.ts'
import html from '../../index.html?raw'
import manifestJson from '../../public/site.webmanifest?raw'

/** The files in client/public, which Vite serves at the site root. */
const PUBLIC = Object.keys(import.meta.glob('../../public/*', { query: '?url' })).map((p) =>
  p.replace('../../public', ''),
)
const isPublic = (href: string) => PUBLIC.includes(href)
const doc = new DOMParser().parseFromString(html, 'text/html')
const meta = (key: string) =>
  doc.querySelector(`meta[property="${key}"], meta[name="${key}"]`)?.getAttribute('content')

describe('link previews (WhatsApp, Facebook, LinkedIn, X)', () => {
  it('show the site name, motto and the badge image', () => {
    expect(doc.title).toBe(`${SITE.shortName}: ${SITE.motto}`)
    expect(meta('og:title')).toBe('PANS UNILAG: Service to Humanity')
    expect(meta('og:site_name')).toBe('PANS UNILAG')
    expect(meta('og:description')).toBe(`${SITE.name}. ${SITE.motto}.`)
    expect(meta('description')).toContain(SITE.name)
    expect(meta('description')).toContain(SITE.motto)
    expect(meta('og:type')).toBe('website')
    expect(meta('twitter:card')).toBe('summary_large_image')
  })

  it('use absolute addresses filled in at build time, and a 1200 × 630 image', () => {
    expect(meta('og:url')).toBe('__SITE_URL__/')
    expect(meta('og:image')).toBe('__SITE_URL__/og-default.png')
    expect(meta('og:image:width')).toBe('1200')
    expect(meta('og:image:height')).toBe('630')
    expect(meta('og:image:alt')).toMatch(/PANS UNILAG badge/)
    expect(isPublic('/og-default.png')).toBe(true)
  })
})

describe('icons and the web app manifest', () => {
  it('link the favicon, touch icon and manifest, and every file exists', () => {
    const links = [...doc.querySelectorAll('link[rel]')].map((l) => [
      l.getAttribute('rel'),
      l.getAttribute('href'),
    ])
    expect(links).toEqual(
      expect.arrayContaining([
        ['icon', '/favicon.ico'],
        ['icon', '/icon-192.png'],
        ['apple-touch-icon', '/apple-touch-icon.png'],
        ['manifest', '/site.webmanifest'],
      ]),
    )
    for (const [, href] of links) expect(isPublic(href!), href!).toBe(true)

    const manifest = JSON.parse(manifestJson)
    expect(manifest).toMatchObject({ name: 'PANS UNILAG', start_url: '/', display: 'standalone' })
    expect(manifest.theme_color).toBe(meta('theme-color'))
    const icons = manifest.icons as { src: string; sizes: string; purpose: string }[]
    expect(icons.map((i) => `${i.sizes} ${i.purpose}`)).toEqual([
      '192x192 any',
      '512x512 any',
      '512x512 maskable',
    ])
    for (const icon of icons) expect(isPublic(icon.src), icon.src).toBe(true)
  })
})

describe('robots.txt and sitemap.xml', () => {
  it('normalises the site address and refuses non-web ones', () => {
    expect(siteUrl('https://pans.example/')).toBe('https://pans.example')
    expect(siteUrl('  ')).toBe(DEV_SITE_URL)
    expect(siteUrl(undefined)).toBe(DEV_SITE_URL)
    expect(() => siteUrl('ftp://pans.example')).toThrow(/http\(s\)/)
  })

  it('lists every public page once, each one a real route, and never the dashboard', () => {
    const paths = sitemapPaths()
    expect(paths[0]).toBe('/')
    expect(new Set(paths).size).toBe(paths.length)
    expect(paths).toEqual(expect.arrayContaining(['/events/past', '/connect/privacy', '/gallery']))
    for (const path of paths) {
      const match = matchRoutes(routes, path)?.at(-1)?.route.path
      expect(match, path).not.toBe('*')
      expect(path.startsWith('/admin')).toBe(false)
    }
  })

  it('writes absolute addresses', () => {
    const xml = sitemapXml('https://pans.example', ['/', '/events'])
    expect(xml).toContain('<loc>https://pans.example/</loc>')
    expect(xml).toContain('<loc>https://pans.example/events</loc>')
    expect(
      new DOMParser().parseFromString(xml, 'application/xml').querySelector('parsererror'),
    ).toBeNull()
    expect(robotsTxt('https://pans.example')).toBe(
      'User-agent: *\nDisallow: /admin\nDisallow: /_ui\n\nSitemap: https://pans.example/sitemap.xml\n',
    )
  })
})
