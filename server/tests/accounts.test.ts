import request from 'supertest'
import { beforeAll, describe, expect, it } from 'vitest'
import { createApp } from '../src/app.js'
import { buildOpenApiDocument } from '../src/docs/openapi.js'
import {
  DEVELOPER_ACCOUNTS_MESSAGE,
  MAX_PENDING_REQUESTS,
} from '../src/modules/auth/application/accounts.js'
import { ADMIN_ROLES, hasRole } from '../src/modules/auth/application/adminView.js'
import { hashPassword, verifyPassword } from '../src/modules/auth/application/passwords.js'
import { ALLOWED_ORIGIN } from './helpers.js'
import { type AccountRow, memoryAccounts } from './memoryAccounts.js'

const SECRET = 'test-secret-that-is-at-least-32-characters-long'
const PASSWORD = 'correct horse battery staple'
const T0 = new Date('2026-10-17T09:00:00+01:00')

let hash: string
beforeAll(async () => {
  hash = await hashPassword(PASSWORD)
})

function setup(requestLimit = 100) {
  const row = (id: string, role: AccountRow['role'], name: string): AccountRow => ({
    id,
    name,
    email: `${id}@example.com`,
    role,
    tokenVersion: 0,
    passwordHash: hash,
    createdAt: T0,
  })
  const store = memoryAccounts([
    row('editor1', 'editor', 'Edu Editor'),
    row('admin1', 'admin', 'Ada Admin'),
    row('dev1', 'developer', 'Dami Developer'),
    row('dev2', 'developer', 'Bisi Developer'),
  ])
  const app = createApp({
    clientOrigins: [ALLOWED_ORIGIN],
    isProduction: false,
    now: () => T0,
    auth: {
      jwtSecret: SECRET,
      admins: store.admins,
      accounts: store.accounts,
      loginRateLimit: { windowMs: 60_000, limit: 100 },
      requestRateLimit: { windowMs: 60_000, limit: requestLimit },
      submissionAdmin: {
        listFeedback: async () => ({ items: [], total: 0, page: 1, pageSize: 25 }),
        setFeedbackStatus: async () => null,
        listAlumni: async () => ({ items: [], total: 0, page: 1, pageSize: 25 }),
        removeAlumnus: async () => false,
      },
    },
  })

  /** Signs in and returns a request builder that carries the session cookie. */
  const as = async (email: string, password = PASSWORD) => {
    const res = await request(app).post('/api/auth/login').send({ email, password })
    const cookie = ([] as string[]).concat(res.headers['set-cookie'] ?? [])[0] ?? ''
    const send = (method: 'get' | 'post' | 'patch' | 'delete', path: string, body?: object) => {
      const req = request(app)[method](path).set('Cookie', cookie).set('Origin', ALLOWED_ORIGIN)
      return body ? req.send(body) : req
    }
    return { status: res.status, send }
  }
  return { app, rows: store.rows, as }
}

describe('who can manage accounts', () => {
  it('only developers; admins and editors get 403, signed-out people 401', async () => {
    const { app, as } = setup()
    expect((await request(app).get('/api/admin/accounts')).status).toBe(401)
    for (const email of ['editor1@example.com', 'admin1@example.com']) {
      const res = await (await as(email)).send('get', '/api/admin/accounts')
      expect(res.status, email).toBe(403)
      expect(res.body.error.code).toBe('FORBIDDEN')
    }

    const res = await (await as('dev1@example.com')).send('get', '/api/admin/accounts')
    expect(res.status).toBe(200)
    expect(res.headers['cache-control']).toBe('no-store')
    expect(res.body.accounts.map((a: { id: string }) => a.id)).toEqual([
      'dev2',
      'dev1',
      'admin1',
      'editor1',
    ])
    expect(JSON.stringify(res.body)).not.toMatch(/passwordHash|argon2/)
  })

  it('lets developers do everything admins can (feedback included)', async () => {
    const { as } = setup()
    const dev = await as('dev1@example.com')
    expect((await dev.send('get', '/api/admin/submissions/feedback')).status).toBe(200)
    expect(hasRole('developer', 'admin')).toBe(true)
    expect(hasRole('admin', 'developer')).toBe(false)
    expect(hasRole('editor', 'admin')).toBe(false)
    expect(ADMIN_ROLES).toEqual(['developer', 'admin', 'editor'])
  })
})

