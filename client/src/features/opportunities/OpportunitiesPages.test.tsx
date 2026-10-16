import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { lagosDay } from '../../lib/dates.ts'
import { apiError, jsonResponse, mockApi } from '../../test/mockApi.ts'
import { renderRoute } from '../../test/renderRoute.tsx'
import { daysLeft, isOpen, type Opportunity } from './api/opportunities.ts'

/** The end of the Lagos day `n` days from today, as the API stores deadlines. */
function deadlineIn(n: number): string {
  const day = new Date(`${lagosDay(new Date())}T00:00:00Z`)
  day.setUTCDate(day.getUTCDate() + n)
  return new Date(`${day.toISOString().slice(0, 10)}T23:59:59+01:00`).toISOString()
}

const make = (o: Partial<Opportunity> & Pick<Opportunity, 'slug' | 'title' | 'type'>) =>
  ({
    organisation: '',
    eligibility: '',
    description: '',
    deadline: null,
    applyUrl: '',
    lastCheckedAt: null,
    isPlaceholder: false,
    ...o,
  }) as Opportunity

const today = make({
  slug: 'essay-prize',
  title: 'Essay Prize',
  type: 'competition',
  deadline: deadlineIn(0),
})
const soon = make({
  slug: 'emzor-internship',
  title: 'Industrial Internship',
  type: 'internship',
  organisation: 'Emzor Pharmaceuticals',
  eligibility: '300L and 400L students',
  description: 'Six weeks in **production** and quality control.',
  deadline: deadlineIn(3),
  applyUrl: 'https://www.emzorpharma.com/careers',
  lastCheckedAt: '2026-10-12T09:00:00Z',
})
const later = make({
  slug: 'pfizer-scholarship',
  title: 'Pharmacy Scholarship',
  type: 'scholarship',
  deadline: deadlineIn(30),
})
const rolling = make({
  slug: 'hospital-attachment',
  title: 'Hospital Attachment',
  type: 'internship',
})
// The API leaves closed listings out; this one checks the page never shows one regardless.
const expired = make({
  slug: 'old-prize',
  title: 'Last Year’s Prize',
  type: 'competition',
  deadline: deadlineIn(-1),
})

const LIST = [today, soon, later, rolling]

function api(opportunities: Opportunity[] = [...LIST, expired]) {
  return mockApi({
    '/api/opportunities': { opportunities },
    ...Object.fromEntries(opportunities.map((o) => [`/api/opportunities/${o.slug}`, o])),
  })
}

afterEach(() => vi.unstubAllGlobals())

const main = () => document.getElementById('main')!
const titles = () =>
  within(main())
    .getAllByRole('heading', { level: 2 })
    .map((h) => h.textContent)
    .filter((t) => t !== 'About the hub')

describe('open and closing', () => {
  it('keeps a listing open until the end of its deadline day in Lagos', () => {
    const now = new Date('2026-10-20T22:30:00Z') // 23:30 on 20 Oct in Lagos
    expect(isOpen({ deadline: '2026-10-20T22:59:59Z' }, now)).toBe(true)
    expect(isOpen({ deadline: '2026-10-19T22:59:59Z' }, now)).toBe(false)
    expect(isOpen({ deadline: null }, now)).toBe(true)
    expect(daysLeft({ deadline: '2026-10-20T22:59:59Z' }, now)).toBe(0)
    expect(daysLeft({ deadline: '2026-10-23T22:59:59Z' }, now)).toBe(3)
    expect(daysLeft({ deadline: null }, now)).toBeNull()
  })
})

