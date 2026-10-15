import { useEffect } from 'react'
import { SITE } from './site.ts'

/** Sets the browser tab title to "<title> · PANS UNILAG" (or the site name and motto on the home page). */
export function usePageTitle(title?: string): void {
  useEffect(() => {
    document.title = title ? `${title} · ${SITE.shortName}` : `${SITE.shortName}: ${SITE.motto}`
  }, [title])
}