describe('creating an account', () => {
  it('stores only a hash and shows the generated password once, which then signs in', async () => {
    const { rows, as } = setup()
    const dev = await as('dev1@example.com')
    const res = await dev.send('post', '/api/admin/accounts', {
      name: '  Tolu Secretary ',
      email: ' Secretary@PANS.example ',
      role: 'admin',
    })
    expect(res.status).toBe(201)
    expect(res.body.account).toMatchObject({
      name: 'Tolu Secretary',
      email: 'secretary@pans.example',
      role: 'admin',
      lastLoginAt: null,
    })
    const { password } = res.body as { password: string }
    expect(password).toMatch(/^[\w-]{24}$/)
    const row = rows.find((r) => r.email === 'secretary@pans.example')!
    expect(row.passwordHash).not.toContain(password)
    expect(await verifyPassword(row.passwordHash, password)).toBe(true)

    expect((await as('secretary@pans.example', password)).status).toBe(200)
  })

  it('refuses a duplicate email, a developer role and missing details', async () => {
    const { as } = setup()
    const dev = await as('dev1@example.com')
    const duplicate = await dev.send('post', '/api/admin/accounts', {
      name: 'Again',
      email: 'ADMIN1@example.com',
      role: 'editor',
    })
    expect(duplicate.status).toBe(409)
    expect(duplicate.body.error.code).toBe('CONFLICT')

    for (const body of [
      { name: 'New Dev', email: 'newdev@example.com', role: 'developer' },
      { name: '', email: 'x@example.com', role: 'editor' },
      { name: 'No email', email: 'not-an-email', role: 'editor' },
      { name: 'Extra', email: 'y@example.com', role: 'editor', passwordHash: 'x' },
    ]) {
      const res = await dev.send('post', '/api/admin/accounts', body)
      expect(res.status, JSON.stringify(body)).toBe(400)
      expect(res.body.error.code).toBe('VALIDATION_ERROR')
    }
  })
})

describe('changing an account', () => {
  it('a password reset signs the person out and only the new password works', async () => {
    const { as } = setup()
    const admin = await as('admin1@example.com')
    expect((await admin.send('get', '/api/auth/me')).status).toBe(200)

    const dev = await as('dev1@example.com')
    const res = await dev.send('post', '/api/admin/accounts/admin1/reset-password')
    expect(res.status).toBe(200)
    expect(res.body.account.id).toBe('admin1')

    expect((await admin.send('get', '/api/auth/me')).status).toBe(401)
    expect((await as('admin1@example.com')).status).toBe(401)
    expect((await as('admin1@example.com', res.body.password)).status).toBe(200)
  })

  it('a role change applies to the next request', async () => {
    const { as } = setup()
    const admin = await as('admin1@example.com')
    expect((await admin.send('get', '/api/admin/submissions/feedback')).status).toBe(200)

    const dev = await as('dev1@example.com')
    const res = await dev.send('patch', '/api/admin/accounts/admin1', { role: 'editor' })
    expect(res.status).toBe(200)
    expect(res.body.account.role).toBe('editor')
    expect((await admin.send('get', '/api/admin/submissions/feedback')).status).toBe(403)
  })

  it('removing an account signs the person out at once', async () => {
    const { as } = setup()
    const editor = await as('editor1@example.com')
    const dev = await as('dev1@example.com')
    expect((await dev.send('delete', '/api/admin/accounts/editor1')).status).toBe(204)
    expect((await editor.send('get', '/api/auth/me')).status).toBe(401)
    const list = await dev.send('get', '/api/admin/accounts')
    expect(list.body.accounts.map((a: { id: string }) => a.id)).not.toContain('editor1')
  })

  it('never changes a developer account, the developer’s own included', async () => {
    const { as } = setup()
    const dev = await as('dev1@example.com')
    for (const id of ['dev1', 'dev2']) {
      for (const [method, path, body] of [
        ['patch', `/api/admin/accounts/${id}`, { role: 'editor' }],
        ['post', `/api/admin/accounts/${id}/reset-password`, undefined],
        ['delete', `/api/admin/accounts/${id}`, undefined],
      ] as const) {
        const res = await dev.send(method, path, body)
        expect(res.status, `${method} ${path}`).toBe(403)
        expect(res.body.error.message).toBe(DEVELOPER_ACCOUNTS_MESSAGE)
      }
    }
    expect((await dev.send('get', '/api/auth/me')).status).toBe(200)
  })

  it('answers 404 for an unknown account and 400 for a bad role', async () => {
    const { as } = setup()
    const dev = await as('dev1@example.com')
    expect((await dev.send('delete', '/api/admin/accounts/nobody')).status).toBe(404)
    expect(
      (await dev.send('patch', '/api/admin/accounts/admin1', { role: 'developer' })).status,
    ).toBe(400)
  })
})

