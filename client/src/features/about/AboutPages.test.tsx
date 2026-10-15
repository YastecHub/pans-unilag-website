import { screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { apiError, jsonResponse, mockApi } from '../../test/mockApi.ts'
import { renderRoute } from '../../test/renderRoute.tsx'

const whoWeAre = {
  slug: 'who-we-are',
  title: 'Who we are',
  order: 1,
  isPlaceholder: false,
  sections: [
    {
      heading: 'Our name',
      bodyMarkdown:
        'The **Pharmaceutical Association of Nigeria Students, University of Lagos**, abbreviated **PANS UNILAG**.',
      articleRefs: ['Art. 2 S.A'],
    },
    {
      heading: 'Our objectives',
      bodyMarkdown:
        '- Provide a medium for academic interaction.\n- Cater for welfare and unity.\n\n<script>alert(1)</script><img src=x onerror="alert(1)">',
      articleRefs: ['Art. 3', 'Art. 26'],
    },
  ],
}

afterEach(() => vi.unstubAllGlobals())

describe('About: Who we are', () => {
  it('renders each section with its Markdown and constitution references', async () => {
    mockApi({ '/api/pages/who-we-are': whoWeAre })
    renderRoute('/about')

    expect(await screen.findByRole('heading', { level: 2, name: 'Our name' })).toBeTruthy()
    expect(screen.getByRole('heading', { level: 1, name: 'Who we are' })).toBeTruthy()
    const main = document.getElementById('main')!
    expect((await within(main).findByText('PANS UNILAG')).tagName).toBe('STRONG')
    expect((await within(main).findAllByRole('listitem')).map((li) => li.textContent)).toEqual(
      expect.arrayContaining([
        'Provide a medium for academic interaction.',
        'Cater for welfare and unity.',
      ]),
    )
    expect(screen.getByText(/Art\. 2 S\.A/)).toBeTruthy()
    expect(screen.getByText(/Art\. 3, Art\. 26/)).toBeTruthy()
    const constitutionLinks = screen.getAllByRole('link', { name: 'Constitution' })
    expect(constitutionLinks[0]?.getAttribute('href')).toBe('/governance/constitution')
    expect(document.title).toBe('Who we are · PANS UNILAG')
  })

  it('drops raw HTML from the content', async () => {
    mockApi({ '/api/pages/who-we-are': whoWeAre })
    renderRoute('/about')
    await screen.findByRole('heading', { level: 2, name: 'Our objectives' })
    const main = document.getElementById('main')!
    await within(main).findAllByRole('listitem')
    expect(main.querySelector('script')).toBeNull()
    expect(main.querySelector('img[onerror]')).toBeNull()
  })

  it('shows the breadcrumb and the other About pages, marking this one', async () => {
    mockApi({ '/api/pages/who-we-are': whoWeAre })
    renderRoute('/about')
    await screen.findByRole('heading', { level: 2, name: 'Our name' })

    const crumbs = screen.getByRole('navigation', { name: 'Breadcrumb' })
    expect(
      within(crumbs)
        .getAllByRole('listitem')
        .map((li) => li.textContent?.replace('/', '').trim()),
    ).toEqual(['Home', 'About', 'Who we are'])
    const nav = screen.getByRole('navigation', { name: 'About pages' })
    expect(within(nav).getByRole('link', { name: 'Who we are' }).getAttribute('aria-current')).toBe(
      'page',
    )
    expect(within(nav).getByRole('link', { name: 'Impact' }).getAttribute('href')).toBe(
      '/about/impact',
    )
  })

  it('shows a placeholder notice when the page is still a placeholder', async () => {
    mockApi({
      '/api/pages/who-we-are': {
        ...whoWeAre,
        isPlaceholder: true,
        placeholderNote: 'Awaiting review',
      },
    })
    renderRoute('/about')
    expect(await screen.findByText('Awaiting review')).toBeTruthy()
  })

  it('treats a page that is not in the database yet as coming soon, not as an error', async () => {
    mockApi({})
    renderRoute('/about/membership')
    expect(await screen.findByText('This page’s content will be added soon.')).toBeTruthy()
    expect(screen.getByRole('heading', { level: 1, name: 'Membership & rights' })).toBeTruthy()
    expect(screen.queryByRole('alert')).toBeNull()
  })

  it('shows an error with retry when loading fails', async () => {
    mockApi({
      '/api/pages/membership-and-rights': () =>
        jsonResponse(500, apiError('INTERNAL_ERROR', 'Something went wrong')),
    })
    renderRoute('/about/membership')
    expect(await screen.findByRole('alert')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Try again' })).toBeTruthy()
  })
})

describe('About: History and Impact', () => {
  it('show clear placeholders instead of invented content', async () => {
    renderRoute('/about/history')
    expect(
      await screen.findByRole('heading', { level: 1, name: 'History & milestones' }),
    ).toBeTruthy()
    expect(screen.getByText(/will appear here once each date is verified/)).toBeTruthy()
    expect(screen.getByRole('link', { name: 'See past events' }).getAttribute('href')).toBe(
      '/events/past',
    )
  })

  it('Impact links to the committees meanwhile', async () => {
    renderRoute('/about/impact')
    expect(await screen.findByRole('heading', { level: 1, name: 'Impact' })).toBeTruthy()
    expect(screen.getByText(/once they are confirmed/)).toBeTruthy()
    expect(
      screen.getByRole('link', { name: 'See what our committees do' }).getAttribute('href'),
    ).toBe('/leadership/committees')
  })
})
