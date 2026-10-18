import request from 'supertest'
import { describe, expect, it } from 'vitest'
import { buildOpenApiDocument } from '../src/docs/openapi.js'
import { startOfLagosDay } from '../src/lib/lagosTime.js'
import { CommitteeModel } from '../src/modules/committees/infrastructure/committee.model.js'
import { EventModel } from '../src/modules/events/infrastructure/event.model.js'
import { isOpen } from '../src/modules/opportunities/application/opportunityView.js'
import { OpportunityModel } from '../src/modules/opportunities/infrastructure/opportunity.model.js'
import { PublicationModel } from '../src/modules/publications/infrastructure/publication.model.js'
import { ResourceModel } from '../src/modules/resources/infrastructure/resource.model.js'
import {
  normaliseTerms,
  type SearchHit,
  searchSite,
  toSummary,
} from '../src/modules/search/application/search.js'
import { testApp } from './helpers.js'
import { memorySearchSource } from './memorySearch.js'
import { seedReaders } from './seedReaders.js'

const NOW = new Date('2026-10-16T09:00:00+01:00')
const get = (path: string, app = testApp({ now: () => NOW })) => request(app).get(path)
const types = (results: SearchHit[]) => results.map((r) => `${r.type}:${r.url}`)

describe('GET /api/search', () => {
  it('finds a committee by name and links to its page', async () => {
    const res = await get('/api/search?q=ADMAP')

    expect(res.status).toBe(200)
    expect(res.headers['cache-control']).toBe('public, max-age=60')
    expect(res.body.query).toBe('ADMAP')
    expect(res.body.results[0]).toMatchObject({
      type: 'committee',
      title: 'Anti-Drug Misuse and Abuse Program (ADMAP)',
      url: '/leadership/committees/admap',
    })
    expect(res.body.results[0].summary.length).toBeLessThanOrEqual(160)
  })

  it('never returns placeholders', async () => {
    // Pharmathon is a placeholder event, Recipharm a placeholder publication.
    for (const q of ['Pharmathon', 'Recipharm']) {
      const res = await get(`/api/search?q=${q}`)
      expect(res.status, q).toBe(200)
      expect(
        types(res.body.results).filter((t) => !t.startsWith('committee:')),
        q,
      ).toEqual([])
    }
  })

  it('rejects a query shorter than 2 characters, a missing or overlong one, and unknown filters', async () => {
    for (const query of [
      'q=a',
      'q=%20a%20',
      '',
      `q=${'x'.repeat(101)}`,
      'q=ab&type=page',
      'q=ab&sort=new',
    ]) {
      const res = await get(`/api/search?${query}`)
      expect(res.status, query).toBe(400)
      expect(res.body.error.code).toBe('VALIDATION_ERROR')
    }
  })

  it('filters by type and limits the number of results', async () => {
    const all = (await get('/api/search?q=committee&limit=50')).body.results as SearchHit[]
    expect(all.length).toBeGreaterThan(2)
    expect(all.every((r) => r.type === 'committee')).toBe(true)

    expect((await get('/api/search?q=committee&limit=2')).body.results).toHaveLength(2)
    expect((await get('/api/search?q=committee&type=event')).body.results).toEqual([])
  })

  it('returns an empty list when nothing matches', async () => {
    expect((await get('/api/search?q=zzzz')).body).toEqual({ query: 'zzzz', results: [] })
  })

  it('only finds opportunities that are open and real', async () => {
    const opportunities = [
      {
        slug: 'open-scholarship',
        title: 'Pharmacy scholarship',
        deadline: new Date('2026-10-16T00:00:00+01:00'),
      },
      {
        slug: 'closed-scholarship',
        title: 'Closed scholarship',
        deadline: new Date('2026-10-15T00:00:00+01:00'),
      },
      { slug: 'draft-scholarship', title: 'Draft scholarship', isPlaceholder: true },
    ]
    const search = seedReaders().search.map((source) =>
      source.type === 'opportunity'
        ? memorySearchSource('opportunity', opportunities, (d, now) =>
            isOpen({ deadline: d.deadline as Date | undefined }, now),
          )
        : source,
    )
    const res = await get(
      '/api/search?q=scholarship',
      testApp({ now: () => NOW, readers: { search } }),
    )

    expect(types(res.body.results)).toEqual(['opportunity:/opportunities/open-scholarship'])
  })
})

describe('search building blocks', () => {
  it('turns typed text into ordinary search terms', () => {
    expect(normaliseTerms('"drug abuse" -rally  \\ ADMAP')).toBe('drug abuse rally ADMAP')
    expect(normaliseTerms(' -- " ')).toBe('')
  })

  it('makes a plain one-line summary', () => {
    expect(toSummary('**Bold** [link](https://x.org)\n\n# Heading')).toBe('Bold link Heading')
    const long = toSummary('word '.repeat(100))
    expect(long.length).toBe(160)
    expect(long.endsWith('…')).toBe(true)
  })

  it('merges sources, best score first, and stops at the limit', async () => {
    const hit = (type: SearchHit['type'], title: string, score: number): SearchHit => ({
      type,
      title,
      summary: '',
      url: `/${title}`,
      score,
    })
    const sources = [
      { type: 'event' as const, search: async () => [hit('event', 'b', 2), hit('event', 'c', 1)] },
      { type: 'committee' as const, search: async () => [hit('committee', 'a', 5)] },
    ]
    const result = await searchSite(sources, { q: 'x', limit: 2 }, NOW)
    expect(result.results.map((r) => r.title)).toEqual(['a', 'b'])
    expect(
      (await searchSite(sources, { q: 'x', type: 'event', limit: 5 }, NOW)).results,
    ).toHaveLength(2)
  })

  it('uses the same open-opportunity rule in the database filter as the Opportunities page', () => {
    const nows = [
      '2026-10-16T00:00:00+01:00',
      '2026-10-16T23:59:59.999+01:00',
      '2026-10-16T23:30:00Z',
    ]
    const deadlines = [
      '2026-10-15T23:59:59+01:00',
      '2026-10-16T00:00:00+01:00',
      '2026-10-17T08:00:00+01:00',
    ]
    for (const n of nows) {
      for (const d of deadlines) {
        const [now, deadline] = [new Date(n), new Date(d)]
        expect(deadline >= startOfLagosDay(now), `${d} at ${n}`).toBe(isOpen({ deadline }, now))
      }
    }
  })

  it('gives every searchable collection one text index named "search"', () => {
    for (const model of [
      EventModel,
      OpportunityModel,
      PublicationModel,
      ResourceModel,
      CommitteeModel,
    ]) {
      const text = model.schema
        .indexes()
        .filter(([fields]) => Object.values(fields).includes('text'))
      expect(text, model.modelName).toHaveLength(1)
      expect(text[0]?.[1]?.name, model.modelName).toBe('search')
    }
  })

  it('documents the route', () => {
    expect(buildOpenApiDocument().paths?.['/api/search']?.get?.operationId).toBe('search')
  })
})
