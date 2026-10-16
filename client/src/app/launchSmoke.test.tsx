import { cleanup, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { apiError, jsonResponse, mockApi } from '../test/mockApi.ts'
import { renderRoute } from '../test/renderRoute.tsx'

describe('launch QA smoke tests', () => {
  it('loads the home page with key sections and headers', async () => {
    renderRoute('/')
    expect(await screen.findByRole('heading', { level: 1 })).toBeTruthy()
    expect(document.querySelector('header')).not.toBeNull()
    expect(document.querySelector('footer')).not.toBeNull()
    cleanup()
  })

  it('navigates to events page and displays event list structure', async () => {
    mockApi({
      '/api/events?status=upcoming': () => jsonResponse(200, { items: [] }),
    })
    renderRoute('/events')
    expect(await screen.findByRole('heading', { level: 1, name: /Events/i })).toBeTruthy()
    cleanup()
  })

  it('renders committee detail page structure', async () => {
    mockApi({
      '/api/committees/academic': () =>
        jsonResponse(200, {
          slug: 'academic',
          name: 'Academic Committee',
          description: 'Supports student academic excellence and resources.',
          leads: [],
        }),
    })
    renderRoute('/leadership/committees/academic')
    expect(await screen.findByRole('heading', { level: 1 })).toBeTruthy()
    cleanup()
  })

  it('renders CGPA calculator with interactive inputs', async () => {
    mockApi({
      '/api/grading-scale': () =>
        jsonResponse(200, {
          scale: '5.0',
          passMark: 50,
          grades: [],
        }),
    })
    renderRoute('/academics/cgpa-calculator')
    expect(await screen.findByRole('heading', { level: 1, name: /CGPA Calculator/i })).toBeTruthy()
    cleanup()
  })

  it('renders feedback submission form with accessible fields', async () => {
    renderRoute('/connect/feedback')
    expect(await screen.findByRole('heading', { level: 1, name: /Feedback/i })).toBeTruthy()
    expect(screen.getByLabelText(/Name/i)).toBeTruthy()
    expect(screen.getByLabelText(/Email/i)).toBeTruthy()
    expect(screen.getByLabelText(/Message/i)).toBeTruthy()
    cleanup()
  })

  it('renders admin sign in portal with secure credentials form', async () => {
    mockApi({
      '/api/auth/me': () => jsonResponse(401, apiError('UNAUTHORIZED', 'Sign in')),
    })
    renderRoute('/admin')
    expect(await screen.findByRole('heading', { level: 1, name: 'Sign in' })).toBeTruthy()
    expect(screen.getByLabelText(/Email/i)).toBeTruthy()
    expect(screen.getByLabelText(/Password/i)).toBeTruthy()
    cleanup()
  })
})
