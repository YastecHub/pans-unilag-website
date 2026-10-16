import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { apiError, jsonResponse, mockApi } from '../../test/mockApi.ts'
import { renderRoute } from '../../test/renderRoute.tsx'
import { safeNext } from './api.ts'

const ADA = { id: 'a1', name: 'Ada Okafor', email: 'ada@pans.test', role: 'admin' }
const unauthorized = () => jsonResponse(401, apiError('UNAUTHORIZED', 'Sign in required'))

const PLACEHOLDERS = {
  total: 3,
  groups: [
    {
      collection: 'executives',
      page: 'Executive Council',
      path: '/leadership/executive-council',
      items: [
        {
          id: 'e1',
          label: 'President',
          note: 'Name and bio from the President',
          updatedAt: '2026-10-14T10:00:00Z',
        },
        {
          id: 'e2',
          label: 'Vice President',
          note: 'Name and bio from the President',
          updatedAt: null,
        },
      ],
    },
    { collection: 'senators', page: 'Senate', path: '/leadership/senate', items: [] },
    {
      collection: 'documents',
      page: 'Constitution',
      path: '/governance/constitution',
      items: [
        {
          id: 'd1',
          label: 'Constitution of PANS UNILAG',
          note: 'PDF to be uploaded',
          updatedAt: null,
        },
      ],
    },
  ],
}

const FEEDBACK = {
  items: [
    {
      id: 'f1',
      category: 'welfare',
      message: 'Hostel water is unreliable.',
      status: 'new',
      createdAt: '2026-10-15T09:00:00Z',
    },
    {
      id: 'f2',
      category: 'suggestion',
      message: 'Share results online.',
      contactEmail: 'tolu@example.com',
      status: 'new',
      createdAt: '2026-10-14T09:00:00Z',
    },
  ],
  total: 30,
  page: 1,
  pageSize: 25,
}

const ALUMNI = {
  items: [
    {
      id: 'al1',
      name: 'Bola Ade',
      graduationYear: 2019,
      email: 'bola@example.com',
      interests: ['mentoring', 'internships-and-jobs'],
      consentAt: '2026-10-15T12:00:00Z',
      createdAt: '2026-10-15T12:00:00Z',
      updatedAt: '2026-10-15T12:00:00Z',
    },
  ],
  total: 1,
  page: 1,
  pageSize: 25,
}

/** A fake API with a session that sign-in starts and sign-out ends. */
function adminApi({ signedIn = false, role = 'admin' } = {}) {
  let session = signedIn
  const me = { ...ADA, role }
  return mockApi({
    '/api/auth/me': () => (session ? jsonResponse(200, { admin: me }) : unauthorized()),
    '/api/auth/login': () => {
      // The body is checked in the test; here any call with the right password signs in.
      session = true
      return jsonResponse(200, { admin: ADA })
    },
    '/api/auth/logout': () => {
      session = false
      return new Response(null, { status: 204 })
    },
    '/api/admin/placeholders': () => (session ? jsonResponse(200, PLACEHOLDERS) : unauthorized()),
    '/api/admin/submissions/feedback': () =>
      session ? jsonResponse(200, FEEDBACK) : unauthorized(),
    '/api/admin/submissions/alumni': () => (session ? jsonResponse(200, ALUMNI) : unauthorized()),
  })
}

const calls = (fetchMock: ReturnType<typeof mockApi>) =>
  (fetchMock.mock.calls as unknown as [RequestInfo | URL, RequestInit | undefined][]).map(
    ([input, init]) => ({
      path: new URL(String(input), 'http://x').pathname,
      search: new URL(String(input), 'http://x').search,
      method: init?.method ?? 'GET',
      body: init?.body ? JSON.parse(String(init.body)) : undefined,
    }),
  )

afterEach(() => vi.unstubAllGlobals())

describe('safe redirect after sign-in', () => {
  it('only returns to admin pages', () => {
    expect(safeNext('/admin/feedback?status=new')).toBe('/admin/feedback?status=new')
    expect(safeNext(null)).toBe('/admin')
    for (const bad of [
      '//evil.example',
      'https://evil.example',
      '/about',
      '/admin\\@evil',
      '/admin/sign-in',
    ]) {
      expect(safeNext(bad), bad).toBe('/admin')
    }
  })
})

