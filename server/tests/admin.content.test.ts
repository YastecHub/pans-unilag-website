import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import request from 'supertest'
import { describe, expect, it } from 'vitest'
import { createApp } from '../src/app.js'
import { buildOpenApiDocument } from '../src/docs/openapi.js'
import { isBlockedLink } from '../src/lib/blockedLinks.js'
import { SESSION_COOKIE } from '../src/middleware/requireAdmin.js'
import type { SubmissionAdminStore } from '../src/modules/admin/application/submissionsAdmin.js'
import { AlbumModel } from '../src/modules/albums/infrastructure/album.model.js'
import type { AdminStore } from '../src/modules/auth/application/adminView.js'
import { signSessionToken } from '../src/modules/auth/application/sessionTokens.js'
import { CommitteeModel } from '../src/modules/committees/infrastructure/committee.model.js'
import { DocumentModel } from '../src/modules/documents/infrastructure/document.model.js'
import { ExecutiveModel } from '../src/modules/executives/infrastructure/executive.model.js'
import { GradingScaleModel } from '../src/modules/grading/infrastructure/gradingScale.model.js'
import { PageModel } from '../src/modules/pages/infrastructure/page.model.js'
import { PatronModel } from '../src/modules/patrons/infrastructure/patron.model.js'
import { PublicationModel } from '../src/modules/publications/infrastructure/publication.model.js'
import { ResourceModel } from '../src/modules/resources/infrastructure/resource.model.js'
import { SenatorModel } from '../src/modules/senate/infrastructure/senator.model.js'
import { SettingsModel } from '../src/modules/settings/infrastructure/settings.model.js'
import { ALLOWED_ORIGIN } from './helpers.js'
import { memoryAdminCollection } from './memoryAdmin.js'

/** The dashboard routes for everything except announcements, events and opportunities (#38). */

const SECRET = 'test-secret-that-is-at-least-32-characters-long'
const NOW = new Date('2026-10-16T09:00:00+01:00')
const seed = (file: string) =>
  JSON.parse(
    readFileSync(fileURLToPath(new URL(`../seed/${file}`, import.meta.url)), 'utf8'),
  ) as Record<string, unknown>[]

const admins: AdminStore = {
  findByEmailWithHash: async () => null,
  findById: async (id) =>
    id === 'ed1'
      ? { id, name: 'Editor', email: 'ed@example.com', role: 'editor', tokenVersion: 0 }
      : null,
  recordLogin: async () => undefined,
}

const noSubmissions: SubmissionAdminStore = {
  listFeedback: async ({ page, pageSize }) => ({ items: [], total: 0, page, pageSize }),
  setFeedbackStatus: async () => null,
  listAlumni: async ({ page, pageSize }) => ({ items: [], total: 0, page, pageSize }),
  removeAlumnus: async () => false,
}

function setup() {
  const clock = () => NOW
  const collections = {
    pages: memoryAdminCollection(PageModel, seed('pages.json'), clock),
    executives: memoryAdminCollection(ExecutiveModel, seed('executives.json'), clock),
    senators: memoryAdminCollection(SenatorModel, seed('senate.json'), clock),
    committees: memoryAdminCollection(CommitteeModel, seed('committees.json'), clock),
    patrons: memoryAdminCollection(PatronModel, seed('patrons.json'), clock),
    albums: memoryAdminCollection(AlbumModel, seed('albums.json'), clock),
    publications: memoryAdminCollection(PublicationModel, seed('publications.json'), clock),
    documents: memoryAdminCollection(DocumentModel, seed('documents.json'), clock),
    resources: memoryAdminCollection(ResourceModel, [], clock),
    gradingscales: memoryAdminCollection(GradingScaleModel, seed('grading.json'), clock),
    settings: memoryAdminCollection(SettingsModel, seed('settings.json'), clock),
  }
  const app = createApp({
    clientOrigins: [ALLOWED_ORIGIN],
    isProduction: false,
    now: clock,
    auth: {
      jwtSecret: SECRET,
      admins,
      adminCollections: collections,
      placeholderSources: [],
      submissionAdmin: noSubmissions,
    },
  })
  return { app, collections }
}

