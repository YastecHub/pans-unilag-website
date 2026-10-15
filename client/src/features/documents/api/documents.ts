import { useQuery } from '@tanstack/react-query'
import { api } from '../../../lib/http.ts'

/** GET /api/documents: the latest approved version of each official document. */
export type OfficialDocument = {
  slug: string
  title: string
  version: string
  approvedOn: string
  approvedBy: string
  summary: string
  /** The PDF; empty until uploaded. */
  fileUrl: string
  fileSizeBytes: number | null
  pageCount: number | null
  isPlaceholder: boolean
  placeholderNote?: string
}

export function useDocuments() {
  return useQuery({
    queryKey: ['documents'],
    queryFn: ({ signal }) =>
      api.get<{ documents: OfficialDocument[] }>('/api/documents', signal).then((r) => r.documents),
    staleTime: 5 * 60_000,
  })
}

/** "7.1 MB", "840 KB". */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

/** "PDF, 55 pages, 7.1 MB": what the reader is about to download. */
export function downloadLabel(doc: Pick<OfficialDocument, 'pageCount' | 'fileSizeBytes'>): string {
  const parts = ['PDF']
  if (doc.pageCount) parts.push(`${doc.pageCount} pages`)
  if (doc.fileSizeBytes) parts.push(formatFileSize(doc.fileSizeBytes))
  return parts.join(', ')
}
