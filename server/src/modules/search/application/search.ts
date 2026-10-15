/** Site search across events, opportunities, publications, resources and committees. */

export const SEARCH_TYPES = [
  'event',
  'opportunity',
  'publication',
  'resource',
  'committee',
] as const
export type SearchType = (typeof SEARCH_TYPES)[number]

export const SEARCH_QUERY_MIN = 2
export const SEARCH_QUERY_MAX = 100

export type SearchHit = {
  type: SearchType
  title: string
  /** One line of context, plain text (Markdown removed), at most SUMMARY_MAX characters. */
  summary: string
  /** Where the result lives on the site, e.g. "/events/freshers-week-2026". */
  url: string
  /** For resources: the outside link the result points to. */
  externalUrl?: string
  /** Relevance; higher is better. Comparable within one search only. */
  score: number
}

/**
 * One searchable collection. Every source must leave out placeholders (and anything else
 * the public lists hide, such as closed opportunities).
 */
export type SearchSource = {
  type: SearchType
  search(terms: string, limit: number, now: Date): Promise<SearchHit[]>
}

export const SUMMARY_MAX = 160

/** Plain-text, single-line snippet from Markdown or long text. */
export function toSummary(text: string | undefined): string {
  const plain = (text ?? '')
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1') // links and images → their text
    .replace(/[*_`#>~]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
  return plain.length <= SUMMARY_MAX ? plain : `${plain.slice(0, SUMMARY_MAX - 1).trimEnd()}…`
}

/**
 * Terms for MongoDB's text search. Quotes and leading minus signs have special meaning there
 * (phrases, exclusions), so they are removed: what people type is always an ordinary search.
 */
export function normaliseTerms(q: string): string {
  return q
    .replace(/["\\]/g, ' ')
    .split(/\s+/)
    .map((word) => word.replace(/^-+/, ''))
    .filter(Boolean)
    .join(' ')
}

export type SearchResult = { query: string; results: SearchHit[] }

/** Runs every source (or one type), merges the hits and keeps the best `limit`. */
export async function searchSite(
  sources: SearchSource[],
  query: { q: string; type?: SearchType; limit: number },
  now: Date,
): Promise<SearchResult> {
  const terms = normaliseTerms(query.q)
  if (!terms) return { query: query.q, results: [] }
  const chosen = query.type ? sources.filter((s) => s.type === query.type) : sources
  const hits = (await Promise.all(chosen.map((s) => s.search(terms, query.limit, now)))).flat()
  hits.sort((a, b) => b.score - a.score || a.title.localeCompare(b.title))
  return { query: query.q, results: hits.slice(0, query.limit) }
}
