import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { apiError, jsonResponse, mockApi } from '../../test/mockApi.ts'
import { renderRoute } from '../../test/renderRoute.tsx'
import { groupHits, type SearchHit } from './api.ts'

const HITS: SearchHit[] = [
  {
    type: 'event',
    title: 'Pharmathon',
    summary: 'Day 5 of PANS Health Week 2026: Redefine+',
    url: '/events/health-week-2026-day-5',
    score: 3.1,
  },
  {
    type: 'committee',
    title: 'Research Club',
    summary: 'Runs the Pharmathon and research mentoring.',
    url: '/leadership/committees/research-club',
    score: 4.2,
  },
  {
    type: 'resource',
    title: 'Pharmathon judging guide',
    summary: 'PCL 301 · 300L',
    url: '/academics/resources?level=300L&semester=first',
    externalUrl: 'https://example.org/guide',
    score: 1.2,
  },
  {
    type: 'event',
    title: 'Symposium',
    summary: 'Pharmathon finalists present.',
    url: '/events/health-week-2026-day-8',
    score: 1.5,
  },
]

afterEach(() => vi.unstubAllGlobals())

const main = () => document.getElementById('main')!
const searchApi = (hits: SearchHit[] = HITS) =>
  mockApi({
    '/api/search': (url: URL) =>
      jsonResponse(200, { query: url.searchParams.get('q'), results: hits }),
  })

describe('grouping', () => {
  it('puts the group with the best match first, best match first within each', () => {
    expect(groupHits(HITS).map((g) => [g.label, g.hits.map((h) => h.title)])).toEqual([
      ['Committees', ['Research Club']],
      ['Events', ['Pharmathon', 'Symposium']],
      ['Academic resources', ['Pharmathon judging guide']],
    ])
  })
})

describe('search in the header', () => {
  it('opens a labelled search box, searches on Enter and closes', async () => {
    const user = userEvent.setup()
    searchApi()
    const router = renderRoute('/')
    const button = await screen.findByRole('button', { name: 'Site search' })
    expect(button.getAttribute('aria-expanded')).toBe('false')

    await user.click(button)
    expect(button.getAttribute('aria-expanded')).toBe('true')
    const box = screen.getByRole('searchbox', { name: 'Search the site' })
    expect(document.activeElement).toBe(box)
    expect(box.closest('[role="search"]')).not.toBeNull()

    await user.keyboard('  health   week {Enter}')
    expect(router.state.location.pathname).toBe('/search')
    expect(router.state.location.search).toBe('?q=health+week')
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Search results for “health week”' }),
    ).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Site search' }).getAttribute('aria-expanded')).toBe(
      'false',
    )
  })

  it('opens with "/" and closes with Escape, returning focus to the button', async () => {
    const user = userEvent.setup()
    searchApi()
    renderRoute('/')
    const button = await screen.findByRole('button', { name: 'Site search' })
    expect(button.getAttribute('aria-keyshortcuts')).toBe('/')

    await user.keyboard('/')
    const box = screen.getByRole('searchbox', { name: 'Search the site' })
    expect(document.activeElement).toBe(box)
    // In the box, "/" is just a character.
    await user.keyboard('a/b')
    expect(box).toHaveProperty('value', 'a/b')

    await user.keyboard('{Escape}')
    expect(screen.queryByRole('searchbox', { name: 'Search the site' })).toBeNull()
    expect(document.activeElement).toBe(button)
  })

  it('on the results page, goes to the page’s own search box', async () => {
    const user = userEvent.setup()
    searchApi()
    renderRoute('/search?q=pharmathon')
    await within(main()).findByRole('heading', { level: 2, name: /Committees/ })
    await user.click(screen.getByRole('button', { name: 'Site search' }))
    expect(screen.getAllByRole('searchbox')).toHaveLength(1)
    expect(document.activeElement).toBe(within(main()).getByRole('searchbox'))
  })
})

describe('results page', () => {
  it('groups results by type, with links to the pages and resources', async () => {
    const fetchMock = searchApi()
    renderRoute('/search?q=Pharmathon')
    const committees = await within(main()).findByRole('heading', { level: 2, name: /Committees/ })
    expect(
      within(main())
        .getAllByRole('heading', { level: 2 })
        .map((h) => h.textContent),
    ).toEqual(['Committees (1)', 'Events (2)', 'Academic resources (1)', 'What search covers'])
    expect(within(main()).getByRole('status').textContent).toBe('4 results for “Pharmathon”')
    expect(
      within(committees.closest('section')!)
        .getByRole('link', { name: 'Research Club' })
        .getAttribute('href'),
    ).toBe('/leadership/committees/research-club')
    const open = within(main()).getByRole('link', {
      name: 'Open Pharmathon judging guide (opens in a new tab)',
    })
    expect(open.getAttribute('href')).toBe('https://example.org/guide')
    expect(open.getAttribute('rel')).toBe('noopener noreferrer')
    expect(within(main()).getByRole('searchbox')).toHaveProperty('value', 'Pharmathon')

    const url = new URL(String(fetchMock.mock.calls[0]![0]), 'http://x')
    expect(Object.fromEntries(url.searchParams)).toEqual({ q: 'Pharmathon', limit: '50' })
  })

  it('says when nothing matches', async () => {
    searchApi([])
    renderRoute('/search?q=zzz')
    expect(await within(main()).findByText('No results for “zzz”.')).toBeTruthy()
    expect(within(main()).getByText(/matches whole words/)).toBeTruthy()
  })

  it('shows an error with a retry', async () => {
    const user = userEvent.setup()
    let calls = 0
    mockApi({
      '/api/search': () =>
        ++calls === 1
          ? jsonResponse(500, apiError('INTERNAL_ERROR', 'Something went wrong'))
          : jsonResponse(200, { query: 'x', results: HITS }),
    })
    renderRoute('/search?q=pharmathon')
    const alert = await within(main()).findByRole('alert')
    expect(within(alert).getByText('We couldn’t search just now.')).toBeTruthy()
    await user.click(within(alert).getByRole('button', { name: /try again/i }))
    expect(
      await within(main()).findByRole('heading', { level: 2, name: /Committees/ }),
    ).toBeTruthy()
  })

  it('asks for a search, and for at least 2 characters, without calling the API', async () => {
    const fetchMock = searchApi()
    renderRoute('/search')
    expect(await screen.findByRole('heading', { level: 1, name: 'Search' })).toBeTruthy()
    expect(within(main()).getByText(/Type a word or two/)).toBeTruthy()

    renderRoute('/search?q=a')
    expect(await screen.findByText('Please type at least 2 characters.')).toBeTruthy()
    expect(fetchMock.mock.calls.filter(([u]) => String(u).includes('/api/search'))).toHaveLength(0)
  })
})
