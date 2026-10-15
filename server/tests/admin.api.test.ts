import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import request from 'supertest'
import { describe, expect, it } from 'vitest'
import { createApp } from '../src/app.js'
import { buildOpenApiDocument } from '../src/docs/openapi.js'
import { SESSION_COOKIE } from '../src/middleware/requireAdmin.js'
import type { PlaceholderSource } from '../src/modules/admin/application/placeholders.js'
import type {
  AlumnusRecord,
  FeedbackRecord,
  SubmissionAdminStore,
} from '../src/modules/admin/application/submissionsAdmin.js'
import type { AdminStore } from '../src/modules/auth/application/adminView.js'
import { signSessionToken } from '../src/modules/auth/application/sessionTokens.js'
import { AnnouncementModel } from '../src/modules/announcements/infrastructure/announcement.model.js'
import { EventModel } from '../src/modules/events/infrastructure/event.model.js'
import { OpportunityModel } from '../src/modules/opportunities/infrastructure/opportunity.model.js'
import { ALLOWED_ORIGIN } from './helpers.js'
import { memoryAdminCollection } from './memoryAdmin.js'

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

function setup() {
  const collections = {
    announcements: memoryAdminCollection(AnnouncementModel, [], () => NOW),
    events: memoryAdminCollection(EventModel, seed('events.json'), () => NOW),
    opportunities: memoryAdminCollection(OpportunityModel, [], () => NOW),
  }
  const placeholders: PlaceholderSource[] = [
    {
      collection: 'senators',
      page: 'Senate',
      path: '/leadership/senate',
      list: async () => seed('senate.json'),
    },
    {
      collection: 'events',
      page: 'Events',
      path: '/events',
      list: async () => collections.events.rows.filter((r) => r.isPlaceholder),
    },
    {
      collection: 'grading',
      page: 'CGPA calculator',
      path: '/academics/cgpa-calculator',
      list: async () => [],
    },
  ]
  const feedback: FeedbackRecord[] = [
    {
      id: 'f1',
      category: 'suggestion',
      message: 'Older',
      status: 'new',
      createdAt: '2026-10-01T00:00:00.000Z',
    },
    {
      id: 'f2',
      category: 'welfare',
      message: 'Newer',
      status: 'read',
      createdAt: '2026-10-10T00:00:00.000Z',
    },
  ]
  const alumni: AlumnusRecord[] = [
    {
      id: 'a1',
      name: 'Ada',
      graduationYear: 2019,
      email: 'ada@example.com',
      interests: [],
      consentAt: '',
      createdAt: '',
      updatedAt: '',
    },
  ]
  const submissionAdmin: SubmissionAdminStore = {
    listFeedback: async ({ status, page, pageSize }) => {
      const items = feedback
        .filter((f) => !status || f.status === status)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      return {
        items: items.slice((page - 1) * pageSize, page * pageSize),
        total: items.length,
        page,
        pageSize,
      }
    },
    setFeedbackStatus: async (id, status) => {
      const f = feedback.find((x) => x.id === id)
      if (f) f.status = status
      return f ?? null
    },
    listAlumni: async ({ page, pageSize }) => ({
      items: alumni,
      total: alumni.length,
      page,
      pageSize,
    }),
    removeAlumnus: async (id) => {
      const i = alumni.findIndex((a) => a.id === id)
      if (i >= 0) alumni.splice(i, 1)
      return i >= 0
    },
  }
  const app = createApp({
    clientOrigins: [ALLOWED_ORIGIN],
    isProduction: false,
    now: () => NOW,
    auth: {
      jwtSecret: SECRET,
      admins,
      adminCollections: collections,
      placeholderSources: placeholders,
      submissionAdmin,
    },
  })
  return { app, collections, feedback, alumni }
}

async function signedIn(app: ReturnType<typeof setup>['app']) {
  const cookie = `${SESSION_COOKIE}=${await signSessionToken({ adminId: 'ed1', tokenVersion: 0 }, SECRET, 8, NOW)}`
  const withCookie = <T extends { set(name: string, value: string): T }>(r: T) =>
    r.set('Cookie', cookie)
  return {
    get: (p: string) => withCookie(request(app).get(p)),
    post: (p: string, body: object) => withCookie(request(app).post(p)).send(body),
    patch: (p: string, body: object) => withCookie(request(app).patch(p)).send(body),
    del: (p: string) => withCookie(request(app).delete(p)),
  }
}

const announcement = { title: 'Freshers’ Week registration', body: 'Register at the PANS stand.' }

