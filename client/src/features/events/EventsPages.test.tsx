import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { apiError, jsonResponse, mockApi } from '../../test/mockApi.ts'
import { renderRoute } from '../../test/renderRoute.tsx'
import albumsJson from '../../../../server/seed/albums.json?raw'
import eventsJson from '../../../../server/seed/events.json?raw'
import { lagosMonth } from '../../lib/dates.ts'
import type { EventItem } from './api/events.ts'

/** The seed events as the API returns them on 16 Oct 2026 (status worked out as the server does). */
const NOW = '2026-10-16T12:00:00Z'
const iso = (v: unknown) => (v ? new Date(v as string).toISOString() : null)
const seedEvents: EventItem[] = (JSON.parse(eventsJson) as Record<string, unknown>[]).map((e) => {
  const datePrecision = (e.datePrecision as EventItem['datePrecision']) ?? 'day'
  const endsAt = iso(e.endsAt)
  return {
    series: '',
    dayNumber: null,
    venue: '',
    description: '',
    coverImage: '',
    registrationUrl: '',
    committee: '',
    ...(e as object),
    startsAt: iso(e.startsAt),
    endsAt,
    datePrecision,
    status: datePrecision !== 'unknown' && endsAt && endsAt > NOW ? 'upcoming' : 'past',
  } as EventItem
})
const seedAlbums = (JSON.parse(albumsJson) as { slug: string }[]).map((a) => ({
  cover: '',
  photoCount: 0,
  ...a,
}))

const time = (v: string | null) => (v ? Date.parse(v) : Number.MAX_SAFE_INTEGER)

/** A small stand-in for GET /api/events with the server's filters and order. */
function eventsApi(events: EventItem[]) {
  return (url: URL) => {
    const q = url.searchParams
    const month = q.get('month')
    const list = events
      .filter((e) => !q.get('status') || e.status === q.get('status'))
      .filter((e) => !q.get('series') || e.series === q.get('series'))
      .filter(
        (e) =>
          !month ||
          (e.datePrecision !== 'unknown' &&
            lagosMonth(e.startsAt!) <= month &&
            lagosMonth(e.endsAt!) >= month),
      )
      .sort((a, b) =>
        a.status === 'upcoming' && b.status === 'upcoming'
          ? time(a.startsAt) - time(b.startsAt)
          : a.series.localeCompare(b.series) || (a.dayNumber ?? 0) - (b.dayNumber ?? 0),
      )
    const pageSize = Number(q.get('pageSize') ?? 12)
    return jsonResponse(200, {
      events: list.slice(0, pageSize),
      page: 1,
      pageSize,
      total: list.length,
      totalPages: Math.max(1, Math.ceil(list.length / pageSize)),
    })
  }
}

function api({ events = seedEvents, albums = seedAlbums } = {}) {
  return mockApi({
    '/api/events': eventsApi(events),
    ...Object.fromEntries(events.map((e) => [`/api/events/${e.slug}`, e])),
    '/api/albums': { albums },
    '/api/committees': {
      session: '2026/2027',
      sessions: ['2026/2027'],
      committees: [{ slug: 'ppht', shortName: 'PPHT', name: 'Public Health Team' }],
    },
  })
}

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

const main = () => document.getElementById('main')!

describe('Upcoming events', () => {
  it('lists the four 2026/27 events soonest first, with month-only dates never given a day', async () => {
    api()
    renderRoute('/events')
    expect(await within(main()).findByRole('heading', { name: "Freshers' Week" })).toBeTruthy()
    const articles = within(main()).getAllByRole('article')
    expect(articles.map((a) => within(a).getByRole('heading').textContent)).toEqual([
      "Freshers' Week",
      'Pharmalympics 2027',
      'PANS Health Week 2027',
      'PANS Dinner',
    ])
    expect(articles.map((a) => a.textContent)).toEqual([
      expect.stringContaining('30 Nov – 4 Dec 2026'),
      expect.stringContaining('April – May 2027'),
      expect.stringContaining('7 – 11 Jun 2027'),
      expect.stringContaining('September 2027'),
    ])
    // Add to calendar only where the exact dates are known; Register only with a link.
    const withCalendar = articles.filter((a) =>
      within(a).queryByRole('button', { name: /Add to calendar/ }),
    )
    expect(withCalendar.map((a) => within(a).getByRole('heading').textContent)).toEqual([
      "Freshers' Week",
      'PANS Health Week 2027',
    ])
    expect(within(articles[1]!).getByText('Exact dates to be confirmed')).toBeTruthy()
    expect(within(main()).queryByRole('link', { name: /Register/ })).toBeNull()
  })

  it('shows Register when the event has a registration link', async () => {
    const events = seedEvents.map((e) =>
      e.slug === 'freshers-week-2026' ? { ...e, registrationUrl: 'https://forms.gle/abc' } : e,
    )
    api({ events })
    renderRoute('/events')
    const register = await within(main()).findByRole('link', { name: /Register for Freshers/ })
    expect(register.getAttribute('href')).toBe('https://forms.gle/abc')
    expect(register.getAttribute('target')).toBe('_blank')
  })

  it('downloads an .ics file in Lagos time', async () => {
    api()
    let saved: Blob | undefined
    vi.spyOn(URL, 'createObjectURL').mockImplementation((blob) => {
      saved = blob as Blob
      return 'blob:ics'
    })
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})

    renderRoute('/events')
    const freshers = (await within(main()).findAllByRole('article'))[0]!
    await userEvent.click(within(freshers).getByRole('button', { name: /Add to calendar/ }))

    expect(click).toHaveBeenCalledOnce()
    expect(saved?.type).toBe('text/calendar;charset=utf-8')
    const text = await saved!.text()
    expect(text).toContain('DTSTART;VALUE=DATE:20261130')
    expect(text).toContain('DTEND;VALUE=DATE:20261205')
    const google = within(freshers).getByRole('link', { name: /Google Calendar/ })
    expect(google.getAttribute('href')).toContain('ctz=Africa%2FLagos')
  })

  it('says so when nothing is coming up', async () => {
    api({ events: seedEvents.filter((e) => e.status === 'past') })
    renderRoute('/events')
    expect(await within(main()).findByText(/No upcoming events yet/)).toBeTruthy()
    expect(within(main()).getByRole('link', { name: 'See past events' })).toBeTruthy()
  })
})

