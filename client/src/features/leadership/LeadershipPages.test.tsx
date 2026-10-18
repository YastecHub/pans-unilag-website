import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { mockApi } from '../../test/mockApi.ts'
import { renderRoute } from '../../test/renderRoute.tsx'
import committeesJson from '../../../../server/seed/committees.json?raw'
import executivesJson from '../../../../server/seed/executives.json?raw'
import pagesJson from '../../../../server/seed/pages.json?raw'
import patronsJson from '../../../../server/seed/patrons.json?raw'
import senateJson from '../../../../server/seed/senate.json?raw'
import { dutiesFor } from './components/duties.ts'

/** The real seed files, shaped like the API responses (defaults filled in as the server does). */
const SEEDS: Record<string, string> = {
  'committees.json': committeesJson,
  'executives.json': executivesJson,
  'pages.json': pagesJson,
  'patrons.json': patronsJson,
  'senate.json': senateJson,
}
type SeedDoc = Record<string, unknown> & { slug?: string; office?: string }
const seed = (file: string) => JSON.parse(SEEDS[file]!) as SeedDoc[]
const executives = seed('executives.json').map((e) => ({
  level: '',
  bio: '',
  photo: '',
  roleEmail: '',
  ...e,
}))
const senators = seed('senate.json').map((s) => ({ level: '', ...s }))
const patrons = seed('patrons.json')
const committees = seed('committees.json').map((c) => ({
  description: '',
  activities: [],
  achievements: [],
  plans: [],
  motto: '',
  officers: [],
  coverImage: '',
  isPlaceholder: false,
  ...c,
}))
const pages = seed('pages.json')
const page = (slug: string) => pages.find((p) => p.slug === slug)

const API = {
  '/api/executives': { session: '2026/2027', sessions: ['2026/2027'], executives },
  '/api/senate': { session: '2026/2027', sessions: ['2026/2027'], senators },
  '/api/patrons': { patrons },
  '/api/committees': { session: '2026/2027', sessions: ['2026/2027'], committees },
  '/api/pages/executive-council': page('executive-council'),
  '/api/pages/senate': page('senate'),
  ...Object.fromEntries(committees.map((c) => [`/api/committees/${c.slug}`, c])),
}

afterEach(() => vi.unstubAllGlobals())

const main = () => document.getElementById('main')!

describe('Executive Council', () => {
  it('lists the 14 offices in constitutional order with the session in the title', async () => {
    mockApi(API)
    renderRoute('/leadership/executive-council')
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Executive Council 2026/27' }),
    ).toBeTruthy()
    const cards = within(main()).getAllByRole('article')
    expect(cards).toHaveLength(14)
    expect(within(cards[0]!).getByText('President')).toBeTruthy()
    expect(within(cards[13]!).getByText('Welfare Secretary')).toBeTruthy()
  })

  it('shows a real name as a name, and stand-ins as clearly marked placeholders', async () => {
    mockApi(API)
    renderRoute('/leadership/executive-council')
    const [president, vicePresident] = await within(main()).findAllByRole('article')

    const presidentName = within(president!).getByRole('heading', { level: 3 })
    expect(presidentName.textContent).toBe('Abigail Moejoh')
    expect(presidentName.querySelector('.border-dashed')).toBeNull()

    const standIn = within(vicePresident!).getByText('Name to be announced')
    expect(standIn.className).toMatch(/border-dashed/)
    expect(within(vicePresident!).getByText('Bio coming soon')).toBeTruthy()
    expect(within(vicePresident!).getByRole('img', { name: 'Photo coming soon' })).toBeTruthy()
  })

  it('shows each office’s duties from the constitution', async () => {
    mockApi(API)
    renderRoute('/leadership/executive-council')
    const cards = await within(main()).findAllByRole('article')
    const treasurer = cards.find((c) => within(c).queryByText('Treasurer'))!
    await userEvent.click(await within(treasurer).findByText('Duties'))
    expect(await within(treasurer).findByText(/banks it within four days/)).toBeTruthy()
    expect(within(treasurer).getByText(/Art\. 8 S\.E-F/)).toBeTruthy()
  })
})