describe('Opportunities hub', () => {
  it('lists open opportunities closing soonest first, rolling last, never an expired one', async () => {
    api()
    renderRoute('/opportunities')
    await within(main()).findByRole('heading', { level: 2, name: 'Essay Prize' })
    expect(titles()).toEqual([
      'Essay Prize',
      'Industrial Internship',
      'Pharmacy Scholarship',
      'Hospital Attachment',
    ])
    expect(within(main()).queryByText('Last Year’s Prize')).toBeNull()
    const cards = within(main()).getAllByRole('link', {
      name: /Essay|Industrial|Pharmacy|Hospital/,
    })
    expect(cards[0]!.textContent).toContain('Closes today')
    expect(cards[1]!.textContent).toContain('3 days left')
    expect(cards[3]!.textContent).toContain('Open: apply any time')
    expect(cards[1]!.getAttribute('href')).toBe('/opportunities/emzor-internship')
  })

  it('filters by type through the URL, so the filter survives a reload', async () => {
    api()
    const user = userEvent.setup()
    const router = renderRoute('/opportunities')
    const filter = await screen.findByRole('navigation', { name: 'Filter by type' })
    expect(
      within(filter)
        .getAllByRole('link')
        .map((a) => a.textContent),
    ).toEqual(['All (4)', 'Scholarship (1)', 'Internship (2)', 'Competition (1)'])

    await user.click(within(filter).getByRole('link', { name: 'Internship (2)' }))
    expect(router.state.location.search).toBe('?type=internship')
    expect(titles()).toEqual(['Industrial Internship', 'Hospital Attachment'])
    expect(
      within(filter).getByRole('link', { name: 'Internship (2)' }).getAttribute('aria-current'),
    ).toBe('page')
  })

  it('opens straight on a filtered list (a reload or a shared link)', async () => {
    api()
    renderRoute('/opportunities?type=scholarship')
    await within(main()).findByRole('heading', { level: 2, name: 'Pharmacy Scholarship' })
    expect(titles()).toEqual(['Pharmacy Scholarship'])
    expect(within(main()).getByText('1 open opportunity · Scholarship')).toBeTruthy()
  })

  it('ignores an unknown type', async () => {
    api()
    renderRoute('/opportunities?type=nonsense')
    await within(main()).findByRole('heading', { level: 2, name: 'Essay Prize' })
    expect(titles()).toHaveLength(4)
  })

  it('says when the selected type has nothing open', async () => {
    api()
    renderRoute('/opportunities?type=job')
    expect(await within(main()).findByText('No open job listings right now.')).toBeTruthy()
    expect(within(main()).getByRole('link', { name: 'Job (0)' }).getAttribute('aria-current')).toBe(
      'page',
    )
  })

  it('shows a friendly empty state when nothing is open', async () => {
    api([expired])
    renderRoute('/opportunities')
    expect(
      await within(main()).findByText('No open opportunities right now. Check back soon.'),
    ).toBeTruthy()
    expect(within(main()).queryByRole('navigation', { name: 'Filter by type' })).toBeNull()
  })
})

describe('Opportunity page', () => {
  it('shows the deadline, who can apply, the details and the official link', async () => {
    api()
    renderRoute('/opportunities/emzor-internship')
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Industrial Internship' }),
    ).toBeTruthy()
    expect(within(main()).getByText(/3 days left/)).toBeTruthy()
    expect(within(main()).getByText('300L and 400L students')).toBeTruthy()
    expect((await within(main()).findByText('production')).tagName).toBe('STRONG')
    const apply = within(main()).getByRole('link', { name: /Apply on the official site/ })
    expect(apply.getAttribute('href')).toBe('https://www.emzorpharma.com/careers')
    expect(apply.getAttribute('target')).toBe('_blank')
    expect(apply.getAttribute('rel')).toBe('noopener noreferrer')
    expect(within(main()).getByText('Opens emzorpharma.com')).toBeTruthy()
    const checked = within(main()).getByText(
      (_, el) =>
        el?.tagName === 'P' && /^Details last checked on 12 Oct 2026\./.test(el.textContent ?? ''),
    )
    expect(checked.querySelector('time')?.getAttribute('datetime')).toBe('2026-10-12T09:00:00Z')
  })

  it('says a closed or removed listing has closed', async () => {
    api()
    mockApi({
      '/api/opportunities/old-prize': () =>
        jsonResponse(404, apiError('NOT_FOUND', 'Opportunity not found')),
    })
    renderRoute('/opportunities/old-prize')
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Opportunity closed' }),
    ).toBeTruthy()
    expect(within(main()).getByRole('link', { name: 'See open opportunities' })).toBeTruthy()
  })

  it('treats a listing whose deadline has passed as closed, even if it loaded', async () => {
    api()
    renderRoute('/opportunities/old-prize')
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Opportunity closed' }),
    ).toBeTruthy()
    expect(within(main()).queryByText('Last Year’s Prize')).toBeNull()
  })
})
