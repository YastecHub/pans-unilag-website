import type { SearchHit } from './search.js'
import { toSummary } from './search.js'

/**
 * The fields each searchable collection is searched on (the MongoDB text index uses the same list,
 * with the title weighted highest) and how a matching document becomes a result.
 */
export const SEARCH_FIELDS = {
  event: ['title', 'series', 'description', 'venue'],
  opportunity: ['title', 'organisation', 'description', 'eligibility'],
  publication: ['title', 'edition', 'summary'],
  resource: ['title', 'course', 'description'],
  committee: ['name', 'shortName', 'description', 'activities', 'motto'],
} as const

type Doc = Record<string, unknown>
const str = (value: unknown) => (typeof value === 'string' ? value : '')

export const toHit = {
  event: (d: Doc, score: number): SearchHit => ({
    type: 'event',
    title: str(d.title),
    summary: toSummary(str(d.description) || str(d.series)),
    url: `/events/${str(d.slug)}`,
    score,
  }),
  opportunity: (d: Doc, score: number): SearchHit => ({
    type: 'opportunity',
    title: str(d.title),
    summary: toSummary(str(d.organisation) || str(d.description)),
    url: `/opportunities/${str(d.slug)}`,
    score,
  }),
  publication: (d: Doc, score: number): SearchHit => ({
    type: 'publication',
    title: str(d.title),
    summary: toSummary(str(d.summary) || str(d.edition)),
    url: `/publications#${str(d.slug)}`,
    score,
  }),
  resource: (d: Doc, score: number): SearchHit => ({
    type: 'resource',
    title: str(d.title),
    summary: toSummary(
      [str(d.course), str(d.level), str(d.description)].filter(Boolean).join(' · '),
    ),
    url: `/academics/resources?level=${str(d.level)}&semester=${str(d.semester)}`,
    externalUrl: str(d.url) || undefined,
    score,
  }),
  committee: (d: Doc, score: number): SearchHit => ({
    type: 'committee',
    title: str(d.name),
    summary: toSummary(str(d.description)),
    url: `/leadership/committees/${str(d.slug)}`,
    score,
  }),
}
