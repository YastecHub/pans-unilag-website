import { useSyncExternalStore } from 'react'
import { Container } from './Container.tsx'

const subscribe = (onChange: () => void) => {
  window.addEventListener('online', onChange)
  window.addEventListener('offline', onChange)
  return () => {
    window.removeEventListener('online', onChange)
    window.removeEventListener('offline', onChange)
  }
}

/**
 * Says so when the phone loses its connection: pages opened before still work (the service
 * worker keeps them, issue #46), new ones will load once it's back. The live region is always in
 * the page so screen readers announce the change.
 */
export function OfflineNotice() {
  const online = useSyncExternalStore(
    subscribe,
    () => navigator.onLine,
    () => true,
  )
  return (
    <div role="status">
      {!online && (
        <div className="border-b border-border bg-surface-alt py-2 text-small text-text">
          <Container>
            You’re offline. Pages you’ve opened before still work; others will load when you’re back
            online.
          </Container>
        </div>
      )}
    </div>
  )
}
