import request from 'supertest'
import { describe, expect, it } from 'vitest'
import { buildOpenApiDocument } from '../src/docs/openapi.js'
import { listForSession, type SessionReader } from '../src/lib/sessions.js'
import { EXECUTIVE_OFFICES } from '../src/modules/executives/infrastructure/executive.model.js'
import { SENATE_POSITIONS } from '../src/modules/senate/infrastructure/senator.model.js'
import { testApp } from './helpers.js'

const get = (path: string) => request(testApp()).get(path)

describe('listForSession', () => {
  const reader = (data: Record<string, string[]>): SessionReader<string> => ({
    sessions: async () => Object.keys(data),
    listBySession: async (s) => data[s] ?? [],
  })

  it('defaults to the newest session with data', async () => {
    const result = await listForSession(reader({ '2025/2026': ['old'], '2026/2027': ['new'] }))
    expect(result).toEqual({
      session: '2026/2027',
      sessions: ['2026/2027', '2025/2026'],
      items: ['new'],
    })
  })

  it('returns the requested session, or an empty list when it has no data', async () => {
    const data = { '2025/2026': ['old'], '2026/2027': ['new'] }
    expect((await listForSession(reader(data), '2025/2026')).items).toEqual(['old'])
    expect(await listForSession(reader(data), '2019/2020')).toMatchObject({
      session: '2019/2020',
      items: [],
    })
  })

  it('returns session null when there is no data at all', async () => {
    expect(await listForSession(reader({}))).toEqual({ session: null, sessions: [], items: [] })
  })
})

describe('GET /api/executives', () => {
  it('returns the current Executive Council in constitutional order', async () => {
    const res = await get('/api/executives')

    expect(res.status).toBe(200)
    expect(res.headers['cache-control']).toBe('public, max-age=300')
    expect(res.body.session).toBe('2026/2027')
    expect(res.body.sessions).toEqual(['2026/2027'])
    expect(res.body.executives.map((e: { office: string }) => e.office)).toEqual([
      ...EXECUTIVE_OFFICES,
    ])
  })

  it('returns placeholders with their flag, note and empty optional fields', async () => {
    const executives = (await get('/api/executives')).body.executives
    const president = executives[0]
    const treasurer = executives.find((e: { office: string }) => e.office === 'Treasurer')

    expect(president).toMatchObject({ name: 'Abigail Moejoh', isPlaceholder: false })
    expect(treasurer).toEqual({
      session: '2026/2027',
      office: 'Treasurer',
      order: 5,
      name: 'Name to be announced',
      level: '',
      bio: '',
      photo: '',
      roleEmail: '',
      isPlaceholder: true,
      placeholderNote: expect.stringContaining("President's Exco document"),
    })
  })

  it('filters by session and returns an empty list for a session without data', async () => {
    expect((await get('/api/executives?session=2026/2027')).body.executives).toHaveLength(14)
    const res = await get('/api/executives?session=2019/2020')
    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({ session: '2019/2020', executives: [] })
  })

  it('rejects a malformed session or an unknown query parameter', async () => {
    for (const query of ['session=2026-2027', 'session=2026/2028', 'sort=name']) {
      const res = await get(`/api/executives?${query}`)
      expect(res.status, query).toBe(400)
      expect(res.body.error.code).toBe('VALIDATION_ERROR')
    }
  })
})

describe('GET /api/senate', () => {
  it('returns the four principal officers in order, as placeholders until the election', async () => {
    const res = await get('/api/senate')

    expect(res.status).toBe(200)
    expect(res.body.session).toBe('2026/2027')
    expect(res.body.senators.map((s: { position: string }) => s.position)).toEqual([
      ...SENATE_POSITIONS,
    ])
    expect(res.body.senators[0]).toMatchObject({
      name: 'Election pending',
      isPlaceholder: true,
      placeholderNote: expect.stringContaining('election'),
    })
  })
})

describe('GET /api/committees', () => {
  it('returns the current committees in display order, placeholders included', async () => {
    const res = await get('/api/committees')
    const committees = res.body.committees as {
      slug: string
      order: number
      isPlaceholder: boolean
    }[]

    expect(res.status).toBe(200)
    expect(res.body.session).toBe('2026/2027')
    expect(committees).toHaveLength(11)
    expect(committees.map((c) => c.order)).toEqual(
      [...committees.map((c) => c.order)].sort((a, b) => a - b),
    )
    expect(
      committees
        .filter((c) => c.isPlaceholder)
        .map((c) => c.slug)
        .sort(),
    ).toEqual([])
  })

  it('returns one committee with its officers', async () => {
    const res = await get('/api/committees/admap')

    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({ slug: 'admap', shortName: 'ADMAP', isPlaceholder: false })
    expect(res.body.officers[0]).toEqual({ title: 'Lead', name: 'Dada Aishat', level: '500L' })
    expect(res.body).not.toHaveProperty('placeholderNote')
    expect(res.body).not.toHaveProperty('_id')
  })

  it('returns 404 for an unknown committee and 400 for a malformed slug', async () => {
    const missing = await get('/api/committees/no-such-committee')
    expect(missing.status).toBe(404)
    expect(missing.body.error).toMatchObject({ code: 'NOT_FOUND', message: 'Committee not found' })

    expect((await get('/api/committees/ADMAP')).status).toBe(400)
  })
})

describe('GET /api/patrons', () => {
  it('returns the patrons with the Dean first', async () => {
    const res = await get('/api/patrons')

    expect(res.status).toBe(200)
    expect(res.body.patrons).toHaveLength(5)
    expect(res.body.patrons[0]).toMatchObject({
      order: 1,
      title: 'Dean, Faculty of Pharmacy',
      isDean: true,
      isPlaceholder: true,
    })
    expect(res.body.patrons.slice(1).every((p: { isDean: boolean }) => !p.isDean)).toBe(true)
  })
})

describe('leadership API docs', () => {
  it('documents every leadership route', () => {
    const paths = buildOpenApiDocument().paths ?? {}
    expect(
      [
        '/api/executives',
        '/api/senate',
        '/api/committees',
        '/api/committees/{slug}',
        '/api/patrons',
      ].map((path) => paths[path]?.get?.operationId),
    ).toEqual(['listExecutives', 'listSenate', 'listCommittees', 'getCommittee', 'listPatrons'])
  })
})
