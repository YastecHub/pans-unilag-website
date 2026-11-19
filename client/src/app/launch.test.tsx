import { screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { FEATURES } from '../lib/features.ts'
import { mockApi } from '../test/mockApi.ts'
import { renderRoute } from '../test/renderRoute.tsx'
import albumsJson from '../../../server/seed/albums.json?raw'
import eventsJson from '../../../server/seed/events.json?raw'
import pagesJson from '../../../server/seed/pages.json?raw'
import patronsJson from '../../../server/seed/patrons.json?raw'
import senateJson from '../../../server/seed/senate.json?raw'

/** At launch (FEATURES.comingSoon off) nothing on the public site says "coming soon". */
const features = FEATURES as { comingSoon: boolean }
beforeEach(() => {
  features.comingSoon = false
})
afterEach(() => vi.unstubAllGlobals())

type Doc = Record<string, unknown> & { slug?: string }
const parse = (raw: string) => JSON.parse(raw) as Doc[]
const main = () => document.getElementById('main')!
const noComingSoon = () =>
  expect(main().textContent).not.toMatch(/coming soon|to be announced|election pending/i)

const albums = parse(albumsJson).map((a) => ({ cover: '', photoCount: 0, ...a }))
const withPhotos = {
  ...albums.find((a) => a.slug === 'health-week-2026-day-3')!,
  isPlaceholder: false,
  cover: 'pans-unilag/events/health-week-2026/day-3/photo-01',
  photoCount: 8,
}

describe('at launch', () => {
  it('the gallery lists only albums that have photos', async () => {
    mockApi({
      '/api/albums': { albums: albums.map((a) => (a.slug === withPhotos.slug ? withPhotos : a)) },
    })
    renderRoute('/gallery')
    expect((await screen.findAllByText(/8 photos/)).length).toBeGreaterThan(0)
    expect(within(main()).getAllByRole('link', { name: /Day/ })).toHaveLength(1)
    noComingSoon()
  })

  it('an event leaves out its date and venue until they are known', async () => {
    const event = {
      series: '',
      dayNumber: null,
      venue: '',
      description: '',
      coverImage: '',
      coverImageAlt: '',
      registrationUrl: '',
      committee: '',
      ...parse(eventsJson).find((e) => e.slug === 'health-week-2026-day-1')!,
      startsAt: null,
      endsAt: null,
      datePrecision: 'unknown',
      status: 'past',
    }
    mockApi({ '/api/events/health-week-2026-day-1': event, '/api/albums': { albums } })
    renderRoute('/events/health-week-2026-day-1')
    expect(await screen.findByRole('heading', { level: 1 })).toBeTruthy()
    expect(within(main()).queryByText('Venue')).toBeNull()
    expect(within(main()).queryByRole('heading', { name: 'Photos' })).toBeNull()
    noComingSoon()
  })

  it('the Senate page leaves out officers not yet elected', async () => {
    const page = parse(pagesJson).find((p) => p.slug === 'senate')
    mockApi({
      '/api/senate': {
        session: '2026/2027',
        sessions: ['2026/2027'],
        senators: parse(senateJson).map((s) => ({ level: '', ...s })),
      },
      '/api/pages/senate': page,
    })
    renderRoute('/leadership/senate')
    expect(
      await screen.findByRole('heading', { level: 2, name: 'Membership and powers' }),
    ).toBeTruthy()
    // The page's own text has a "Principal officers" section; the officer cards' heading is gone.
    await screen.findByRole('heading', { level: 1, name: 'Senate 2026/27' })
    await waitFor(() => expect(document.getElementById('officers-title')).toBeNull())
    expect(within(main()).queryAllByRole('article')).toHaveLength(0)
    noComingSoon()
  })

  it('the patrons page keeps its explanation but no unnamed cards', async () => {
    mockApi({ '/api/patrons': { patrons: parse(patronsJson) } })
    renderRoute('/leadership/patrons')
    expect(await screen.findByRole('heading', { level: 1, name: 'Patrons' })).toBeTruthy()
    await screen.findByText(/Dean of the Faculty of Pharmacy and four others/)
    expect(within(main()).queryAllByRole('article')).toHaveLength(0)
    noComingSoon()
  })
})
