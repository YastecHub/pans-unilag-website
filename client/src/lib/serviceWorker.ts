/**
 * Registers the service worker (dist/sw.js, built from pwa/sw.js) in production builds, after the
 * page has loaded so it never competes with the first visit. It makes the site installable and
 * keeps pages a student has opened readable offline (issue #46).
 */
export function registerServiceWorker(): void {
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return
  window.addEventListener('load', () => {
    // Not supported or blocked (e.g. private browsing): the site works the same without it.
    navigator.serviceWorker.register('/sw.js').catch(() => undefined)
  })
}
