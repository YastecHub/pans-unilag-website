import { cleanup, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { SITE } from '../lib/site.ts'
import { apiError, jsonResponse, mockApi } from '../test/mockApi.ts'
import { renderRoute } from '../test/renderRoute.tsx'
import { MAIN_NAV, OVERVIEW_SECTIONS, STUB_PAGES } from './siteMap.ts'

const concrete = (path: string) => path.replace(':slug', 'example')

describe('routes', () => {
  it('renders the home page', async () => {
    renderRoute('/')
    expect(await screen.findByRole('heading', { level: 1, name: SITE.name })).toBeTruthy()
    expect(document.title).toBe('PANS UNILAG: Service to Humanity')
  })

  it.each(STUB_PAGES)('renders $path', async (page) => {
    renderRoute(concrete(page.path))
    expect(await screen.findByRole('heading', { level: 1, name: page.title })).toBeTruthy()
    expect(document.title).toBe(`${page.title} · PANS UNILAG`)
  })

  it.each(OVERVIEW_SECTIONS)(
    'renders the $label overview with links to its pages',
    async (section) => {
      renderRoute(section.to)
      expect(await screen.findByRole('heading', { level: 1, name: section.label })).toBeTruthy()
      const main = document.getElementById('main')!
      for (const child of section.children ?? []) {
        expect(main.querySelector(`a[href="${child.to}"]`)).not.toBeNull()
      }
    },
  )

  it('has a page for every link in the menu', async () => {
    const targets = MAIN_NAV.flatMap((section) => [
      section.to,
      ...(section.children?.map((c) => c.to) ?? []),
    ])
    for (const to of new Set(targets)) {
      renderRoute(to)
      await screen.findByRole('heading', { level: 1 })
      expect(screen.queryByText('Page not found'), `${to} should exist`).toBeNull()
      cleanup()
    }
  }, 15000)

  it('shows a not-found page for unknown URLs', async () => {
    renderRoute('/no-such-page')
    expect(await screen.findByRole('heading', { level: 1, name: 'Page not found' })).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Go to the home page' }).getAttribute('href')).toBe('/')
  })

  it('loads the admin area on demand, without the public header', async () => {
    mockApi({ '/api/auth/me': () => jsonResponse(401, apiError('UNAUTHORIZED', 'Sign in')) })
    renderRoute('/admin')
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Sign in' }, { timeout: 4000 }),
    ).toBeTruthy()
    expect(screen.queryByRole('navigation', { name: 'Main' })).toBeNull()
  })

  it('offers a skip link as the first stop for keyboard users', async () => {
    renderRoute('/about')
    await screen.findByRole('heading', { level: 1 })
    await userEvent.tab()
    const skip = document.activeElement as HTMLAnchorElement
    expect(skip.textContent).toBe('Skip to main content')
    expect(skip.getAttribute('href')).toBe('#main')
    expect(document.getElementById('main')?.tabIndex).toBe(-1)
  })
})
