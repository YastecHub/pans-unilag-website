import request from 'supertest'
import { describe, expect, it } from 'vitest'
import { buildOpenApiDocument } from '../src/docs/openapi.js'
import { testApp } from './helpers.js'

// The day before launch: all four 2026/27 events are upcoming; the 18 Health Week and
// Pharmalympics 2026 days have unknown dates, so they are past.
const LAUNCH_EVE = new Date('2026-10-15T20:00:00+01:00')
const get = (path: string, now = LAUNCH_EVE) => request(testApp({ now: () => now })).get(path)
const slugs = (body: { events: { slug: string }[] }) => body.events.map((e) => e.slug)

const HEALTH_WEEK = 'PANS Health Week 2026: Redefine+'

describe('GET /api/events', () => {
  it('lists upcoming events soonest first, with datePrecision and status', async () => {
    const res = await get('/api/events?status=upcoming')

    expect(res.status).toBe(200)
    expect(res.headers['cache-control']).toBe('public, max-age=300')
    expect(slugs(res.body)).toEqual([
      'freshers-week-2026',
      'pharmalympics-2027',
      'health-week-2027',
      'pans-dinner-2027',
    ])
    expect(res.body.events[1]).toMatchObject({
      datePrecision: 'month',
      status: 'upcoming',
      startsAt: '2027-03-31T23:00:00.000Z',
      isPlaceholder: false,
    })
    expect(res.body).toMatchObject({ page: 1, pageSize: 12, total: 4, totalPages: 1 })
  })

  it('lists the past days with unknown dates as past, without dates', async () => {
    const res = await get('/api/events?status=past&pageSize=50')

    expect(res.body.total).toBe(18)
    expect(res.body.events[0]).toMatchObject({
      datePrecision: 'unknown',
      startsAt: null,
      endsAt: null,
      status: 'past',
    })
  })

  it('returns a series as its days in order', async () => {
    const res = await get(`/api/events?series=${encodeURIComponent(HEALTH_WEEK)}`)

    expect(res.body.events.map((e: { dayNumber: number }) => e.dayNumber)).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8, 9,
    ])
    expect(res.body.events[4].title).toBe('Pharmathon')
  })

  it('moves Freshers’ Week to past at midnight Lagos time after its last day', async () => {
    const lastMinute = await get(
      '/api/events?status=upcoming',
      new Date('2026-12-04T23:59:00+01:00'),
    )
    const nextDay = await get('/api/events?status=upcoming', new Date('2026-12-05T00:00:00+01:00'))

    expect(slugs(lastMinute.body)).toContain('freshers-week-2026')
    expect(slugs(nextDay.body)).not.toContain('freshers-week-2026')
    const past = await get(
      '/api/events?status=past&pageSize=1',
      new Date('2026-12-05T00:00:00+01:00'),
    )
    expect(slugs(past.body)).toEqual(['freshers-week-2026'])
  })

  it('without a status, puts upcoming events before past ones', async () => {
    const res = await get('/api/events?pageSize=50')

    expect(res.body.total).toBe(22)
    expect(
      res.body.events.slice(0, 4).every((e: { status: string }) => e.status === 'upcoming'),
    ).toBe(true)
    expect(res.body.events.slice(4).every((e: { status: string }) => e.status === 'past')).toBe(
      true,
    )
  })

  it('filters by Lagos month', async () => {
    expect(slugs((await get('/api/events?month=2027-05')).body)).toEqual(['pharmalympics-2027'])
    expect(slugs((await get('/api/events?month=2026-12')).body)).toEqual(['freshers-week-2026'])
    expect((await get('/api/events?month=2026-10')).body).toMatchObject({ events: [], total: 0 })
  })

  it('pages results', async () => {
    const page2 = (await get('/api/events?pageSize=10&page=2')).body
    expect(page2).toMatchObject({ page: 2, pageSize: 10, total: 22, totalPages: 3 })
    expect(page2.events).toHaveLength(10)
    expect((await get('/api/events?pageSize=10&page=4')).body.events).toEqual([])
  })

  it('rejects bad filters', async () => {
    for (const query of ['status=soon', 'month=2027-13', 'page=0', 'pageSize=51', 'sort=title']) {
      const res = await get(`/api/events?${query}`)
      expect(res.status, query).toBe(400)
      expect(res.body.error.code).toBe('VALIDATION_ERROR')
    }
  })
})

