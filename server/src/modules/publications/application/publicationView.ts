import { type PlaceholderView, placeholderView } from '../../../lib/publicView.js'
import type { PUBLICATION_SERIES } from '../infrastructure/publication.model.js'

export type PublicationSeries = (typeof PUBLICATION_SERIES)[number]

export type StoredPublication = {
  slug: string
  title: string
  series: PublicationSeries
  edition?: string
  publishedOn?: Date | string | null
  summary?: string
  cover?: string
  fileUrl?: string
  link?: string
  isPlaceholder?: boolean
  placeholderNote?: string
}

export type PublicationView = PlaceholderView & {
  slug: string
  title: string
  series: PublicationSeries
  edition: string
  publishedOn: string | null
  summary: string
  /** Cloudinary public id; empty if none. */
  cover: string
  /** PDF to download; empty if the publication is a link. */
  fileUrl: string
  /** External page (e.g. Substack); empty if the publication is a file. */
  link: string
}

export function toPublicationView(p: StoredPublication): PublicationView {
  return {
    slug: p.slug,
    title: p.title,
    series: p.series,
    edition: p.edition ?? '',
    publishedOn: p.publishedOn ? new Date(p.publishedOn).toISOString() : null,
    summary: p.summary ?? '',
    cover: p.cover ?? '',
    fileUrl: p.fileUrl ?? '',
    link: p.link ?? '',
    ...placeholderView(p),
  }
}

/** Newest first; undated (placeholder) editions last, by series. */
export function comparePublications(a: PublicationView, b: PublicationView): number {
  if (a.publishedOn !== b.publishedOn) {
    if (a.publishedOn === null) return 1
    if (b.publishedOn === null) return -1
    return Date.parse(b.publishedOn) - Date.parse(a.publishedOn)
  }
  return a.series.localeCompare(b.series) || a.title.localeCompare(b.title)
}

export type PublicationReader = {
  list(filter: { series?: PublicationSeries }): Promise<StoredPublication[]>
}