describe('asking for access', () => {
  const ask = {
    name: 'Tolu Secretary',
    email: ' Tolu@PANS.example ',
    password: 'a-long-passphrase',
  }

  it('creates an account that cannot sign in until a developer approves it', async () => {
    const { app, rows, as } = setup()
    const res = await request(app).post('/api/auth/request-access').send(ask)
    expect(res.status).toBe(201)
    expect(res.body).toEqual({ received: true })

    const row = rows.find((r) => r.email === 'tolu@pans.example')!
    expect(row).toMatchObject({ name: 'Tolu Secretary', role: 'editor', pending: true })
    expect(row.passwordHash).not.toContain(ask.password)

    // The right password says "waiting"; a wrong one says nothing about the account.
    const waiting = await request(app)
      .post('/api/auth/login')
      .send({ email: 'tolu@pans.example', password: ask.password })
    expect(waiting.status).toBe(403)
    expect(waiting.body.error.message).toMatch(/waiting for approval/)
    expect(waiting.headers['set-cookie']).toBeUndefined()
    expect((await as('tolu@pans.example', 'wrong-password-here')).status).toBe(401)

    const dev = await as('dev1@example.com')
    const list = await dev.send('get', '/api/admin/accounts')
    expect(list.body.accounts[0]).toMatchObject({ email: 'tolu@pans.example', pending: true })

    const approved = await dev.send('post', `/api/admin/accounts/${row.id}/approve`, {
      role: 'admin',
    })
    expect(approved.status).toBe(200)
    expect(approved.body.account).toMatchObject({ role: 'admin', pending: false })

    const tolu = await as('tolu@pans.example', ask.password)
    expect(tolu.status).toBe(200)
    expect((await tolu.send('get', '/api/admin/submissions/feedback')).status).toBe(200)
    // Approving twice is refused.
    expect(
      (await dev.send('post', `/api/admin/accounts/${row.id}/approve`, { role: 'editor' })).status,
    ).toBe(409)
  })

  it('can be declined: removing the request leaves nothing behind', async () => {
    const { app, rows, as } = setup()
    await request(app).post('/api/auth/request-access').send(ask)
    const id = rows.find((r) => r.pending)!.id
    const dev = await as('dev1@example.com')
    expect((await dev.send('delete', `/api/admin/accounts/${id}`)).status).toBe(204)
    expect((await as('tolu@pans.example', ask.password)).status).toBe(401)
  })

  it('replies the same for an email that already has an account, and changes nothing', async () => {
    const { app, rows, as } = setup()
    const before = rows.length
    const res = await request(app)
      .post('/api/auth/request-access')
      .send({ ...ask, email: 'admin1@example.com' })
    expect(res.status).toBe(201)
    expect(res.body).toEqual({ received: true })
    expect(rows).toHaveLength(before)
    // The existing admin's password still works; the one in the request doesn't.
    expect((await as('admin1@example.com')).status).toBe(200)
    expect((await as('admin1@example.com', ask.password)).status).toBe(401)
  })

  it('refuses weak or malformed requests, ignores bots and never takes a role', async () => {
    const { app, rows } = setup()
    const before = rows.length
    for (const body of [
      { ...ask, password: 'short' },
      { ...ask, email: 'not-an-email' },
      { ...ask, name: '' },
      { ...ask, role: 'developer' },
      { ...ask, pending: false },
    ]) {
      const res = await request(app).post('/api/auth/request-access').send(body)
      expect(res.status, JSON.stringify(body)).toBe(400)
    }
    const bot = await request(app)
      .post('/api/auth/request-access')
      .send({ ...ask, website: 'http://spam.example' })
    expect(bot.status).toBe(201)
    expect(rows).toHaveLength(before)
  })

  it('is rate-limited and stops storing once too many requests are waiting', async () => {
    const limited = setup(2)
    const send = (app: typeof limited.app, n: number) =>
      request(app)
        .post('/api/auth/request-access')
        .send({ ...ask, email: `person${n}@example.com` })
    expect((await send(limited.app, 1)).status).toBe(201)
    expect((await send(limited.app, 2)).status).toBe(201)
    expect((await send(limited.app, 3)).status).toBe(429)

    const { app, rows } = setup(1000)
    for (let n = 0; n < MAX_PENDING_REQUESTS + 2; n++) await send(app, n)
    expect(rows.filter((r) => r.pending)).toHaveLength(MAX_PENDING_REQUESTS)
  }, 120_000)

  it('developers cannot be made by approving', async () => {
    const { app, rows, as } = setup()
    await request(app).post('/api/auth/request-access').send(ask)
    const id = rows.find((r) => r.pending)!.id
    const dev = await as('dev1@example.com')
    expect(
      (await dev.send('post', `/api/admin/accounts/${id}/approve`, { role: 'developer' })).status,
    ).toBe(400)
    const admin = await as('admin1@example.com')
    expect(
      (await admin.send('post', `/api/admin/accounts/${id}/approve`, { role: 'admin' })).status,
    ).toBe(403)
  })
})

describe('accounts API docs', () => {
  it('documents every route', () => {
    const paths = buildOpenApiDocument().paths ?? {}
    expect([
      paths['/api/admin/accounts']?.get?.operationId,
      paths['/api/admin/accounts']?.post?.operationId,
      paths['/api/admin/accounts/{id}']?.patch?.operationId,
      paths['/api/admin/accounts/{id}']?.delete?.operationId,
      paths['/api/admin/accounts/{id}/reset-password']?.post?.operationId,
    ]).toEqual([
      'listAccounts',
      'createAccount',
      'setAccountRole',
      'removeAccount',
      'resetAccountPassword',
    ])
  })
})
