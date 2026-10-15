import { useQuery } from '@tanstack/react-query'
import { api } from '../../../lib/http.ts'

/** GET /api/pages/:slug: constitution-derived page content. */
export type PageSection = {
  heading: string
  /** Markdown. */
  bodyMarkdown: string
  /** Where the reader can check the text, e.g. "Art. 4 S.B". */
  articleRefs: string[]
}

export type PageContent = {
  slug: string
  title: string
  order: number
  sections: PageSection[]
  isPlaceholder: boolean
  placeholderNote?: string
  updatedAt?: string
}

export function usePage(slug: string) {
  return useQuery({
    queryKey: ['pages', slug],
    queryFn: ({ signal }) => api.get<PageContent>(`/api/pages/${slug}`, signal),
    // Constitution text changes rarely.
    staleTime: 5 * 60_000,
  })
}
