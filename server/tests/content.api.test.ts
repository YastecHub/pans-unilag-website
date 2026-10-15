import request from 'supertest'
import { describe, expect, it } from 'vitest'
import type { Readers } from '../src/app.js'
import { buildOpenApiDocument } from '../src/docs/openapi.js'
import {
  activeAnnouncements,
  isActive,
  type StoredAnnouncement,
} from '../src/modules/announcements/application/announcementView.js'
import {
  latestVersions,
  type StoredDocument,
} from '../src/modules/documents/application/documentView.js'
import {
  isOpen,
  openOpportunities,
  type StoredOpportunity,
} from '../src/modules/opportunities/application/opportunityView.js'
import type { StoredResource } from '../src/modules/resources/application/resourceView.js'
import { testApp } from './helpers.js'

const at = (iso: string) => new Date(iso)
const NOW = at('2026-10-16T09:00:00+01:00') // launch morning

const get = (path: string, readers: Partial<Readers> = {}, now = NOW) =>
  request(testApp({ readers, now: () => now })).get(path)

const announcement = (fields: Partial<StoredAnnouncement> & { title: string }) => ({
  body: 'Text',
  publishAt: at('2026-10-01T00:00:00+01:00'),
  ...fields,
})

const opportunity = (fields: Partial<StoredOpportunity> & { slug: string }): StoredOpportunity => ({
  title: fields.slug,
  type: 'scholarship',
  applyUrl: 'https://example.com/apply',
  ...fields,
})

describe('announcements: active only, pinned first', () => {
  const stored = [
    announcement({ title: 'old', publishAt: at('2026-10-02T00:00:00+01:00') }),
    announcement({ title: 'new', publishAt: at('2026-10-10T00:00:00+01:00') }),
    announcement({ title: 'pinned', pinned: true }),
    announcement({ title: 'expired', expiresAt: at('2026-10-16T09:00:00+01:00') }),
    announcement({ title: 'scheduled', publishAt: at('2026-10-16T09:00:01+01:00') }),
    announcement({ title: 'until tonight', expiresAt: at('2026-10-17T00:00:00+01:00') }),
  ]

  it('hides expired and not-yet-published announcements', () => {
    // expiresAt is exclusive: hidden from that moment on.
    expect(isActive(stored[3]!, NOW)).toBe(false)
    expect(isActive(stored[3]!, at('2026-10-16T08:59:59.999+01:00'))).toBe(true)
    expect(isActive(stored[4]!, NOW)).toBe(false)
  })

  it('returns pinned first, then newest first', async () => {
    const res = await get('/api/announcements', { announcements: { list: async () => stored } })

    expect(res.status).toBe(200)
    expect(res.headers['cache-control']).toBe('public, max-age=300')
    expect(res.body.announcements.map((a: { title: string }) => a.title)).toEqual([
      'pinned',
      'new',
      'old',
      'until tonight',
    ])
    expect(activeAnnouncements(stored, NOW).some((a) => a.title === 'expired')).toBe(false)
  })

  it('returns an empty list when there are none (the home page shows its empty state)', async () => {
    expect((await get('/api/announcements')).body).toEqual({ announcements: [] })
  })
})

describe('opportunities: open only, closing soonest first', () => {
  const stored = [
    opportunity({ slug: 'rolling' }),
    opportunity({ slug: 'closes-today', deadline: at('2026-10-16T00:00:00+01:00') }),
    opportunity({ slug: 'closed-yesterday', deadline: at('2026-10-15T23:59:59+01:00') }),
    opportunity({
      slug: 'closes-next-week',
      type: 'internship',
      deadline: at('2026-10-23T00:00:00+01:00'),
    }),
  ]
  const readers: Partial<Readers> = {
    opportunities: {
      list: async ({ type }) => stored.filter((o) => !type || o.type === type),
      findBySlug: async (slug) => stored.find((o) => o.slug === slug) ?? null,
    },
  }

  it('keeps an opportunity open all of its deadline day in Lagos, then closes it', () => {
    const deadline = { deadline: at('2026-10-16T00:00:00+01:00') }
    expect(isOpen(deadline, at('2026-10-16T23:59:59.999+01:00'))).toBe(true)
    expect(isOpen(deadline, at('2026-10-17T00:00:00+01:00'))).toBe(false)
    expect(isOpen({ deadline: null }, at('2099-01-01T00:00:00Z'))).toBe(true)
  })

  it('never returns past-deadline opportunities; rolling ones come last', async () => {
    const res = await get('/api/opportunities', readers)

    expect(res.body.opportunities.map((o: { slug: string }) => o.slug)).toEqual([
      'closes-today',
      'closes-next-week',
      'rolling',
    ])
    expect(res.body.opportunities[2].deadline).toBeNull()
    expect(openOpportunities(stored, at('2026-10-24T00:00:00+01:00')).map((o) => o.slug)).toEqual([
      'rolling',
    ])
  })

  it('filters by type and rejects an unknown type', async () => {
    const res = await get('/api/opportunities?type=internship', readers)
    expect(res.body.opportunities.map((o: { slug: string }) => o.slug)).toEqual([
      'closes-next-week',
    ])
    expect((await get('/api/opportunities?type=lottery', readers)).status).toBe(400)
  })

  it('returns an open opportunity by slug and 404 for a closed or unknown one', async () => {
    const open = await get('/api/opportunities/closes-today', readers)
    expect(open.status).toBe(200)
    expect(open.body).toMatchObject({ slug: 'closes-today', applyUrl: 'https://example.com/apply' })

    for (const slug of ['closed-yesterday', 'no-such-listing']) {
      const res = await get(`/api/opportunities/${slug}`, readers)
      expect(res.status, slug).toBe(404)
      expect(res.body.error.message).toBe('Opportunity not found')
    }
  })
})

