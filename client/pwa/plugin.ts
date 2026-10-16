import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import type { Plugin, Rolldown } from 'vite'

/**
 * Files from public/ worth keeping offline: the shell (every page is index.html), the manifest and
 * the favicon. The large install icons are left out: the browser fetches them itself when the
 * site is installed, and they'd add about 500 KB to every phone's download.
 */
const PUBLIC_FILES = ['/', '/site.webmanifest', '/favicon.ico']

/** Fonts for English text only; other scripts' subsets are saved when a page first uses them. */
const LATIN_FONT = /-latin-\d+-normal-[\w-]+\.woff2$/
const FONT = /\.(woff2?|ttf|otf)$/

type OutputBundle = Rolldown.OutputBundle
type Chunk = Rolldown.OutputChunk

/**
 * What the service worker saves on install: the public site's JavaScript and CSS, the images
 * they import and the Latin fonts. The dashboard's code (anything under features/admin) is left
 * out: few people need it, and it's never available offline anyway.
 */
export function precacheUrls(bundle: OutputBundle): string[] {
  const chunks = Object.values(bundle).filter((file): file is Chunk => file.type === 'chunk')
  const byName = new Map(chunks.map((chunk) => [chunk.fileName, chunk]))
  // The dashboard is loaded lazily from features/admin/AdminApp.tsx (app/routes.tsx).
  const isAdmin = (chunk: Chunk) => !!chunk.facadeModuleId?.includes('/features/admin/')

  const files = new Set<string>()
  const visit = (chunk: Chunk | undefined) => {
    if (!chunk || files.has(chunk.fileName) || isAdmin(chunk)) return
    files.add(chunk.fileName)
    const meta = chunk.viteMetadata
    for (const css of meta?.importedCss ?? []) files.add(css)
    for (const asset of meta?.importedAssets ?? [])
      if (!FONT.test(asset) || LATIN_FONT.test(asset)) files.add(asset)
    for (const name of [...chunk.imports, ...chunk.dynamicImports]) visit(byName.get(name))
  }
  for (const chunk of chunks) if (chunk.isEntry) visit(chunk)
  for (const file of Object.keys(bundle)) if (LATIN_FONT.test(file)) files.add(file)

  return [...PUBLIC_FILES, ...[...files].sort().map((file) => `/${file}`)]
}

/** Fills in the service worker template (pwa/sw.js) for one build. */
export function serviceWorker(template: string, urls: string[], indexHtml = ''): string {
  // A new id whenever the files or the page change, so phones pick up the new version.
  const build = createHash('sha256')
    .update(JSON.stringify(urls))
    .update(indexHtml)
    .digest('hex')
    .slice(0, 12)
  return template
    .replace("'__BUILD__'", JSON.stringify(build))
    .replace('__PRECACHE__', JSON.stringify(urls))
}

/** Writes dist/sw.js (issue #46). Registered by src/lib/serviceWorker.ts in production builds. */
export function pwa(): Plugin {
  return {
    name: 'pans-pwa',
    apply: 'build',
    // After Vite's own plugins, so index.html is in the bundle.
    enforce: 'post',
    generateBundle(_options, bundle) {
      const index = bundle['index.html']
      const html = index?.type === 'asset' ? String(index.source) : ''
      const template = readFileSync(new URL('./sw.js', import.meta.url), 'utf8')
      this.emitFile({
        type: 'asset',
        fileName: 'sw.js',
        source: serviceWorker(template, precacheUrls(bundle), html),
      })
    },
  }
}
