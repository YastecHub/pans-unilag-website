/**
 * Registers the Service Worker in production or when supported.
 */
export function registerServiceWorker(): void {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator && !import.meta.env.DEV) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          registration.onupdatefound = () => {
            const installing = registration.installing
            if (installing) {
              installing.onstatechange = () => {
                if (installing.state === 'installed' && navigator.serviceWorker.controller) {
                  // New update available
                }
              }
            }
          }
        })
        .catch(() => {
          // Service worker registration ignored or failed silently
        })
    })
  }
}
