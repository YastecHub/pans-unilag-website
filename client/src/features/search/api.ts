import { useQuery } from '@tanstack/react-query'
import { api } from '../../lib/http.ts'

/** GET /api/search (README → API reference): placeholders are never returned. */
export type SearchType = 'event' | 'opportunity' | 'publication' | 'resource' | 'committee'

export type SearchHit = {
  type: SearchType
  title: string
  /** One line of plain text. */
  summary: string
  /** The page on this site. */
  url: string
  /** Resources: the outside link itself. */
  externalUrl?: string
  score: number
}

export const QUERY_MIN = 2
export const QUERY_MAX = 100
const LIMIT = 50

export const TYPE_LABELS: Record<SearchType, string> = {
  event: 'Events',
  opportunity: 'Opportunities',
  publication: 'Publications',
  resource: 'Academic resources',
  committee: 'Committees',
}

/** Collapses spaces, so "  health   week " and "health week" are the same search. */
export const normaliseQuery = (q: string) => q.trim().replace(/\s+/g, ' ').slice(0, QUERY_MAX)

export function useSearch(q: string) {
  const query = normaliseQuery(q)
  return useQuery({
    queryKey: ['search', query],
    queryFn: ({ signal }) =>
      api.get<{ query: string; results: SearchHit[] }>(
        `/api/search?${new URLSearchParams({ q: query, limit: String(LIMIT) })}`,
        signal,
      ),
    enabled: query.length >= QUERY_MIN,
    select: (data) => data.results,
    staleTime: 60_000,
  })
}

export type SearchGroup = { type: SearchType; label: string; hits: SearchHit[] }

/** Results by type; the group with the best match first, each group best match first. */
export function groupHits(hits: SearchHit[]): SearchGroup[] {
  const groups = new Map<SearchType, SearchHit[]>()
  for (const hit of [...hits].sort((a, b) => b.score - a.score)) {
    groups.set(hit.type, [...(groups.get(hit.type) ?? []), hit])
  }
  return [...groups].map(([type, list]) => ({ type, label: TYPE_LABELS[type], hits: list }))
}