describe('duties lookup', () => {
  const sections = page('executive-council')!.sections as Parameters<typeof dutiesFor>[1]
  it('finds a duty for every office, including assistants described inside their principal’s entry', () => {
    for (const e of executives) {
      expect(dutiesFor(e.office as string, sections), e.office as string).not.toBeNull()
    }
    expect(dutiesFor('Assistant Public Relations Officer', sections)?.markdown).toMatch(
      /assists and acts/,
    )
    expect(dutiesFor('Editor-in-Chief', sections)?.articleRefs).toEqual(['Art. 19 S.F'])
  })
})

describe('Senate', () => {
  it('shows the four principal officers as “Election pending” and how the Senate works', async () => {
    mockApi(API)
    renderRoute('/leadership/senate')
    expect(await screen.findByRole('heading', { level: 1, name: 'Senate 2026/27' })).toBeTruthy()
    const cards = await within(main()).findAllByRole('article')
    expect(
      cards.map((c) => within(c).getByText(/Senate President|Deputy|Leader|Whip/).textContent),
    ).toEqual(['Senate President', 'Deputy Senate President', 'Senate Leader', 'Chief Whip'])
    expect(within(main()).getAllByText('Election pending')).toHaveLength(4)
    expect(
      within(main()).getByText('The 2026/27 Senate election has not been held yet.'),
    ).toBeTruthy()
    expect(
      await screen.findByRole('heading', { level: 2, name: 'Membership and powers' }),
    ).toBeTruthy()
  })
})

describe('Committees', () => {
  it('lists all 11 committees with officers, marking missing write-ups', async () => {
    mockApi(API)
    renderRoute('/leadership/committees')
    await within(main()).findByText(/The 11 committees appointed for the 2026\/27 session/)
    const cards = [...main().querySelectorAll('a[href^="/leadership/committees/"]')]
    expect(cards).toHaveLength(11)
    expect(cards[0]?.getAttribute('href')).toBe('/leadership/committees/admap')
    expect(within(main()).queryAllByText('Write-up coming soon')).toHaveLength(0)
    expect(
      within(main()).getByText(/The 11 committees appointed for the 2026\/27 session/),
    ).toBeTruthy()
  })

  it('shows a committee’s write-up, officers and the other committees', async () => {
    mockApi(API)
    renderRoute('/leadership/committees/ppht')
    expect(
      await screen.findByRole('heading', { level: 1, name: /PANS Public Health Team/ }),
    ).toBeTruthy()
    expect(screen.getByText('Committee · 2026/27')).toBeTruthy()
    const crumbs = screen.getByRole('navigation', { name: 'Breadcrumb' })
    expect(within(crumbs).getByRole('link', { name: 'Committees' }).getAttribute('href')).toBe(
      '/leadership/committees',
    )
    expect(await screen.findByRole('heading', { level: 2, name: 'About' })).toBeTruthy()
    expect(screen.getByRole('heading', { level: 2, name: 'Officers 2026/27' })).toBeTruthy()
    const others = await screen.findByRole('navigation', { name: 'Other committees' })
    expect(within(others).getAllByRole('link')).toHaveLength(10)
  })

  it('shows a newly updated committee write-up', async () => {
    mockApi(API)
    renderRoute('/leadership/committees/media')
    expect(await screen.findByRole('heading', { level: 1, name: /Media Committee/ })).toBeTruthy()
    expect(screen.getByText(/showing workings/)).toBeTruthy()
  })

  it('says when a committee does not exist', async () => {
    mockApi(API)
    renderRoute('/leadership/committees/no-such-committee')
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Committee not found' }),
    ).toBeTruthy()
    expect(screen.getByRole('link', { name: 'See all committees' })).toBeTruthy()
  })
})

describe('Patrons', () => {
  it('lists the Dean first and marks the names still to come', async () => {
    mockApi(API)
    renderRoute('/leadership/patrons')
    const cards = await within(main()).findAllByRole('article')
    expect(cards).toHaveLength(5)
    expect(within(cards[0]!).getByText('Dean, Faculty of Pharmacy')).toBeTruthy()
    expect(within(main()).getAllByText('Name to be announced')).toHaveLength(5)
  })
})