describe('publications', () => {
  it('returns the three placeholder series from the seed file', async () => {
    const res = await get('/api/publications')

    expect(res.status).toBe(200)
    expect(res.body.publications.map((p: { series: string }) => p.series).sort()).toEqual([
      'newspaper',
      'recipharm',
      'substack',
    ])
    expect(res.body.publications.every((p: { isPlaceholder: boolean }) => p.isPlaceholder)).toBe(
      true,
    )
  })

  it('filters by series and rejects an unknown one', async () => {
    const res = await get('/api/publications?series=recipharm')
    expect(res.body.publications).toHaveLength(1)
    expect(res.body.publications[0]).toMatchObject({ slug: 'recipharm', fileUrl: '', link: '' })
    expect((await get('/api/publications?series=blog')).status).toBe(400)
  })
})

describe('documents: the latest approved version of each', () => {
  it('returns the constitution as a placeholder until the PDF is uploaded', async () => {
    const res = await get('/api/documents')

    expect(res.body.documents).toHaveLength(1)
    expect(res.body.documents[0]).toMatchObject({
      slug: 'constitution',
      version: '2026',
      approvedOn: '2026-07-08T23:00:00.000Z',
      pageCount: 55,
      fileUrl: '',
      isPlaceholder: true,
    })
  })

  it('keeps only the most recently approved version', () => {
    const versions: StoredDocument[] = [
      { slug: 'constitution', title: 'Constitution', version: '2019', approvedOn: '2019-05-01' },
      { slug: 'constitution', title: 'Constitution', version: '2026', approvedOn: '2026-07-09' },
      { slug: 'code-of-conduct', title: 'Code of conduct', version: '1', approvedOn: '2025-01-01' },
    ]
    expect(latestVersions(versions).map((d) => `${d.slug}@${d.version}`)).toEqual([
      'code-of-conduct@1',
      'constitution@2026',
    ])
  })
})

describe('resources', () => {
  const stored: StoredResource[] = [
    {
      title: 'B',
      level: '200L',
      semester: 'second',
      course: 'PCT201',
      url: 'https://x.org/b',
      verifiedBy: 'A',
    },
    {
      title: 'A',
      level: '200L',
      semester: 'first',
      course: 'PCH201',
      url: 'https://x.org/a',
      verifiedBy: 'A',
    },
    {
      title: 'C',
      level: '100L',
      semester: 'first',
      course: 'BIO101',
      url: 'https://x.org/c',
      verifiedBy: 'A',
    },
  ]
  const readers: Partial<Readers> = {
    resources: {
      list: async ({ level, semester }) =>
        stored.filter(
          (r) => (!level || r.level === level) && (!semester || r.semester === semester),
        ),
    },
  }

  it('sorts by level, semester and course', async () => {
    const res = await get('/api/resources', readers)
    expect(res.body.resources.map((r: { title: string }) => r.title)).toEqual(['C', 'A', 'B'])
  })

  it('filters by level and semester and rejects unknown values', async () => {
    const res = await get('/api/resources?level=200L&semester=first', readers)
    expect(res.body.resources.map((r: { title: string }) => r.title)).toEqual(['A'])
    expect((await get('/api/resources?level=600L', readers)).status).toBe(400)
    expect((await get('/api/resources?semester=third', readers)).status).toBe(400)
  })

  it('returns an empty list until the Academics Committee adds links', async () => {
    expect((await get('/api/resources')).body).toEqual({ resources: [] })
  })
})

describe('content API docs', () => {
  it('documents every route', () => {
    const paths = buildOpenApiDocument().paths ?? {}
    expect(
      [
        '/api/announcements',
        '/api/opportunities',
        '/api/opportunities/{slug}',
        '/api/publications',
        '/api/documents',
        '/api/resources',
      ].map((path) => paths[path]?.get?.operationId),
    ).toEqual([
      'listAnnouncements',
      'listOpportunities',
      'getOpportunity',
      'listPublications',
      'listDocuments',
      'listResources',
    ])
  })
})