describe('every admin route requires sign-in', () => {
  it('returns 401 without a session cookie', async () => {
    const { app } = setup()
    const routes: [string, string][] = [
      ['get', '/api/admin/announcements'],
      ['post', '/api/admin/announcements'],
      ['get', '/api/admin/events/x'],
      ['patch', '/api/admin/events/x'],
      ['delete', '/api/admin/opportunities/x'],
      ['get', '/api/admin/placeholders'],
      ['get', '/api/admin/submissions/feedback'],
      ['patch', '/api/admin/submissions/feedback/f1'],
      ['get', '/api/admin/submissions/alumni'],
      ['delete', '/api/admin/submissions/alumni/a1'],
    ]
    for (const [method, path] of routes) {
      const res = await (request(app) as unknown as Record<string, (p: string) => request.Test>)[
        method
      ]!(path)
      expect(res.status, `${method} ${path}`).toBe(401)
      expect(res.body.error.code).toBe('UNAUTHORIZED')
    }
  })
})

describe('announcements CRUD', () => {
  it('creates, reads, updates and deletes', async () => {
    const { app } = setup()
    const as = await signedIn(app)

    const created = await as.post('/api/admin/announcements', announcement)
    expect(created.status).toBe(201)
    expect(created.body).toMatchObject({ ...announcement, pinned: false, isPlaceholder: false })
    expect(created.body).not.toHaveProperty('_id')
    const id = created.body.id as string

    expect((await as.get(`/api/admin/announcements/${id}`)).body.title).toBe(announcement.title)

    const updated = await as.patch(`/api/admin/announcements/${id}`, {
      pinned: true,
      expiresAt: '2026-12-05T00:00:00+01:00',
    })
    expect(updated.status).toBe(200)
    expect(updated.body).toMatchObject({ pinned: true, expiresAt: '2026-12-04T23:00:00.000Z' })

    const cleared = await as.patch(`/api/admin/announcements/${id}`, { expiresAt: null })
    expect(cleared.body).not.toHaveProperty('expiresAt')

    const list = await as.get('/api/admin/announcements')
    expect(list.body).toMatchObject({ total: 1, page: 1, pageSize: 25 })

    expect((await as.del(`/api/admin/announcements/${id}`)).status).toBe(204)
    expect((await as.get(`/api/admin/announcements/${id}`)).status).toBe(404)
    expect((await as.del(`/api/admin/announcements/${id}`)).status).toBe(404)
  })

  it('rejects unknown fields and invalid values', async () => {
    const as = await signedIn(setup().app)
    const cases = [
      { ...announcement, colour: 'red' },
      { ...announcement, title: '' },
      { ...announcement, publishAt: '16/10/2026' },
      { body: 'No title' },
    ]
    for (const body of cases) {
      const res = await as.post('/api/admin/announcements', body)
      expect(res.status, JSON.stringify(body)).toBe(400)
      expect(res.body.error.code).toBe('VALIDATION_ERROR')
    }
  })

  it('applies the model rules too (expiresAt must come after publishAt)', async () => {
    const as = await signedIn(setup().app)
    const res = await as.post('/api/admin/announcements', {
      ...announcement,
      publishAt: '2026-10-20T00:00:00+01:00',
      expiresAt: '2026-10-19T00:00:00+01:00',
    })
    expect(res.status).toBe(400)
    expect(JSON.stringify(res.body.error.details)).toMatch(/expiresAt/)
  })
})