async function client() {
  const { app, collections } = setup()
  const cookie = `${SESSION_COOKIE}=${await signSessionToken({ adminId: 'ed1', tokenVersion: 0 }, SECRET, 8, NOW)}`
  const withCookie = <T extends { set(name: string, value: string): T }>(r: T) =>
    r.set('Cookie', cookie)
  return {
    collections,
    get: (p: string) => withCookie(request(app).get(p)),
    post: (p: string, body: object) => withCookie(request(app).post(p)).send(body),
    patch: (p: string, body: object) => withCookie(request(app).patch(p)).send(body),
    del: (p: string) => withCookie(request(app).delete(p)),
  }
}

/** The id of the seeded row matching `where`. */
function idOf(rows: Record<string, unknown>[], where: Record<string, unknown>): string {
  const row = rows.find((r) => Object.entries(where).every(([k, v]) => r[k] === v))
  if (!row) throw new Error(`no row matching ${JSON.stringify(where)}`)
  return String(row._id)
}

const paths = (res: request.Response) =>
  (res.body.error.details as { path: string }[]).map((d) => d.path)

describe('every page’s placeholders can be cleared from the dashboard', () => {
  it('lists each collection, seeded placeholders included', async () => {
    const api = await client()
    for (const name of Object.keys(api.collections)) {
      const res = await api.get(`/api/admin/${name}`)
      expect(res.status, name).toBe(200)
      if (name !== 'resources') expect(res.body.total, name).toBeGreaterThan(0)
    }
  })

  it('Executive Council: saving the bio and photo clears the flag; the order follows the office', async () => {
    const api = await client()
    const id = idOf(api.collections.executives.rows, { office: 'President' })
    const res = await api.patch(`/api/admin/executives/${id}`, {
      bio: 'Abigail is a 400L student who has served on the Welfare Committee.',
      photo: 'pans-unilag/executives/2026-2027/president',
    })
    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({ isPlaceholder: false, placeholderNote: '', order: 1 })

    const created = await api.post('/api/admin/executives', {
      session: '2027/2028',
      office: 'Treasurer',
      name: 'Chidera Obi',
    })
    expect(created.status).toBe(201)
    expect(created.body.order).toBe(5)

    const bad = await api.post('/api/admin/executives', {
      session: '2027/2029',
      office: 'Chief Executive',
      name: 'X',
      bio: Array(201).fill('word').join(' '),
    })
    expect(bad.status).toBe(400)
    expect(paths(bad)).toEqual(expect.arrayContaining(['session', 'office']))

    const longBio = await api.patch(`/api/admin/executives/${id}`, {
      bio: Array(201).fill('word').join(' '),
    })
    expect(longBio.status).toBe(400)
    expect(paths(longBio)).toContain('bio')
  })

  it('Senate and Patrons', async () => {
    const api = await client()
    const senator = idOf(api.collections.senators.rows, { position: 'Chief Whip' })
    const s = await api.patch(`/api/admin/senators/${senator}`, {
      name: 'Tobi Adeyemi',
      level: '300L',
    })
    expect(s.status).toBe(200)
    expect(s.body).toMatchObject({ isPlaceholder: false, order: 4 })

    const dean = idOf(api.collections.patrons.rows, { isDean: true })
    const p = await api.patch(`/api/admin/patrons/${dean}`, { name: 'Prof. A. B. Example' })
    expect(p.status).toBe(200)
    expect(p.body).toMatchObject({ isPlaceholder: false, name: 'Prof. A. B. Example' })
  })

  it('Committees: officers and lists; a real committee needs its description', async () => {
    const api = await client()
    const id = idOf(api.collections.committees.rows, { slug: 'admap' })
    const res = await api.patch(`/api/admin/committees/${id}`, {
      officers: [
        { title: 'Lead', name: 'Dada Aishat', level: '500L' },
        { title: 'Assistant', name: 'Akintomide Maizah', level: '300L' },
      ],
      activities: ['Drug-free campus walk', 'School outreach'],
    })
    expect(res.status).toBe(200)
    expect(res.body.officers).toHaveLength(2)
    expect(res.body.activities).toEqual(['Drug-free campus walk', 'School outreach'])

    const empty = await api.patch(`/api/admin/committees/${id}`, { description: '' })
    expect(empty.status).toBe(400)
    expect(paths(empty)).toContain('description')

    const badOfficer = await api.patch(`/api/admin/committees/${id}`, {
      officers: [{ title: 'Lead', name: '' }],
    })
    expect(badOfficer.status).toBe(400)
  })

  it('Pages: edits the sections, but pages can’t be created or deleted', async () => {
    const api = await client()
    const id = idOf(api.collections.pages.rows, { slug: 'who-we-are' })
    const res = await api.patch(`/api/admin/pages/${id}`, {
      sections: [{ heading: 'Our name', bodyMarkdown: 'PANS UNILAG.', articleRefs: ['Art. 1'] }],
    })
    expect(res.status).toBe(200)
    expect(res.body.sections).toEqual([
      { heading: 'Our name', bodyMarkdown: 'PANS UNILAG.', articleRefs: ['Art. 1'] },
    ])

    const badRef = await api.patch(`/api/admin/pages/${id}`, {
      sections: [{ heading: 'x', bodyMarkdown: 'y', articleRefs: ['Article one'] }],
    })
    expect(badRef.status).toBe(400)
    expect((await api.patch(`/api/admin/pages/${id}`, { sections: [] })).status).toBe(400)
    expect((await api.post('/api/admin/pages', { title: 'x' })).status).toBe(404)
    expect((await api.del(`/api/admin/pages/${id}`)).status).toBe(404)
  })

  it('Gallery: an album needs photos with alt text, a cover and consent before it’s real', async () => {
    const api = await client()
    const id = idOf(api.collections.albums.rows, { slug: 'health-week-2026-day-1' })
    const noPhotos = await api.patch(`/api/admin/albums/${id}`, {})
    expect(noPhotos.status).toBe(400)
    expect(paths(noPhotos)).toContain('photos')

    const photo = {
      publicId: 'pans-unilag/gallery/health-week-2026-day-1/a',
      alt: 'The trade fair',
    }
    const noConsent = await api.patch(`/api/admin/albums/${id}`, {
      photos: [photo],
      cover: photo.publicId,
    })
    expect(noConsent.status).toBe(400)
    expect(paths(noConsent)).toContain('consentConfirmed')

    const ok = await api.patch(`/api/admin/albums/${id}`, {
      photos: [photo],
      cover: photo.publicId,
      consentConfirmed: true,
    })
    expect(ok.status).toBe(200)
    expect(ok.body.isPlaceholder).toBe(false)

    const noAlt = await api.patch(`/api/admin/albums/${id}`, {
      photos: [{ ...photo, alt: '' }],
    })
    expect(noAlt.status).toBe(400)
  })

  it('Publications and the constitution need their link or PDF to be real', async () => {
    const api = await client()
    const recipharm = idOf(api.collections.publications.rows, { slug: 'recipharm' })
    const missing = await api.patch(`/api/admin/publications/${recipharm}`, { edition: '2026' })
    expect(missing.status).toBe(400)
    const ok = await api.patch(`/api/admin/publications/${recipharm}`, {
      edition: '2026',
      fileUrl: 'https://example.org/recipharm-2026.pdf',
    })
    expect(ok.status).toBe(200)

    const constitution = idOf(api.collections.documents.rows, { slug: 'constitution' })
    const http = await api.patch(`/api/admin/documents/${constitution}`, {
      fileUrl: 'http://example.org/constitution.pdf',
    })
    expect(http.status).toBe(400)
    expect(paths(http)).toContain('fileUrl')
    const pdf = await api.patch(`/api/admin/documents/${constitution}`, {
      fileUrl: 'https://example.org/constitution.pdf',
      fileSizeBytes: 7_100_000,
      approvedBy: 'Congress',
    })
    expect(pdf.status).toBe(200)
    expect(pdf.body).toMatchObject({ isPlaceholder: false, fileSizeBytes: 7_100_000 })
  })

  it('Academic resources: refuses links to piracy sites, and real ones need a checker', async () => {
    const api = await client()
    const base = { title: 'Organic chemistry notes', level: '200L', semester: 'first' }
    const pirate = await api.post('/api/admin/resources', {
      ...base,
      url: 'https://libgen.is/book/123',
      verifiedBy: 'Academics Committee',
    })
    expect(pirate.status).toBe(400)
    expect(paths(pirate)).toContain('url')

    const unchecked = await api.post('/api/admin/resources', {
      ...base,
      url: 'https://ocw.mit.edu/courses/5-12',
    })
    expect(unchecked.status).toBe(400)
    expect(paths(unchecked)).toContain('verifiedBy')

    const ok = await api.post('/api/admin/resources', {
      ...base,
      course: 'pch201',
      url: 'https://ocw.mit.edu/courses/5-12',
      verifiedBy: 'Academics Committee',
    })
    expect(ok.status).toBe(201)
    expect(ok.body.course).toBe('PCH201')
  })

  it('CGPA calculator: the grade table must cover 0–100 with no gaps', async () => {
    const api = await client()
    const id = String(api.collections.gradingscales.rows[0]!._id)
    const gap = await api.patch(`/api/admin/gradingscales/${id}`, {
      grades: [
        { letter: 'A', min: 70, max: 100, point: 5 },
        { letter: 'F', min: 0, max: 60, point: 0 },
      ],
    })
    expect(gap.status).toBe(400)
    expect(paths(gap)).toContain('grades')

    const ok = await api.patch(`/api/admin/gradingscales/${id}`, {
      source: 'Faculty of Pharmacy student handbook, §3.5 (p. 22), confirmed with the Faculty.',
    })
    expect(ok.status).toBe(200)
    expect(ok.body.isPlaceholder).toBe(false)
  })

  it('Contact & footer settings: edited in place, https links only, never created or deleted', async () => {
    const api = await client()
    const id = String(api.collections.settings.rows[0]!._id)
    const res = await api.patch(`/api/admin/settings/${id}`, {
      contactEmail: 'pans@unilag.edu.ng',
      quickLinks: [{ label: 'UNILAG portal', url: 'https://unilag.edu.ng' }],
    })
    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({ contactEmail: 'pans@unilag.edu.ng', isPlaceholder: false })

    const http = await api.patch(`/api/admin/settings/${id}`, {
      socialLinks: [{ platform: 'Instagram', url: 'http://instagram.com/pans' }],
    })
    expect(http.status).toBe(400)
    for (const url of ['javascript:alert(1)', '//evil.example/x', 'http://example.org']) {
      const quick = await api.patch(`/api/admin/settings/${id}`, {
        quickLinks: [{ label: 'Bad', url }],
      })
      expect(quick.status, url).toBe(400)
      const banner = await api.patch(`/api/admin/settings/${id}`, {
        homeBanner: { text: 'Bad', url },
      })
      expect(banner.status, url).toBe(400)
    }
    const banner = await api.patch(`/api/admin/settings/${id}`, {
      homeBanner: { text: 'Freshers’ Week', url: '/events/freshers-week-2026' },
    })
    expect(banner.status).toBe(200)
    expect((await api.post('/api/admin/settings', { postalAddress: 'x' })).status).toBe(404)
    expect((await api.del(`/api/admin/settings/${id}`)).status).toBe(404)
  })
})

describe('the piracy blocklist', () => {
  it('matches known sites and their subdomains only', () => {
    expect(isBlockedLink('https://libgen.is/x')).toBe(true)
    expect(isBlockedLink('https://www.pdfdrive.com/y')).toBe(true)
    expect(isBlockedLink('https://ocw.mit.edu/')).toBe(false)
    expect(isBlockedLink('not a url')).toBe(false)
  })
})

describe('admin API docs for the new resources', () => {
  it('documents create and delete only where they exist', () => {
    const docs = buildOpenApiDocument().paths ?? {}
    const methods = (p: string) => Object.keys(docs[p] ?? {}).sort()
    for (const name of ['pages', 'settings']) {
      expect(methods(`/api/admin/${name}`)).toEqual(['get'])
      expect(methods(`/api/admin/${name}/{id}`)).toEqual(['get', 'patch'])
    }
    for (const name of [
      'executives',
      'senators',
      'committees',
      'patrons',
      'albums',
      'publications',
      'documents',
      'resources',
      'gradingscales',
    ]) {
      expect(methods(`/api/admin/${name}`), name).toEqual(['get', 'post'])
      expect(methods(`/api/admin/${name}/{id}`), name).toEqual(['delete', 'get', 'patch'])
    }
  })
})
