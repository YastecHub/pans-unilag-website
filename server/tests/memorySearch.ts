import { SEARCH_FIELDS, toHit } from '../src/modules/search/application/hits.js'
import type { SearchSource, SearchType } from '../src/modules/search/application/search.js'

type Doc = Record<string, unknown>

const words = (value: unknown): string[] =>
  (Array.isArray(value) ? value.join(' ') : typeof value === 'string' ? value : '')
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean)

/**
 * An in-memory stand-in for a MongoDB text search: whole-word, case-insensitive, any term,
 * the first field weighted ten times. Placeholders and hidden documents are left out, like the real one.
 */
export function memorySearchSource(
  type: SearchType,
  docs: Doc[],
  isVisible: (doc: Doc, now: Date) => boolean = () => true,
): SearchSource {
  const fields = SEARCH_FIELDS[type]
  return {
    type,
    async search(terms, limit, now) {
      const wanted = words(terms)
      return docs
        .filter((d) => d.isPlaceholder !== true && isVisible(d, now))
        .map((d) => {
          const score = fields.reduce((sum, field, i) => {
            const found = words(d[field]).filter((w) => wanted.includes(w)).length
            return sum + found * (i === 0 ? 10 : 1)
          }, 0)
          return { d, score }
        })
        .filter(({ score }) => score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
        .map(({ d, score }) => toHit[type](d, score))
    },
  }
}
