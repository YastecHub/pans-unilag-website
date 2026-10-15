import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { apiError, jsonResponse, mockApi } from '../../test/mockApi.ts'
import { renderRoute } from '../../test/renderRoute.tsx'
import documentsJson from '../../../../server/seed/documents.json?raw'
import pagesJson from '../../../../server/seed/pages.json?raw'
import { downloadLabel, formatFileSize } from '../documents/api/documents.ts'

/** The real seed content, shaped like the API responses. */
type SeedPage = { slug: string; title: string; sections: { heading: string }[] }
const pages = JSON.parse(pagesJson) as SeedPage[]
const page = (slug: string) => {
  const p = pages.find((x) => x.slug === slug)!
  return { order: 0, isPlaceholder: false, ...p }
}
const seedConstitution = {
  approvedBy: '',
  fileUrl: '',
  fileSizeBytes: null,
  ...(JSON.parse(documentsJson) as Record<string, unknown>[])[0],
}
const uploaded = {
  ...seedConstitution,
  isPlaceholder: false,
  placeholderNote: undefined,
  approvedBy: 'Congress',
  fileUrl: 'https://res.cloudinary.com/demo/raw/upload/pans-unilag/documents/constitution-2026.pdf',
  fileSizeBytes: 7_444_889,
}

const PAGES = {
  '/governance': 'governance',
  '/governance/elections': 'elections',
  '/governance/finance': 'finance-and-accountability',
  '/governance/meetings': 'meetings-and-procedures',
  '/governance/constitution': 'constitution',
}

const api = (documents: unknown[] = [seedConstitution]) =>
  mockApi({
    ...Object.fromEntries(Object.values(PAGES).map((slug) => [`/api/pages/${slug}`, page(slug)])),
    '/api/documents': { documents },
  })

afterEach(() => vi.unstubAllGlobals())

const main = () => document.getElementById('main')!

describe('Governance pages', () => {
  it.each(Object.entries(PAGES))('%s shows every section of "%s"', async (path, slug) => {
    api()
    renderRoute(path)
    const { title, sections } = page(slug)
    const first = sections[0]!.heading
    expect(await screen.findByRole('heading', { level: 2, name: first })).toBeTruthy()
    expect(screen.getByRole('heading', { level: 1, name: title })).toBeTruthy()
    for (const s of sections) {
      expect(screen.getByRole('heading', { level: 2, name: s.heading })).toBeTruthy()
    }
    // The section nav lists all five pages and marks this one.
    const nav = screen.getByRole('navigation', { name: /Governance/ })
    expect(within(nav).getAllByRole('link')).toHaveLength(5)
    expect(within(nav).getByRole('link', { current: 'page' }).getAttribute('href')).toBe(path)
  })

  it('links the overview to the people and committees the rules describe', async () => {
    api()
    renderRoute('/governance')
    const related = await screen.findByRole('navigation', { name: 'Related pages' })
    expect(
      within(related)
        .getAllByRole('link')
        .map((a) => a.getAttribute('href')),
    ).toEqual(['/leadership/executive-council', '/leadership/senate', '/leadership/committees'])
  })

  it('shows a page placeholder, not an error, when a page is missing', async () => {
    mockApi({
      '/api/pages/meetings-and-procedures': () => jsonResponse(404, apiError('NOT_FOUND', 'x')),
    })
    renderRoute('/governance/meetings')
    expect(await within(main()).findByText(/This page’s content will be added soon/)).toBeTruthy()
    expect(within(main()).queryByRole('alert')).toBeNull()
  })
})

describe('Constitution', () => {
  it('marks the PDF as coming soon while it is a placeholder, without the internal note', async () => {
    api()
    renderRoute('/governance/constitution')
    expect(await within(main()).findByText('PDF coming soon')).toBeTruthy()
    expect(within(main()).getByText(/full constitution \(55 pages\)/)).toBeTruthy()
    expect(main().textContent).not.toMatch(/President confirms|handwritten|signed last page/)
    expect(within(main()).queryByRole('link', { name: /Download/ })).toBeNull()
    expect(screen.getByRole('heading', { level: 2, name: 'How it is amended' })).toBeTruthy()
  })

  it('offers the PDF with its size, page count and approval date once uploaded', async () => {
    api([uploaded])
    renderRoute('/governance/constitution')
    const link = await within(main()).findByRole('link', {
      name: /Download the constitution \(PDF, 55 pages, 7\.1 MB\)/,
    })
    expect(link.getAttribute('href')).toBe(uploaded.fileUrl)
    expect(link.getAttribute('target')).toBe('_blank')
    expect(link.getAttribute('rel')).toBe('noopener noreferrer')
    expect(within(main()).getByText(/Version 2026 · approved 9 Jul 2026 by Congress/)).toBeTruthy()
  })

  it('keeps the constitution text readable when the documents list fails, and can retry', async () => {
    let calls = 0
    mockApi({
      '/api/pages/constitution': page('constitution'),
      '/api/documents': () =>
        ++calls === 1
          ? jsonResponse(500, apiError('INTERNAL', 'Something went wrong'))
          : jsonResponse(200, { documents: [uploaded] }),
    })
    renderRoute('/governance/constitution')
    const alert = await within(main()).findByRole('alert')
    expect(within(alert).getByText('We couldn’t load the download link.')).toBeTruthy()
    expect(screen.getByRole('heading', { level: 2, name: 'How it is amended' })).toBeTruthy()

    await userEvent.click(within(alert).getByRole('button', { name: /try again/i }))
    expect(
      await within(main()).findByRole('link', { name: /Download the constitution/ }),
    ).toBeTruthy()
  })
})

describe('download label', () => {
  it('describes the file the reader will get', () => {
    expect(formatFileSize(7_444_889)).toBe('7.1 MB')
    expect(formatFileSize(860_000)).toBe('840 KB')
    expect(formatFileSize(200)).toBe('1 KB')
    expect(downloadLabel({ pageCount: 55, fileSizeBytes: null })).toBe('PDF, 55 pages')
    expect(downloadLabel({ pageCount: null, fileSizeBytes: null })).toBe('PDF')
  })
})