describe('Month view', () => {
  it('puts each event on its Lagos days and moves between months', async () => {
    api()
    renderRoute('/events?view=month&month=2026-11')
    expect(await within(main()).findByRole('heading', { name: 'November 2026' })).toBeTruthy()
    expect(within(main()).getByRole('link', { name: 'Month' }).getAttribute('aria-current')).toBe(
      'page',
    )
    const table = await within(main()).findByRole('table', { name: 'Events in November 2026' })
    const cell = table.querySelector('time[datetime="2026-11-30"]')!.closest('td')!
    expect(within(cell).getByRole('link', { name: "Freshers' Week" })).toBeTruthy()

    await userEvent.click(within(main()).getByRole('link', { name: 'Next month: December 2026' }))
    const december = await within(main()).findByRole('table', { name: 'Events in December 2026' })
    expect(within(december).getAllByRole('link', { name: "Freshers' Week" })).toHaveLength(4)
  })

  it('lists month-only events under the grid instead of on a guessed day', async () => {
    api()
    renderRoute('/events?view=month&month=2027-04')
    const undated = await within(main()).findByRole('heading', {
      name: 'Exact dates to be confirmed',
    })
    const section = undated.closest('section')!
    expect(within(section).getByRole('link', { name: 'Pharmalympics 2027' })).toBeTruthy()
    const table = within(main()).getByRole('table')
    expect(within(table).queryAllByRole('link')).toHaveLength(0)
  })

  it('points an empty month to the next month with something on', async () => {
    api()
    renderRoute('/events?view=month&month=2026-10')
    expect(await within(main()).findByText('Nothing scheduled for October 2026.')).toBeTruthy()
    const jump = await within(main()).findByRole('link', { name: 'Jump to November 2026' })
    expect(jump.getAttribute('href')).toBe('/events?view=month&month=2026-11')
  })
})

describe('Past events', () => {
  it('groups the days by series, in day order', async () => {
    api()
    renderRoute('/events/past')
    const groups = await within(main()).findAllByRole('heading', { level: 2 })
    expect(groups.map((h) => h.textContent)).toEqual([
      'PANS Health Week 2026: Redefine+',
      'Pharmalympics 2026',
    ])
    const health = groups[0]!.closest('section')!
    const cards = within(health).getAllByRole('link', { name: /Day \d/ })
    expect(cards).toHaveLength(9)
    expect(cards[0]!.textContent).toContain('Day 1')
    expect(cards[0]!.textContent).toContain('Trade Fair & Cooking Competition')
    expect(within(health).getAllByText('Date to be announced')).toHaveLength(9)
    expect(cards[2]!.getAttribute('href')).toBe('/events/health-week-2026-day-3')
  })
})

describe('Event page', () => {
  it('shows a past day with its series, organiser and album placeholder, without calendar actions', async () => {
    api()
    renderRoute('/events/health-week-2026-day-3')
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Medical Outreach 2026' }),
    ).toBeTruthy()
    expect(screen.getByText('PANS Health Week 2026: Redefine+ · Day 3')).toBeTruthy()
    expect(within(main()).getByRole('link', { name: 'Past events' })).toBeTruthy()
    expect((await within(main()).findByRole('link', { name: 'PPHT' })).getAttribute('href')).toBe(
      '/leadership/committees/ppht',
    )
    expect(within(main()).queryByRole('button', { name: /Add to calendar/ })).toBeNull()
    expect(await within(main()).findByText('Photos coming soon')).toBeTruthy()

    const days = await screen.findByRole('navigation', { name: 'PANS Health Week 2026: Redefine+' })
    expect(within(days).getAllByRole('link')).toHaveLength(9)
    expect(within(days).getByRole('link', { current: 'page' }).textContent).toBe(
      'Day 3: Medical Outreach 2026',
    )
  })

  it('links to the album once its photos are up', async () => {
    const albums = seedAlbums.map((a) =>
      a.slug === 'health-week-2026-day-3' ? { ...a, photoCount: 24, isPlaceholder: false } : a,
    )
    api({ albums })
    renderRoute('/events/health-week-2026-day-3')
    const link = await within(main()).findByRole('link', { name: 'See the album (24 photos)' })
    expect(link.getAttribute('href')).toBe('/gallery/health-week-2026-day-3')
  })

  it('offers Add to calendar for exact dates only', async () => {
    api()
    renderRoute('/events/pharmalympics-2027')
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Pharmalympics 2027' }),
    ).toBeTruthy()
    expect(within(main()).getByText('April – May 2027')).toBeTruthy()
    expect(within(main()).getByText('Exact dates to be confirmed')).toBeTruthy()
    expect(within(main()).queryByRole('button', { name: /Add to calendar/ })).toBeNull()
  })

  it('explains when the event does not exist', async () => {
    api()
    mockApi({
      '/api/events/nope': () => jsonResponse(404, apiError('NOT_FOUND', 'Event not found')),
    })
    renderRoute('/events/nope')
    expect(await screen.findByRole('heading', { level: 1, name: 'Event not found' })).toBeTruthy()
    expect(within(main()).getAllByRole('link', { name: 'Past events' }).length).toBeGreaterThan(0)
  })
})