describe('signing in', () => {
  it('sends signed-out visitors to sign-in, then back to the page they asked for', async () => {
    const user = userEvent.setup()
    const fetchMock = adminApi()
    const router = renderRoute('/admin/feedback?status=new')

    expect(await screen.findByRole('heading', { level: 1, name: 'Sign in' })).toBeTruthy()
    expect(router.state.location.pathname).toBe('/admin/sign-in')
    expect(new URLSearchParams(router.state.location.search).get('next')).toBe(
      '/admin/feedback?status=new',
    )
    expect(screen.queryByRole('navigation', { name: 'Main' })).toBeNull()
    expect(document.querySelector('meta[name="robots"]')?.getAttribute('content')).toBe(
      'noindex, nofollow',
    )

    await user.type(screen.getByLabelText('Email'), ' ada@pans.test ')
    await user.type(screen.getByLabelText('Password'), 'correct horse')
    await user.click(screen.getByRole('button', { name: 'Sign in' }))

    expect(await screen.findByRole('heading', { level: 1, name: 'Feedback' })).toBeTruthy()
    expect(router.state.location.pathname + router.state.location.search).toBe(
      '/admin/feedback?status=new',
    )
    expect(calls(fetchMock).find((c) => c.path === '/api/auth/login')?.body).toEqual({
      email: 'ada@pans.test',
      password: 'correct horse',
    })
  })

  it('checks the form and explains a wrong password or too many attempts', async () => {
    const user = userEvent.setup()
    let attempt = 0
    mockApi({
      '/api/auth/me': unauthorized,
      '/api/auth/login': () =>
        ++attempt === 1
          ? jsonResponse(401, apiError('UNAUTHORIZED', 'Email or password is incorrect'))
          : jsonResponse(429, apiError('RATE_LIMITED', 'Too many requests')),
    })
    renderRoute('/admin/sign-in')
    await user.click(await screen.findByRole('button', { name: 'Sign in' }))
    const summary = screen.getByRole('alert')
    expect(
      within(summary)
        .getAllByRole('link')
        .map((a) => a.getAttribute('href')),
    ).toEqual(['#email', '#password'])
    expect(screen.getByLabelText('Password').getAttribute('aria-invalid')).toBe('true')

    await user.type(screen.getByLabelText('Email'), 'ada@pans.test')
    await user.type(screen.getByLabelText('Password'), 'wrong')
    await user.click(screen.getByRole('button', { name: 'Sign in' }))
    expect(
      await within(screen.getByRole('alert')).findByText('Email or password is incorrect.'),
    ).toBeTruthy()

    await user.click(screen.getByRole('button', { name: 'Sign in' }))
    expect(await within(screen.getByRole('alert')).findByText(/wait 15 minutes/)).toBeTruthy()
  })

  it('shows and hides the password', async () => {
    const user = userEvent.setup()
    adminApi()
    renderRoute('/admin/sign-in')
    const field = await screen.findByLabelText('Password')
    const toggle = screen.getByRole('button', { name: 'Show password' })
    expect(field.getAttribute('type')).toBe('password')
    await user.click(toggle)
    expect(field.getAttribute('type')).toBe('text')
    expect(toggle.getAttribute('aria-pressed')).toBe('true')
  })
})

