import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
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
  '/api/events': upcoming,
  '/api/executives': {
    session: '2026/2027',
    sessions: ['2026/2027'],
    executives: [
      {
        session: '2026/2027',
        office: 'President',
        order: 1,
        name: 'Owolabi Joshua',
        isPlaceholder: false,
      },
      {
        session: '2026/2027',
        office: 'Treasurer',
        order: 5,
        name: 'Name to be announced',
        isPlaceholder: true,
      },
    ],
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
  it('shows the sections in the requested order', async () => {
    mockApi(API)
    renderRoute('/')
    await screen.findByText('PANS Leadership 26/27')
    const main = document.getElementById('main')!
    const headings = within(main)
      .getAllByRole('heading', { level: 2 })
      .map((h) => h.textContent)
    expect(headings).toEqual([
      'Upcoming events',
      'PANS Leadership 26/27',
      'From the gallery',
      'Student tools',
    ])
  })

  it('asks for upcoming events and shows their dates the way people write them', async () => {
    const fetchMock = mockApi(API)
    renderRoute('/')
    const box = await section('Upcoming events')

    expect(await within(box).findByText('30 Nov – 4 Dec 2026')).toBeTruthy()
    expect(within(box).getByText('April – May 2027')).toBeTruthy()
    expect(within(box).getByText('7 – 11 Jun 2027')).toBeTruthy()
    expect(
      within(box)
        .getByRole('link', { name: /Freshers’ Week/ })
        .getAttribute('href'),
    ).toBe('/events/freshers-week-2026')
    expect(fetchMock.mock.calls.map(([url]) => String(url))).toContain(
      '/api/events?status=upcoming&pageSize=4',
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

  it('shows the PANS Leadership 26/27 slider with read more links', async () => {
    mockApi(API)
    renderRoute('/')
    const box = await section('PANS Leadership 26/27')
    expect(await within(box).findByText('Owolabi Joshua')).toBeTruthy()
    expect(within(box).getByText('President')).toBeTruthy()
    expect(
      within(box)
        .getByRole('link', { name: 'Read more about Owolabi Joshua' })
        .getAttribute('href'),
    ).toBe('/leadership/executive-council')
    expect(within(box).getByRole('button', { name: 'Previous executive' })).toBeTruthy()
    expect(within(box).getByRole('button', { name: 'Next executive' })).toBeTruthy()
    // WCAG 2.2.2: anything that moves by itself can be paused.
    const pause = within(box).getByRole('button', { name: 'Pause slideshow' })
    await userEvent.click(pause)
    expect(within(box).getByRole('button', { name: 'Play slideshow' })).toBeTruthy()
    expect(within(box).getByLabelText('1 of 1: President')).toBeTruthy()
    // Offices still to be announced stay off the slider.
    expect(within(box).queryByText('Treasurer')).toBeNull()
    // No photo yet: a placeholder holds its place until one is added in the dashboard.
    expect(
      within(box).getByRole('img', { name: 'Photo of Owolabi Joshua coming soon' }),
    ).toBeTruthy()
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
    expect(await screen.findByText('Owolabi Joshua')).toBeTruthy()
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
