/**
 * PANS UNILAG service worker (issue #46): the site installs to a phone's home screen, and pages a
 * student has opened before still work offline or on a very slow connection.
 *
 * Built by the pans-pwa plugin (pwa/plugin.ts), which fills in BUILD and PRECACHE and writes
 * dist/sw.js. Rules:
 *
 * - Pages: network first, so a new deploy shows at once. Offline, or after NETWORK_WAIT_MS with no
 *   answer, the saved app shell is used instead.
 * - /assets/*: file names change whenever the content does, so a saved copy is always right
 *   (cache first). They're kept across deploys, so a tab left open on an old version still loads.
 * - Public API data: network first; the last copy is kept for offline reading. The dashboard,
 *   sign-in, search and forms are never saved or served from the cache.
 * - Other sites (Cloudinary photos, Google Maps…) are left to the browser.
 */
const BUILD = '__BUILD__'
const PRECACHE = __PRECACHE__

const SHELL = `pans-shell-${BUILD}`
const ASSETS = 'pans-assets'
const DATA = 'pans-data'
const MAX_ASSETS = 60
const MAX_DATA = 150
const NETWORK_WAIT_MS = 4000
const PUBLIC_API =
  /^\/api\/(pages|executives|senate|committees|patrons|events|albums|announcements|opportunities|publications|documents|resources|grading-scale|settings)(\/|$)/

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const shell = await caches.open(SHELL)
      const assets = await caches.open(ASSETS)
      const hashed = PRECACHE.filter((url) => url.startsWith('/assets/'))
      await Promise.all([
        // "reload": skip the browser's HTTP cache so the shell matches this build.
        shell.addAll(
          PRECACHE.filter((url) => !url.startsWith('/assets/')).map(
            (url) => new Request(url, { cache: 'reload' }),
          ),
        ),
        assets.addAll(hashed),
      ])
      await self.skipWaiting()
    })(),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      for (const key of await caches.keys())
        if (key.startsWith('pans-shell-') && key !== SHELL) await caches.delete(key)
      await self.clients.claim()
    })(),
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return
  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return

  if (request.mode === 'navigate') {
    // The dashboard always comes from the network.
    if (/^\/(admin|api)(\/|$)/.test(url.pathname)) return
    event.respondWith(page(request))
  } else if (url.pathname.startsWith('/assets/')) {
    event.respondWith(asset(request))
  } else if (PUBLIC_API.test(url.pathname)) {
    event.respondWith(data(request, event))
  } else if (PRECACHE.includes(url.pathname)) {
    event.respondWith(caches.match(url.pathname).then((saved) => saved ?? fetch(request)))
  }
})

/** Resolves with null after `ms`, so a slow network can fall back to a saved copy. */
const timeout = (ms) => new Promise((resolve) => setTimeout(() => resolve(null), ms))

async function page(request) {
  const network = fetch(request).then(async (response) => {
    // Every page is the same index.html; keep the newest copy as the offline shell.
    if (response.ok && response.headers.get('content-type')?.includes('text/html'))
      await (await caches.open(SHELL)).put('/', response.clone())
    return response
  })
  network.catch(() => undefined)
  const first = await Promise.race([network.catch(() => null), timeout(NETWORK_WAIT_MS)])
  if (first) return first
  const saved = await caches.match('/', { cacheName: SHELL })
  return saved ?? network
}

async function asset(request) {
  const saved = await caches.match(request, { cacheName: ASSETS })
  if (saved) return saved
  const response = await fetch(request)
  if (response.ok) await keep(ASSETS, request, response.clone(), MAX_ASSETS)
  return response
}

async function data(request, event) {
  const network = fetch(request).then(async (response) => {
    if (response.ok) await keep(DATA, request, response.clone(), MAX_DATA)
    return response
  })
  // Finish saving even if a saved copy is answered first.
  event.waitUntil(network.catch(() => undefined))
  const first = await Promise.race([network.catch(() => null), timeout(NETWORK_WAIT_MS)])
  if (first) return first
  const saved = await caches.match(request, { cacheName: DATA })
  return saved ?? network
}

/** Saves a response, dropping the oldest entries beyond `max` so phones don't fill up. */
async function keep(name, request, response, max) {
  const cache = await caches.open(name)
  await cache.put(request, response)
  const keys = await cache.keys()
  for (const old of keys.slice(0, Math.max(0, keys.length - max)))
    if (!PRECACHE.includes(new URL(old.url).pathname)) await cache.delete(old)
}