describe('the dashboard', () => {
  it('shows who is signed in, the admin sections and the overview counts', async () => {
    adminApi({ signedIn: true })
    renderRoute('/admin')
    expect(await screen.findByRole('heading', { level: 1, name: 'Welcome, Ada' })).toBeTruthy()
    expect(screen.getByText('Ada Okafor')).toBeTruthy()
    const nav = screen.getByRole('navigation', { name: 'Admin' })
    expect(
      within(nav)
        .getAllByRole('link')
        .map((a) => a.textContent),
    ).toEqual(['Overview', 'Content', 'Placeholders', 'Feedback', 'Alumni'])
    expect(within(nav).getByRole('link', { current: 'page' }).textContent).toBe('Overview')
    expect(await screen.findByRole('link', { name: '3 placeholders to fill' })).toBeTruthy()
    expect(await screen.findByRole('link', { name: '30 new feedback messages' })).toBeTruthy()
    expect(await screen.findByRole('link', { name: '1 alumni signed up' })).toBeTruthy()
  })

  it('keeps feedback and alumni details from editors, who manage content only', async () => {
    const fetchMock = adminApi({ signedIn: true, role: 'editor' })
    const router = renderRoute('/admin')
    expect(await screen.findByRole('heading', { level: 1, name: 'Welcome, Ada' })).toBeTruthy()
    const nav = screen.getByRole('navigation', { name: 'Admin' })
    expect(
      within(nav)
        .getAllByRole('link')
        .map((a) => a.textContent),
    ).toEqual(['Overview', 'Content', 'Placeholders'])
    expect(await screen.findByRole('link', { name: '3 placeholders to fill' })).toBeTruthy()
    expect(screen.queryByRole('link', { name: /feedback messages|alumni signed up/ })).toBeNull()

    await router.navigate('/admin/alumni')
    expect(await screen.findByRole('heading', { level: 1, name: 'Alumni sign-ups' })).toBeTruthy()
    expect(screen.getByText(/Only admins can see alumni sign-ups/)).toBeTruthy()
    await router.navigate('/admin/feedback')
    expect(await screen.findByText(/Only admins can see feedback/)).toBeTruthy()
    expect(calls(fetchMock).filter((c) => c.path.includes('/submissions/'))).toEqual([])
  })

  it('lists placeholders grouped by page, skipping pages with none', async () => {
    adminApi({ signedIn: true })
    renderRoute('/admin/placeholders')
    expect(await screen.findByText('3 items to fill across 2 pages.')).toBeTruthy()
    const main = document.getElementById('main')!
    expect(
      within(main)
        .getAllByRole('heading', { level: 2 })
        .map((h) => h.textContent),
    ).toEqual(['Executive Council (2)', 'Constitution (1)'])
    expect(within(main).getByText('Last changed 14 Oct 2026')).toBeTruthy()
    expect(
      within(main)
        .getAllByRole('link', { name: /View the page/ })[0]!
        .getAttribute('href'),
    ).toBe('/leadership/executive-council')
  })

  it('shows feedback read-only, with the status filter in the URL and paging', async () => {
    const user = userEvent.setup()
    const fetchMock = adminApi({ signedIn: true })
    const router = renderRoute('/admin/feedback')
    await screen.findByRole('heading', { level: 1, name: 'Feedback' })
    const main = () => document.getElementById('main')!
    const items = await within(main()).findAllByRole('article')
    expect(items).toHaveLength(2)
    expect(within(items[0]!).getByText('Anonymous · For the Welfare Secretary')).toBeTruthy()
    expect(
      within(items[1]!).getByRole('link', { name: 'tolu@example.com' }).getAttribute('href'),
    ).toBe('mailto:tolu@example.com')
    // Read-only: nothing on the page changes a message.
    expect(within(main()).queryAllByRole('button')).toHaveLength(0)

    await user.click(within(main()).getByRole('link', { name: 'resolved' }))
    expect(router.state.location.search).toBe('?status=resolved')
    expect(calls(fetchMock).some((c) => c.search.includes('status=resolved'))).toBe(true)
    expect(within(main()).getByText('Page 1 of 2')).toBeTruthy()
    expect(within(main()).getByRole('link', { name: 'Next →' }).getAttribute('href')).toBe(
      '/admin/feedback?status=resolved&page=2',
    )
  })

  it('shows alumni sign-ups in a table', async () => {
    adminApi({ signedIn: true })
    renderRoute('/admin/alumni')
    const table = await screen.findByRole('table', { name: 'Alumni network sign-ups' })
    const row = within(table).getByRole('row', { name: /Bola Ade/ })
    expect(row.textContent).toContain('2019')
    expect(row.textContent).toContain('Mentoring, Internships & jobs')
    expect(row.textContent).toContain('15 Oct 2026')
  })

  it('signs out and forgets the session', async () => {
    const user = userEvent.setup()
    const fetchMock = adminApi({ signedIn: true })
    const router = renderRoute('/admin/placeholders')
    await screen.findByText('3 items to fill across 2 pages.')
    await user.click(screen.getByRole('button', { name: 'Sign out' }))

    expect(await screen.findByText('You’ve signed out.')).toBeTruthy()
    expect(router.state.location.pathname).toBe('/admin/sign-in')
    expect(calls(fetchMock).some((c) => c.path === '/api/auth/logout' && c.method === 'POST')).toBe(
      true,
    )
    expect(screen.queryByText('Executive Council (2)')).toBeNull()
  })

  it('goes back to sign-in when the session expires while a page is open', async () => {
    let meCalls = 0
    mockApi({
      '/api/auth/me': () => (++meCalls === 1 ? jsonResponse(200, { admin: ADA }) : unauthorized()),
      '/api/admin/placeholders': unauthorized,
    })
    const router = renderRoute('/admin/placeholders')
    expect(await screen.findByText('Your session has ended. Please sign in again.')).toBeTruthy()
    expect(router.state.location.pathname).toBe('/admin/sign-in')
  })
})

describe('admin code stays out of the public bundle', () => {
  it('is only ever imported lazily, from the /admin route', () => {
    const sources = import.meta.glob(['/src/**/*.{ts,tsx}', '!/src/features/admin/**'], {
      query: '?raw',
      import: 'default',
      eager: true,
    }) as Record<string, string>
    const staticImports = Object.entries(sources).filter(([, code]) =>
      /^\s*import[^;]*from\s+['"][^'"]*features\/admin\//m.test(code),
    )
    expect(staticImports.map(([file]) => file)).toEqual([])
    const routes = sources['/src/app/routes.tsx']!
    expect(routes).toMatch(/lazy:[\s\S]*import\('\.\.\/features\/admin\/AdminApp\.tsx'\)/)
  })
})
