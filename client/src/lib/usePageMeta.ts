import { useEffect } from 'react'
import { SITE } from './site.ts'

export type PageMeta = {
  title?: string
  description?: string
  image?: string
  url?: string
}

function updateMetaTag(attribute: 'name' | 'property', key: string, content?: string) {
  if (!content) return
  let element = document.querySelector(`meta[${attribute}="${key}"]`)
  if (!element) {
    element = document.createElement('meta')
    element.setAttribute(attribute, key)
    document.head.appendChild(element)
  }
  element.setAttribute('content', content)
}

/**
 * Updates browser tab title and Open Graph / Twitter meta tags on the client.
 */
export function usePageMeta(meta: PageMeta = {}): void {
  useEffect(() => {
    const fullTitle = meta.title
      ? `${meta.title} · ${SITE.shortName}`
      : `${SITE.shortName}: ${SITE.motto}`

    document.title = fullTitle

    if (meta.description) {
      updateMetaTag('name', 'description', meta.description)
      updateMetaTag('property', 'og:description', meta.description)
      updateMetaTag('name', 'twitter:description', meta.description)
    }

    updateMetaTag('property', 'og:title', fullTitle)
    updateMetaTag('name', 'twitter:title', fullTitle)

    if (meta.image) {
      updateMetaTag('property', 'og:image', meta.image)
      updateMetaTag('name', 'twitter:image', meta.image)
    }

    if (meta.url) {
      updateMetaTag('property', 'og:url', meta.url)
      updateMetaTag('name', 'twitter:url', meta.url)
    }
  }, [meta.title, meta.description, meta.image, meta.url])
}
