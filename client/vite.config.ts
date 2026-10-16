import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import type { Plugin } from 'vite'
import { defineConfig } from 'vitest/config'
import { buildSiteUrl, DEV_SITE_URL, robotsTxt, sitemapXml } from './src/app/seo.ts'

/**
 * Link previews and search engines: puts the public site address (VITE_SITE_URL) into the
 * Open Graph tags in index.html, and writes robots.txt and sitemap.xml into the build.
 */
function seo(): Plugin {
  let base = DEV_SITE_URL
  return {
    name: 'pans-seo',
    configResolved(config) {
      base = buildSiteUrl({
        VITE_SITE_URL: config.env.VITE_SITE_URL as string | undefined,
        VERCEL_PROJECT_PRODUCTION_URL: process.env.VERCEL_PROJECT_PRODUCTION_URL,
      })
      if (config.command === 'build' && !base.startsWith('https://'))
        config.logger.warn(
          `\n[pans-seo] VITE_SITE_URL is ${base}. Set it to the live https address (on Vercel it's filled in automatically), or link previews and the sitemap will point at the wrong site.\n`,
        )
    },
    transformIndexHtml: (html) => html.replaceAll('__SITE_URL__', base),
    generateBundle() {
      this.emitFile({ type: 'asset', fileName: 'robots.txt', source: robotsTxt(base) })
      this.emitFile({ type: 'asset', fileName: 'sitemap.xml', source: sitemapXml(base) })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), seo()],
  server: {
    port: 5173,
    // In development, send /api requests to the Express server.
    proxy: {
      '/api': 'http://localhost:4000',
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    // Vitest blanks CSS by default; tokens.test.ts reads tokens.css to check contrast.
    css: { include: [/tokens\.css/] },
  },
})
