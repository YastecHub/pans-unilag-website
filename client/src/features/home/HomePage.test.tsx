import { screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { apiError, jsonResponse, mockApi } from '../../test/mockApi.ts'
import { renderRoute } from '../../test/renderRoute.tsx'

const event = (
  slug: string,
  title: string,
  startsAt: string,
  endsAt: string,
  datePrecision = 'day',
) => ({
  slug,
  title,
  series: '',
  dayNumber: null,
  startsAt,
  endsAt,
  datePrecision,
  status: 'upcoming',
  venue: '',
  description: '',
  coverImage: '',
  coverImageAlt: '',
  registrationUrl: '',
  committee: '',
  isPlaceholder: true,
  placeholderNote: 'Venue to be confirmed',
})

const upcoming = {
  events: [
    event(
      'freshers-week-2026',
      'Freshers’ Week',
      '2026-11-29T23:00:00.000Z',
      '2026-12-04T22:59:59.000Z',
    ),
    event(
      'pharmalympics-2027',
      'Pharmalympics 2027',
      '2027-03-31T23:00:00.000Z',
      '2027-05-31T22:59:59.000Z',
      'month',
    ),
    event(
      'health-week-2027',
      'PANS Health Week 2027',
      '2027-06-06T23:00:00.000Z',
      '2027-06-11T22:59:59.000Z',
    ),
  ],
  page: 1,
  pageSize: 3,
  total: 4,
  totalPages: 2,
}

const committee = (i: number) => ({
  slug: `committee-${i}`,
  name: `Committee number ${i}`,
  shortName: `C${i}`,
  session: '2026/2027',
  order: i,
  description: '',
  activities: [],
  achievements: [],
  plans: [],
  motto: '',
  officers: i === 1 ? [{ title: 'Lead', name: 'Dada Aishat', level: '500L' }] : [],
  coverImage: '',
  isPlaceholder: false,
})

const album = (series: string, day: number) => ({
  slug: `${series}-day-${day}`.toLowerCase().replace(/\W+/g, '-'),
  title: `Day ${day}`,
  event: 'x',
  series,
  cover: '',
  photoCount: 0,
  isPlaceholder: true,
})

const API = {
  '/api/announcements': {
    announcements: [
      {
        id: 'a2',
        title: 'Freshers’ Week registration',
        body: 'Register at the PANS stand.',
        publishAt: '2026-10-10T08:00:00.000Z',
        expiresAt: null,
        pinned: true,
        link: '',
        isPlaceholder: false,
      },
    ],
  },
  '/api/events': upcoming,
  '/api/opportunities': { opportunities: [] },
  '/api/committees': {
    session: '2026/2027',
    sessions: ['2026/2027'],
    committees: Array.from({ length: 11 }, (_, i) => committee(i + 1)),
  },
  '/api/albums': {
    albums: [
      ...[1, 2, 3].map((d) => album('PANS Health Week 2026: Redefine+', d)),
      ...[1, 2].map((d) => album('Pharmalympics 2026', d)),
    ],
  },
}

afterEach(() => {
  vi.unstubAllGlobals()
})

const section = async (name: string) => {
  const heading = await screen.findByRole('heading', { level: 2, name })
  return heading.closest('section') as HTMLElement
}

describe('home page', () => {
  it('shows the sections in the README order', async () => {
    mockApi(API)
    renderRoute('/')
    await screen.findByText('Freshers’ Week registration')
    const main = document.getElementById('main')!
    const headings = within(main)
      .getAllByRole('heading', { level: 2 })
      .map((h) => h.textContent)
    expect(headings).toEqual([
      'Announcements',
      'Upcoming events',
      'Open opportunities',
      'Our committees',
      'From the gallery',
      'Student tools',
    ])
  })

  it('shows pinned announcements with their date', async () => {
    mockApi(API)
    renderRoute('/')
    const box = await section('Announcements')
    expect(await within(box).findByText('Pinned')).toBeTruthy()
    expect(within(box).getByText('10 Oct 2026')).toBeTruthy()
  })

  it('leaves out the announcements section when there are none', async () => {
    mockApi({ ...API, '/api/announcements': { announcements: [] } })
    renderRoute('/')
    await screen.findByText('Freshers’ Week')
    expect(screen.queryByRole('heading', { level: 2, name: 'Announcements' })).toBeNull()
  })

  it('asks for the next three upcoming events and shows their dates the way people write them', async () => {
    const fetchMock = mockApi(API)
    renderRoute('/')
    const box = await section('Upcoming events')

    expect(await within(box).findByText('30 Nov – 4 Dec 2026')).toBeTruthy()
    expect(within(box).getByText('April – May 2027')).toBeTruthy()
    expect(within(box).getByText('7 – 11 Jun 2027')).toBeTruthy()
    expect(within(box).getAllByText('Venue to be announced')).toHaveLength(3)
    expect(
      within(box)
        .getByRole('link', { name: /Freshers’ Week/ })
        .getAttribute('href'),
    ).toBe('/events/freshers-week-2026')
    expect(fetchMock.mock.calls.map(([url]) => String(url))).toContain(
      '/api/events?status=upcoming&pageSize=3',
    )
  })

  it('shows a friendly empty state when nothing is coming up', async () => {
    mockApi({ ...API, '/api/events': { ...upcoming, events: [], total: 0, totalPages: 1 } })
    renderRoute('/')
    const box = await section('Upcoming events')
    expect(await within(box).findByText('No upcoming events yet. Check back soon.')).toBeTruthy()
    expect(within(box).getByRole('link', { name: 'See past events' }).getAttribute('href')).toBe(
      '/events/past',
    )
  })

  it('shows the opportunities empty state', async () => {
    mockApi(API)
    renderRoute('/')
    const box = await section('Open opportunities')
    expect(
      await within(box).findByText('No open opportunities right now. Check back soon.'),
    ).toBeTruthy()
  })

  it('lists open opportunities with their closing date', async () => {
    mockApi({
      ...API,
      '/api/opportunities': {
        opportunities: [
          {
            slug: 'nafdac-internship',
            title: 'NAFDAC internship',
            type: 'internship',
            organisation: 'NAFDAC',
            eligibility: '',
            description: '',
            deadline: '2026-11-29T23:00:00.000Z',
            applyUrl: 'https://example.org',
            lastCheckedAt: null,
            isPlaceholder: false,
          },
        ],
      },
    })
    renderRoute('/')
    const box = await section('Open opportunities')
    expect(await within(box).findByText('Internship')).toBeTruthy()
    expect(within(box).getByText('30 Nov 2026')).toBeTruthy()
  })

  it('shows six committees, the session count and a link to all of them', async () => {
    mockApi(API)
    renderRoute('/')
    const box = await section('Our committees')
    expect(
      await within(box).findByText('11 committees run PANS projects in the 2026/27 session.'),
    ).toBeTruthy()
    expect(within(box).getAllByRole('heading', { level: 3 })).toHaveLength(6)
    expect(within(box).getByText('Lead: Dada Aishat')).toBeTruthy()
    expect(within(box).getAllByText('Officers to be announced')).toHaveLength(5)
    expect(within(box).getByRole('link', { name: 'All 11 committees' }).getAttribute('href')).toBe(
      '/leadership/committees',
    )
  })

  it('shows one gallery highlight per series, with photos still to come', async () => {
    mockApi(API)
    renderRoute('/')
    const box = await section('From the gallery')
    expect(await within(box).findByText('PANS Health Week 2026: Redefine+')).toBeTruthy()
    expect(within(box).getByText('3 albums · photos coming soon')).toBeTruthy()
    expect(within(box).getByText('2 albums · photos coming soon')).toBeTruthy()
  })

  it('keeps the rest of the page working when one section fails', async () => {
    mockApi({
      ...API,
      '/api/events': () => jsonResponse(500, apiError('INTERNAL_ERROR', 'Something went wrong')),
    })
    renderRoute('/')
    const box = await section('Upcoming events')
    expect(await within(box).findByText('We couldn’t load upcoming events.')).toBeTruthy()
    expect(within(box).getByRole('button', { name: 'Try again' })).toBeTruthy()
    expect(within(box).getByText('test-request-id')).toBeTruthy()
    expect(await screen.findByText('Lead: Dada Aishat')).toBeTruthy()
  })

  it('links the student tools', async () => {
    mockApi(API)
    renderRoute('/')
    const box = await section('Student tools')
    expect(
      within(box).getByRole('link', { name: 'Open the calculator' }).getAttribute('href'),
    ).toBe('/academics/cgpa-calculator')
    expect(within(box).getByRole('link', { name: 'Give feedback' }).getAttribute('href')).toBe(
      '/connect/feedback',
    )
  })
})