describe('events: saving real content clears the placeholder flag', () => {
  it('turns a placeholder past event into real content when its date and description are saved', async () => {
    const { app, collections } = setup()
    const as = await signedIn(app)
    const pharmathon = collections.events.rows.find((r) => r.slug === 'health-week-2026-day-5')!
    const id = pharmathon._id.toString()

    const res = await as.patch(`/api/admin/events/${id}`, {
      datePrecision: 'day',
      startsAt: '2026-06-22T09:00:00+01:00',
      endsAt: '2026-06-22T17:00:00+01:00',
      description: 'A day-long pharmacy hackathon.',
    })
    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({
      isPlaceholder: false,
      placeholderNote: '',
      title: 'Pharmathon',
    })
  })

  it('keeps the flag when the editor says the item is still a placeholder', async () => {
    const { app, collections } = setup()
    const as = await signedIn(app)
    const id = collections.events.rows[0]!._id.toString()

    const res = await as.patch(`/api/admin/events/${id}`, {
      venue: 'Faculty of Pharmacy',
      isPlaceholder: true,
      placeholderNote: 'Date still needed',
    })
    expect(res.body).toMatchObject({
      isPlaceholder: true,
      placeholderNote: 'Date still needed',
      venue: 'Faculty of Pharmacy',
    })
  })

  it('refuses to mark an event real while its dates are unknown (model rule)', async () => {
    const { app, collections } = setup()
    const as = await signedIn(app)
    const id = collections.events.rows[0]!._id.toString()

    const res = await as.patch(`/api/admin/events/${id}`, { venue: 'Idi-Araba' })
    expect(res.status).toBe(400)
    expect(JSON.stringify(res.body.error.details)).toMatch(/datePrecision/)
  })

  it('returns 409 for a duplicate slug', async () => {
    const as = await signedIn(setup().app)
    const res = await as.post('/api/admin/events', {
      slug: 'freshers-week-2026',
      title: 'Copy',
      startsAt: '2026-11-30T00:00:00+01:00',
      endsAt: '2026-12-04T23:59:59+01:00',
    })
    expect(res.status).toBe(409)
    expect(res.body.error.details.fields).toEqual(['slug'])
  })
})

describe('opportunities', () => {
  it('creates a listing and requires an apply link for real content', async () => {
    const as = await signedIn(setup().app)
    const base = { slug: 'nafdac-internship-2027', title: 'NAFDAC internship', type: 'internship' }

    expect((await as.post('/api/admin/opportunities', base)).status).toBe(400)
    const created = await as.post('/api/admin/opportunities', {
      ...base,
      applyUrl: 'https://example.org/apply',
      deadline: '2026-11-30T00:00:00+01:00',
    })
    expect(created.status).toBe(201)
    expect(created.body).toMatchObject({ type: 'internship', isPlaceholder: false })
  })
})

describe('GET /api/admin/placeholders', () => {
  it('groups placeholders by page and leaves out empty groups', async () => {
    const as = await signedIn(setup().app)
    const res = await as.get('/api/admin/placeholders')

    expect(res.status).toBe(200)
    expect(res.headers['cache-control']).toBe('no-store')
    expect(res.body.groups.map((g: { page: string }) => g.page)).toEqual(['Senate', 'Events'])
    expect(res.body.total).toBe(4 + 22)
    expect(res.body.groups[0].items[0]).toMatchObject({
      label: 'Senate President',
      note: 'The 2026/27 Senate election has not been held yet',
    })
  })
})

describe('submissions', () => {
  it('lists feedback newest first, filters by status and updates status', async () => {
    const { app, feedback } = setup()
    const as = await signedIn(app)

    expect(
      (await as.get('/api/admin/submissions/feedback')).body.items.map((f: FeedbackRecord) => f.id),
    ).toEqual(['f2', 'f1'])
    expect((await as.get('/api/admin/submissions/feedback?status=new')).body.total).toBe(1)

    const res = await as.patch('/api/admin/submissions/feedback/f1', { status: 'resolved' })
    expect(res.body.status).toBe('resolved')
    expect(feedback[0]?.status).toBe('resolved')
    expect(
      (await as.patch('/api/admin/submissions/feedback/f1', { status: 'deleted' })).status,
    ).toBe(400)
    expect((await as.patch('/api/admin/submissions/feedback/zz', { status: 'read' })).status).toBe(
      404,
    )
  })

  it('lists alumni and removes an entry on request', async () => {
    const { app, alumni } = setup()
    const as = await signedIn(app)

    expect((await as.get('/api/admin/submissions/alumni')).body.total).toBe(1)
    expect((await as.del('/api/admin/submissions/alumni/a1')).status).toBe(204)
    expect(alumni).toEqual([])
    expect((await as.del('/api/admin/submissions/alumni/a1')).status).toBe(404)
  })
})

describe('admin API docs', () => {
  it('documents the resource, placeholder and submission routes', () => {
    const paths = buildOpenApiDocument().paths ?? {}
    for (const name of ['announcements', 'events', 'opportunities']) {
      expect(Object.keys(paths[`/api/admin/${name}`] ?? {}).sort()).toEqual(['get', 'post'])
      expect(Object.keys(paths[`/api/admin/${name}/{id}`] ?? {}).sort()).toEqual([
        'delete',
        'get',
        'patch',
      ])
    }
    expect(paths['/api/admin/placeholders']?.get).toBeDefined()
    expect(paths['/api/admin/submissions/feedback/{id}']?.patch).toBeDefined()
  })
})
