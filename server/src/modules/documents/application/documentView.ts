import { type PlaceholderView, placeholderView } from '../../../lib/publicView.js'

export type StoredDocument = {
  slug: string
  title: string
  version: string
  approvedOn: Date | string
  approvedBy?: string
  summary?: string
  fileUrl?: string
  fileSizeBytes?: number | null
  pageCount?: number | null
  isPlaceholder?: boolean
  placeholderNote?: string
}

export type DocumentView = PlaceholderView & {
  slug: string
  title: string
  version: string
  approvedOn: string
  approvedBy: string
  summary: string
  /** The PDF; empty until uploaded. */
  fileUrl: string
  /** For the download label ("PDF, 7.1 MB"); null if unknown. */
  fileSizeBytes: number | null
  pageCount: number | null
}

export function toDocumentView(d: StoredDocument): DocumentView {
  return {
    slug: d.slug,
    title: d.title,
    version: d.version,
    approvedOn: new Date(d.approvedOn).toISOString(),
    approvedBy: d.approvedBy ?? '',
    summary: d.summary ?? '',
    fileUrl: d.fileUrl ?? '',
    fileSizeBytes: d.fileSizeBytes ?? null,
    pageCount: d.pageCount ?? null,
    ...placeholderView(d),
  }
}

/** The most recently approved version of each document, ordered by title. */
export function latestVersions(stored: StoredDocument[]): DocumentView[] {
  const latest = new Map<string, StoredDocument>()
  for (const doc of stored) {
    const current = latest.get(doc.slug)
    if (!current || new Date(doc.approvedOn) > new Date(current.approvedOn))
      latest.set(doc.slug, doc)
  }
  return [...latest.values()].map(toDocumentView).sort((a, b) => a.title.localeCompare(b.title))
}

export type DocumentReader = {
  list(): Promise<StoredDocument[]>
}
