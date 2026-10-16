import { screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { mockApi } from '../../test/mockApi.ts'
import { renderRoute } from '../../test/renderRoute.tsx'
import publicationsJson from '../../../../server/seed/publications.json?raw'
import { comingSoonText, type Publication } from './api/publications.ts'

/** The seed as GET /api/publications returns it: one placeholder per series. */
const seed: Publication[] = (JSON.parse(publicationsJson) as Partial<Publication>[]).map(
  (p) =>
    ({
      edition: '',
      publishedOn: null,
      summary: '',
      cover: '',
      fileUrl: '',
      link: '',
      ...p,
    }) as Publication,
)

const recipharm2025: Publication = {
  slug: 'recipharm-2025',
  title: 'Recipharm',
  series: 'recipharm',
  edition: '2025',
  publishedOn: '2025-09-01T00:00:00.000Z',
  summary: 'The 2025 edition.',
  cover: '',
  fileUrl: 'https://res.cloudinary.com/demo/raw/upload/recipharm-2025.pdf',
  link: '',
  isPlaceholder: false,
}
const recipharm2026Pending: Publication = {
  ...recipharm2025,
  slug: 'recipharm-2026',
  edition: '2026',
  publishedOn: null,
  fileUrl: '',
  summary: '',
  isPlaceholder: true,
  placeholderNote: 'PDF to be supplied by the Editor-in-Chief',
}
const substack: Publication = {
  ...seed[2]!,
  isPlaceholder: false,
  placeholderNote: undefined,
  link: 'https://pansunilag.substack.com',
  summary: 'Essays and newsletters.',
}

afterEach(() => vi.unstubAllGlobals())

const main = () => document.getElementById('main')!
const section = (name: string) =>
  within(main()).getByRole('heading', { level: 2, name }).closest('section')!

describe('Publications', () => {
  it('groups by series and marks every series as coming soon until editions arrive', async () => {
    mockApi({ '/api/publications': { publications: seed } })
    renderRoute('/publications')
    await within(main()).findByRole('heading', { level: 2, name: 'Recipharm' })
    expect(
      within(main())
        .getAllByRole('heading', { level: 2 })
        .map((h) => h.textContent),
    ).toEqual(['Recipharm', 'Newspaper', 'Substack', 'About our publications'])

    expect(within(section('Recipharm')).getByText('Recipharm editions coming soon')).toBeTruthy()
    expect(within(section('Newspaper')).getByText('Newspaper editions coming soon')).toBeTruthy()
    expect(within(section('Substack')).getByText('Our Substack link is coming soon')).toBeTruthy()
    // The standard Placeholder look: icon, "Coming soon", then what will appear.
    expect(within(section('Recipharm')).getByText('Coming soon')).toBeTruthy()
    // A one-page section doesn't repeat itself in the breadcrumb.
    const crumbs = screen.getByRole('navigation', { name: 'Breadcrumb' })
    expect(
      within(crumbs)
        .getAllByRole('listitem')
        .map((li) => li.textContent),
    ).toEqual(['Home/', 'Publications'])
    // Never invented: no links, no dates; the admin's note stays off the public page.
    expect(within(main()).queryByRole('link', { name: /Read/ })).toBeNull()
    expect(main().querySelector('time')).toBeNull()
    expect(main().textContent).not.toMatch(/to be supplied by/)
  })

  it('shows published editions with their PDF or link, and placeholders only for what is missing', async () => {
    mockApi({
      '/api/publications': {
        publications: [recipharm2025, substack, recipharm2026Pending, seed[0], seed[1]],
      },
    })
    renderRoute('/publications')
    await within(main()).findByRole('heading', { level: 3, name: 'Recipharm 2025' })

    const recipharm = section('Recipharm')
    const edition = within(recipharm).getByRole('article')
    expect(within(edition).getByText('September 2025')).toBeTruthy()
    const pdf = within(edition).getByRole('link', {
      name: 'Read the PDF of Recipharm 2025 (opens in a new tab)',
    })
    expect(pdf.getAttribute('href')).toBe(recipharm2025.fileUrl)
    expect(pdf.getAttribute('target')).toBe('_blank')
    expect(pdf.getAttribute('rel')).toBe('noopener noreferrer')
    // The known missing edition is shown; the series-level placeholder is not, now that one exists.
    const pending = within(recipharm).getByText('Recipharm 2026 edition coming soon').parentElement!
    expect(within(pending).getByRole('img', { name: 'Photo coming soon' })).toBeTruthy()
    expect(within(recipharm).queryByText('Recipharm editions coming soon')).toBeNull()

    const read = within(section('Substack')).getByRole('link', { name: /Read on Substack/ })
    expect(read.getAttribute('href')).toBe('https://pansunilag.substack.com')
    expect(within(section('Substack')).queryByText(/coming soon/)).toBeNull()
    expect(within(section('Newspaper')).getByText('Newspaper editions coming soon')).toBeTruthy()
  })

  it('still shows a series as coming soon when it has no entries at all', async () => {
    mockApi({ '/api/publications': { publications: [] } })
    renderRoute('/publications')
    expect(await screen.findByText('Recipharm editions coming soon')).toBeTruthy()
    expect(screen.getByText('Our Substack link is coming soon')).toBeTruthy()
  })

  it('says what will appear, never invents it', () => {
    expect(comingSoonText('recipharm', '2026')).toBe('Recipharm 2026 edition coming soon')
    expect(comingSoonText('newspaper')).toBe('Newspaper editions coming soon')
    expect(comingSoonText('substack')).toBe('Our Substack link is coming soon')
  })
})
