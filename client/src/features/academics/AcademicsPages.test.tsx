import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { mockApi } from '../../test/mockApi.ts'
import { renderRoute } from '../../test/renderRoute.tsx'
import { FEATURES } from '../../lib/features.ts'
import pagesJson from '../../../../server/seed/pages.json?raw'
import { isAllowedLink, type Resource } from './resources/api.ts'

const resource = (r: Partial<Resource> & Pick<Resource, 'id' | 'title'>): Resource => ({
  level: '300L',
  semester: 'first',
  course: '',
  description: '',
  url: 'https://example.org',
  verifiedBy: 'Academics Committee',
  isPlaceholder: false,
  ...r,
})

const RESOURCES = [
  resource({
    id: '1',
    title: 'Pharmacology course outline',
    course: 'PCL 301',
    url: 'https://www.unilag.edu.ng/outlines/pcl301',
    description: 'Topics and reading list for the semester.',
  }),
  resource({
    id: '2',
    title: 'WHO Model List of Essential Medicines',
    course: 'CPH 302',
    semester: 'second',
    url: 'https://www.who.int/publications/eml',
  }),
  resource({ id: '3', title: 'Pirated textbook', url: 'https://libgen.is/book/123' }),
  resource({ id: '4', title: 'Not a web link', url: 'javascript:alert(1)' }),
  resource({ id: '5', title: 'Coming later', isPlaceholder: true, url: '' }),
]

afterEach(() => vi.unstubAllGlobals())

const main = () => document.getElementById('main')!

describe('links that may be listed', () => {
  it('blocks piracy sites and anything that isn’t a web link', () => {
    expect(isAllowedLink('https://www.who.int/publications/eml')).toBe(true)
    expect(isAllowedLink('https://ocw.mit.edu/courses/pharmacology')).toBe(true)
    for (const url of [
      'https://libgen.is/book/1',
      'http://library.lol/main/1',
      'https://z-lib.org/book',
      'https://www.pdfdrive.com/x.html',
      'https://annas-archive.org/md5/1',
      'https://sci-hub.se/10.1000/1',
      'javascript:alert(1)',
      'ftp://files.example.org/book.pdf',
      'not a url',
    ]) {
      expect(isAllowedLink(url), url).toBe(false)
    }
  })
})

// Off for launch (lib/features.ts): these run again when the page is switched back on.
describe.skipIf(!FEATURES.academicResources)('Academic resources', () => {
  it('groups checked links by level and semester, and never lists a blocked or placeholder one', async () => {
    mockApi({ '/api/resources': { resources: RESOURCES } })
    renderRoute('/academics/resources')
    const level300 = (
      await within(main()).findByRole('heading', { level: 2, name: '300L' })
    ).closest('section')!
    expect(
      within(level300)
        .getAllByRole('heading', { level: 3 })
        .map((h) => h.textContent),
    ).toEqual(['First semester', 'Second semester'])

    const link = within(level300).getByRole('link', {
      name: 'Pharmacology course outline (opens unilag.edu.ng in a new tab)',
    })
    expect(link.getAttribute('href')).toBe('https://www.unilag.edu.ng/outlines/pcl301')
    expect(link.getAttribute('target')).toBe('_blank')
    expect(link.getAttribute('rel')).toBe('noopener noreferrer')
    expect(within(level300).getByText('PCL 301')).toBeTruthy()
    expect(within(level300).getAllByText(/Checked by Academics Committee/)).toHaveLength(2)

    expect(within(main()).queryByText('Pirated textbook')).toBeNull()
    expect(within(main()).queryByText('Not a web link')).toBeNull()
    expect(within(main()).queryByText('Coming later')).toBeNull()
    expect(main().querySelector('a[href*="libgen"]')).toBeNull()

    // Levels with nothing yet say so, in the standard placeholder.
    const level100 = within(main())
      .getByRole('heading', { level: 2, name: '100L' })
      .closest('section')!
    expect(within(level100).getByText('Coming soon')).toBeTruthy()
    expect(
      within(level100).getByText('100L resources coming soon, from the Academics Committee.'),
    ).toBeTruthy()
    expect(within(main()).getByText(/never host or link to copyrighted textbooks/)).toBeTruthy()
  })

  it('filters by level through the URL, so a reload keeps the filter', async () => {
    mockApi({ '/api/resources': { resources: RESOURCES } })
    const router = renderRoute('/academics/resources')
    const filter = await screen.findByRole('navigation', { name: 'Filter by level' })
    await within(main()).findByRole('heading', { level: 2, name: '300L' })

    await userEvent.click(within(filter).getByRole('link', { name: '300L' }))
    expect(router.state.location.search).toBe('?level=300L')
    expect(
      within(main())
        .getAllByRole('heading', { level: 2 })
        .map((h) => h.textContent),
    ).toEqual(['300L'])
    expect(within(filter).getByRole('link', { name: '300L' }).getAttribute('aria-current')).toBe(
      'page',
    )
  })

  it('opens straight on a level, and shows every level as coming soon when there are none yet', async () => {
    mockApi({ '/api/resources': { resources: [] } })
    renderRoute('/academics/resources?level=500L')
    expect(
      await within(main()).findByText('500L resources coming soon, from the Academics Committee.'),
    ).toBeTruthy()
    expect(within(main()).getAllByRole('heading', { level: 2 })).toHaveLength(1)
  })
})

describe.skipIf(FEATURES.academicResources)('Academic resources, switched off for launch', () => {
  it('has no page and no menu link', async () => {
    mockApi({})
    renderRoute('/academics/resources')
    expect(await screen.findByRole('heading', { level: 1, name: 'Page not found' })).toBeTruthy()
    expect(screen.queryByRole('link', { name: /^Resources/ })).toBeNull()
  })
})

describe('Student support', () => {
  const page = (JSON.parse(pagesJson) as { slug: string; sections: { heading: string }[] }[]).find(
    (p) => p.slug === 'student-support',
  )!

  it('shows the constitution content and where to get help', async () => {
    mockApi({ '/api/pages/student-support': { order: 0, isPlaceholder: false, ...page } })
    renderRoute('/academics/student-support')
    expect(await screen.findByRole('heading', { level: 2, name: 'Welfare Secretary' })).toBeTruthy()
    for (const s of page.sections) {
      expect(screen.getByRole('heading', { level: 2, name: s.heading })).toBeTruthy()
    }
    expect(screen.getByText(/Art\. 8 S\.M/)).toBeTruthy()
    const help = screen.getByRole('navigation', { name: 'Get help now' })
    expect(
      within(help)
        .getAllByRole('link')
        .map((a) => a.getAttribute('href')),
    ).toEqual([
      '/connect/feedback',
      '/leadership/executive-council',
      '/leadership/committees/academics',
      '/academics/cgpa-calculator',
    ])
  })
})
