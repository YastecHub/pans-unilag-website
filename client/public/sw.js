/* Service Worker for PANS UNILAG PWA and Offline Reading */
const CACHE_NAME = 'pans-cache-v1'

const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/site.webmanifest',
  '/favicon.ico',
  '/icon-192.png',
  '/icon-512.png',
  '/about',
  '/leadership/executive-council',
  '/governance/constitution',
  '/academics/cgpa-calculator',
  '/events',
  '/opportunities',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_ASSETS))
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.map((key) => (key !== CACHE_NAME ? caches.delete(key) : undefined))),
      )
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)

  // Skip caching non-GET requests and admin API routes
  if (
    event.request.method !== 'GET' ||
    url.pathname.startsWith('/api/admin') ||
    url.pathname.startsWith('/api/auth')
  ) {
    return
  }

  // Network-first for dynamic API data, falling back to cache
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone()
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone))
          }
          return response
        })
        .catch(() => caches.match(event.request)),
    )
    return
  }

  // Stale-while-revalidate for static assets and public pages
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse.ok) {
            const clone = networkResponse.clone()
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone))
          }
          return networkResponse
        })
        .catch(() => {
          // If navigation offline, serve cached SPA root
          if (event.request.mode === 'navigate') {
            return caches.match('/')
          }
          return undefined
        })

      return cachedResponse || fetchPromise
    }),
  )
})
