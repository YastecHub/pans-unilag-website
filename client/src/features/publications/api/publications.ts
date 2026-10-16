import { useQuery } from '@tanstack/react-query'
import { api } from '../../../lib/http.ts'

export type PublicationSeries = 'recipharm' | 'newspaper' | 'substack'

/** GET /api/publications: newest first, placeholders (no date yet) last. */
export type Publication = {
  slug: string
  title: string
  series: PublicationSeries
  /** "2026", "Vol. 3"; empty for a series-level placeholder. */
  edition: string
  publishedOn: string | null
  summary: string
  /** Cloudinary public id; empty if none. */
  cover: string
  /** PDF to download; empty if the publication is a link. */
  fileUrl: string
  /** External page (e.g. Substack); empty if the publication is a file. */
  link: string
  isPlaceholder: boolean
  placeholderNote?: string
}

/** The three series, in the order the page shows them, with what readers need to know. */
export const SERIES: { series: PublicationSeries; label: string; about: string }[] = [
  {
    series: 'recipharm',
    label: 'Recipharm',
    about: 'The annual magazine of PANS UNILAG, published by the Editorial Board.',
  },
  {
    series: 'newspaper',
    label: 'Newspaper',
    about: 'News and features from the association, by the Editorial Board.',
  },
  {
    series: 'substack',
    label: 'Substack',
    about: 'Articles and newsletters from PANS UNILAG, online.',
  },
]

export function usePublications() {
  return useQuery({
    queryKey: ['publications'],
    queryFn: ({ signal }) => api.get<{ publications: Publication[] }>('/api/publications', signal),
    select: (data) => data.publications,
  })
}

/** Publications by series, in SERIES order, keeping the API's newest-first order inside each. */
export function bySeries(publications: Publication[]) {
  return SERIES.map((s) => ({
    ...s,
    published: publications.filter((p) => p.series === s.series && !p.isPlaceholder),
    pending: publications.filter((p) => p.series === s.series && p.isPlaceholder),
  }))
}

/**
 * What a placeholder card says (README → Placeholder rules: state what will appear, never invent):
 * "Recipharm 2026 edition coming soon" for a known edition, "Recipharm editions coming soon"
 * for the series, "Our Substack link is coming soon" for Substack.
 */
export function comingSoonText(series: PublicationSeries, edition = ''): string {
  const label = SERIES.find((s) => s.series === series)!.label
  if (series === 'substack') return 'Our Substack link is coming soon'
  return edition ? `${label} ${edition} edition coming soon` : `${label} editions coming soon`
}
