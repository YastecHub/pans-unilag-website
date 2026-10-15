/** Helpers for building the public (read-only) API shapes from stored documents. */

/** Browsers and the CDN may reuse public content for 5 minutes; dashboard edits show up within that. */
export const PUBLIC_CACHE_CONTROL = 'public, max-age=300'

export type PlaceholderView = {
  isPlaceholder: boolean
  /** Only present while the item is a placeholder. */
  placeholderNote?: string
}

/** The placeholder flag every content item carries, with the note only while it applies. */
export function placeholderView(doc: {
  isPlaceholder?: boolean
  placeholderNote?: string
}): PlaceholderView {
  return doc.isPlaceholder && doc.placeholderNote
    ? { isPlaceholder: true, placeholderNote: doc.placeholderNote }
    : { isPlaceholder: doc.isPlaceholder ?? false }
}