describe('GET /api/events/:slug', () => {
  it('returns one event with its status', async () => {
    const res = await get('/api/events/pans-dinner-2027')

    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({
      slug: 'pans-dinner-2027',
      datePrecision: 'month',
      status: 'upcoming',
      series: '',
      dayNumber: null,
      registrationUrl: '',
    })
    expect(res.body).not.toHaveProperty('_id')
  })

  it('returns 404 for an unknown event and 400 for a malformed slug', async () => {
    const missing = await get('/api/events/no-such-event')
    expect(missing.status).toBe(404)
    expect(missing.body.error).toMatchObject({ code: 'NOT_FOUND', message: 'Event not found' })
    expect((await get('/api/events/Freshers_Week')).status).toBe(400)
  })
})

describe('albums', () => {
  it('lists album cards by series and day, without photo lists', async () => {
    const res = await get('/api/albums')
    const albums = res.body.albums as { slug: string; photoCount: number }[]

    expect(res.status).toBe(200)
    expect(albums).toHaveLength(18)
    expect(albums[0]).toEqual({
      slug: 'health-week-2026-day-1',
      title: 'Trade Fair & Cooking Competition',
      event: 'health-week-2026-day-1',
      series: HEALTH_WEEK,
      cover: '',
      photoCount: 0,
      isPlaceholder: true,
      placeholderNote: expect.stringContaining('Media Committee'),
    })
    expect(albums.slice(0, 9).map((a) => a.slug.at(-1))).toEqual([
      '1',
      '2',
      '3',
      '4',
      '5',
      '6',
      '7',
      '8',
      '9',
    ])
  })

  it('filters albums by series', async () => {
    const res = await get('/api/albums?series=Pharmalympics%202026')
    expect(res.body.albums).toHaveLength(9)
  })

  it('returns one album with its photos, and 404 for an unknown album', async () => {
    const res = await get('/api/albums/pharmalympics-2026-day-9')
    expect(res.body).toMatchObject({
      slug: 'pharmalympics-2026-day-9',
      photos: [],
      sourceFolderUrl: '',
    })
    expect(res.body).not.toHaveProperty('consentConfirmed')

    const missing = await get('/api/albums/no-such-album')
    expect(missing.status).toBe(404)
    expect(missing.body.error.message).toBe('Album not found')
  })
})

describe('album with photos', () => {
  it('returns photos with alt text and the cover, and counts them on the card', async () => {
    const album = {
      slug: 'health-week-2026-day-3',
      title: 'Medical Outreach 2026',
      event: 'health-week-2026-day-3',
      series: HEALTH_WEEK,
      cover: 'pans-unilag/events/health-week-2026/day-3/photo-02',
      photos: [1, 2].map((n) => ({
        publicId: `pans-unilag/events/health-week-2026/day-3/photo-0${n}`,
        alt: `Students checking blood pressure (${n})`,
      })),
      sourceFolderUrl: 'https://drive.google.com/drive/folders/example',
      consentConfirmed: true,
    }
    const app = testApp({
      readers: { albums: { list: async () => [album], findBySlug: async () => album } },
    })

    expect((await request(app).get('/api/albums')).body.albums[0]).toMatchObject({
      photoCount: 2,
      cover: album.cover,
      isPlaceholder: false,
    })
    const detail = (await request(app).get(`/api/albums/${album.slug}`)).body
    expect(detail.photos[0]).toEqual({ ...album.photos[0], caption: '' })
    expect(detail.sourceFolderUrl).toBe(album.sourceFolderUrl)
    expect(detail).not.toHaveProperty('consentConfirmed')
  })
})

describe('events API docs', () => {
  it('documents the events and albums routes', () => {
    const paths = buildOpenApiDocument().paths ?? {}
    expect(
      ['/api/events', '/api/events/{slug}', '/api/albums', '/api/albums/{slug}'].map(
        (path) => paths[path]?.get?.operationId,
      ),
    ).toEqual(['listEvents', 'getEvent', 'listAlbums', 'getAlbum'])
  })
})
