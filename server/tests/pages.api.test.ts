import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import request from 'supertest'
import { describe, expect, it } from 'vitest'
import { buildOpenApiDocument } from '../src/docs/openapi.js'
import {
  type PageReader,
  type StoredPage,
  toPageView,
} from '../src/modules/pages/application/pageView.js'
import { testApp } from './helpers.js'

const seedPages = JSON.parse(
  readFileSync(fileURLToPath(new URL('../seed/pages.json', import.meta.url)), 'utf8'),
) as StoredPage[]

/** Serves the real seed content without a database. */
function memoryReader(pages: StoredPage[]): PageReader & { calls: string[] } {
  const calls: string[] = []
  return {
    calls,
    async findBySlug(slug) {
      calls.push(slug)
      const page = pages.find((p) => p.slug === slug)
      return page ? toPageView(page) : null
    },
  }
}

const app = (pages: StoredPage[] = seedPages) =>
  testApp({ readers: { pages: memoryReader(pages) } })

describe('GET /api/pages/:slug', () => {
  it('returns the page with its sections and article references', async () => {
    const res = await request(app()).get('/api/pages/who-we-are')

    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({ slug: 'who-we-are', order: 1, isPlaceholder: false })
    expect(res.body.sections).toHaveLength(5)
    expect(res.body.sections[0]).toEqual({
      heading: 'Our name',
      bodyMarkdown: expect.stringContaining('PANS UNILAG'),
      articleRefs: ['Art. 2 S.A'],
    })
    expect(res.headers['cache-control']).toBe('public, max-age=300')
  })

  it('serves every seeded page', async () => {
    const server = app()
    for (const { slug } of seedPages) {
      const res = await request(server).get(`/api/pages/${slug}`)
      expect(res.status, slug).toBe(200)
    }
  })

  it('returns 404 NOT_FOUND for an unknown slug', async () => {
    const res = await request(app()).get('/api/pages/no-such-page')

    expect(res.status).toBe(404)
    expect(res.body.error).toMatchObject({ code: 'NOT_FOUND', message: 'Page not found' })
    expect(res.body.error.requestId).toBe(res.headers['x-request-id'])
  })

  it('rejects a malformed slug before reading the database', async () => {
    const reader = memoryReader(seedPages)
    const res = await request(testApp({ readers: { pages: reader } })).get('/api/pages/Who_We_Are')

    expect(res.status).toBe(400)
    expect(res.body.error.code).toBe('VALIDATION_ERROR')
    expect(res.body.error.details[0]).toMatchObject({ location: 'params', path: 'slug' })
    expect(reader.calls).toEqual([])
  })

  it('only sends placeholderNote while the page is a placeholder', async () => {
    const draft = { ...seedPages[0]!, isPlaceholder: true, placeholderNote: 'Awaiting the Senate' }
    const finished = { ...seedPages[0]!, slug: 'done', placeholderNote: 'old note' }
    const server = app([draft, finished])

    expect((await request(server).get(`/api/pages/${draft.slug}`)).body.placeholderNote).toBe(
      'Awaiting the Senate',
    )
    expect((await request(server).get('/api/pages/done')).body).not.toHaveProperty(
      'placeholderNote',
    )
  })
})

describe('toPageView', () => {
  it('keeps only public fields and formats updatedAt', () => {
    const stored = {
      ...seedPages[0]!,
      _id: 'abc',
      __v: 0,
      createdAt: new Date('2026-10-01T00:00:00Z'),
      updatedAt: new Date('2026-10-15T12:00:00Z'),
    }
    const view = toPageView(stored)

    expect(Object.keys(view).sort()).toEqual(
      ['isPlaceholder', 'order', 'sections', 'slug', 'title', 'updatedAt'].sort(),
    )
    expect(view.updatedAt).toBe('2026-10-15T12:00:00.000Z')
  })
})

describe('OpenAPI', () => {
  it('documents GET /api/pages/{slug} with the Page schema', () => {
    const document = buildOpenApiDocument()
    const operation = document.paths?.['/api/pages/{slug}']?.get

    expect(operation?.operationId).toBe('getPage')
    expect(JSON.stringify(operation?.responses?.['200'])).toMatch(/#\/components\/schemas\/Page"/)
    expect(Object.keys(operation?.responses ?? {})).toEqual(['200', '400', '404', '500'])
  })
})
