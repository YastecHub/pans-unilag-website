import request from 'supertest'
import { beforeAll, describe, expect, it } from 'vitest'
import { createApp } from '../src/app.js'
import { buildOpenApiDocument } from '../src/docs/openapi.js'
import { DEVELOPER_ACCOUNTS_MESSAGE } from '../src/modules/auth/application/accounts.js'
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

function setup() {
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
