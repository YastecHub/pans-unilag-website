import express from 'express'
import cookieParser from 'cookie-parser'
import request from 'supertest'
import { beforeAll, describe, expect, it } from 'vitest'
import { createApp } from '../src/app.js'
import { loadEnv } from '../src/config/env.js'
import { buildOpenApiDocument } from '../src/docs/openapi.js'
import { silentLogger } from '../src/lib/logger.js'
import { createErrorHandler } from '../src/middleware/errorHandler.js'
import { createAuthGuard, SESSION_COOKIE } from '../src/middleware/requireAdmin.js'
import type { AdminStore, StoredAdmin } from '../src/modules/auth/application/adminView.js'
import { hashPassword, verifyPassword } from '../src/modules/auth/application/passwords.js'
import {
  signSessionToken,
  verifySessionToken,
} from '../src/modules/auth/application/sessionTokens.js'
import { AdminModel } from '../src/modules/auth/infrastructure/admin.model.js'
import { ALLOWED_ORIGIN } from './helpers.js'

const SECRET = 'test-secret-that-is-at-least-32-characters-long'
const PASSWORD = 'correct horse battery staple'
const T0 = new Date('2026-10-16T09:00:00+01:00')

type Row = StoredAdmin & { passwordHash: string; lastLoginAt?: Date }

let hash: string
beforeAll(async () => {
  hash = await hashPassword(PASSWORD)
})

function memoryStore(rows: Row[]): AdminStore {
  return {
    findByEmailWithHash: async (email) => rows.find((r) => r.email === email) ?? null,
    findById: async (id) => {
      const row = rows.find((r) => r.id === id)
      if (!row) return null
      return {
        id: row.id,
        name: row.name,
        email: row.email,
        role: row.role,
        tokenVersion: row.tokenVersion,
      }
    },
    recordLogin: async (id, at) => {
      const row = rows.find((r) => r.id === id)
      if (row) row.lastLoginAt = at
    },
  }
}

function setup(options: { isProduction?: boolean; limit?: number } = {}) {
  const rows: Row[] = [
    {
      id: 'a1',
      name: 'Ada Okafor',
      email: 'ada@example.com',
      role: 'admin',
      tokenVersion: 0,
      passwordHash: hash,
    },
  ]
  const clock = { now: T0 }
  const app = createApp({
    clientOrigins: [ALLOWED_ORIGIN],
    isProduction: options.isProduction ?? false,
    now: () => clock.now,
    auth: {
      jwtSecret: SECRET,
      admins: memoryStore(rows),
      loginRateLimit: { windowMs: 60_000, limit: options.limit ?? 100 },
    },
  })
  return { app, rows, clock }
}

const login = (app: express.Express, email = 'ada@example.com', password = PASSWORD) =>
  request(app).post('/api/auth/login').send({ email, password })

const sessionCookie = (res: request.Response) =>
  ([] as string[])
    .concat(res.headers['set-cookie'] ?? [])
    .find((c) => c.startsWith(`${SESSION_COOKIE}=`))

describe('POST /api/auth/login', () => {
  it('signs in and sets an httpOnly, SameSite=Lax session cookie', async () => {
    const { app, rows } = setup()
    const res = await login(app, 'ADA@example.com ')

    expect(res.status).toBe(200)
    expect(res.body).toEqual({
      admin: { id: 'a1', name: 'Ada Okafor', email: 'ada@example.com', role: 'admin' },
    })
    const cookie = sessionCookie(res)!
    expect(cookie).toMatch(/HttpOnly/)
    expect(cookie).toMatch(/SameSite=Lax/)
    expect(cookie).toMatch(/Path=\/api/)
    expect(cookie).toMatch(/Max-Age=28800/)
    expect(cookie).not.toMatch(/Secure/)
    expect(res.headers['cache-control']).toBe('no-store')
    expect(rows[0]?.lastLoginAt).toEqual(T0)
  })

  it('marks the cookie Secure in production', async () => {
    const res = await login(setup({ isProduction: true }).app)
    expect(sessionCookie(res)).toMatch(/Secure/)
  })

  it('never sends the password hash or token version', async () => {
    const res = await login(setup().app)
    expect(JSON.stringify(res.body)).not.toMatch(/argon2|passwordHash|tokenVersion/)
  })

  it('returns the same 401 for a wrong password and an unknown email', async () => {
    const { app } = setup()
    for (const res of [
      await login(app, 'ada@example.com', 'wrong'),
      await login(app, 'nobody@example.com'),
    ]) {
      expect(res.status).toBe(401)
      expect(res.body.error).toMatchObject({
        code: 'UNAUTHORIZED',
        message: 'Email or password is incorrect',
      })
      expect(sessionCookie(res)).toBeUndefined()
    }
  })

  it('rejects a malformed body', async () => {
    const { app } = setup()
    for (const body of [
      {},
      { email: 'ada', password: 'x' },
      { email: 'ada@example.com', password: PASSWORD, role: 'admin' },
    ]) {
      expect((await request(app).post('/api/auth/login').send(body)).status).toBe(400)
    }
  })

  it('rate-limits sign-in attempts per IP', async () => {
    const { app } = setup({ limit: 2 })
    await login(app, 'ada@example.com', 'wrong')
    await login(app, 'ada@example.com', 'wrong')
    const blocked = await login(app)
    expect(blocked.status).toBe(429)
    expect(blocked.body.error.code).toBe('RATE_LIMITED')
  })
})

describe('GET /api/auth/me and sessions', () => {
  it('returns 401 without a cookie', async () => {
    const res = await request(setup().app).get('/api/auth/me')
    expect(res.status).toBe(401)
    expect(res.body.error.code).toBe('UNAUTHORIZED')
  })

  it('returns the signed-in admin with a valid cookie', async () => {
    const { app } = setup()
    const agent = request.agent(app)
    await agent.post('/api/auth/login').send({ email: 'ada@example.com', password: PASSWORD })

    const res = await agent.get('/api/auth/me')
    expect(res.status).toBe(200)
    expect(res.body.admin.email).toBe('ada@example.com')
  })

  it('rejects a tampered cookie and clears it', async () => {
    const { app } = setup()
    const token = await signSessionToken(
      { adminId: 'a1', tokenVersion: 0 },
      'another-secret-another-secret-123',
      8,
      T0,
    )
    const res = await request(app).get('/api/auth/me').set('Cookie', `${SESSION_COOKIE}=${token}`)

    expect(res.status).toBe(401)
    expect(sessionCookie(res)).toMatch(/Expires=Thu, 01 Jan 1970/)
  })

  it('expires sessions after 8 hours', async () => {
    const { app, clock } = setup()
    const agent = request.agent(app)
    await agent.post('/api/auth/login').send({ email: 'ada@example.com', password: PASSWORD })

    clock.now = new Date(T0.getTime() + 8 * 3600_000 - 1000)
    expect((await agent.get('/api/auth/me')).status).toBe(200)
    clock.now = new Date(T0.getTime() + 8 * 3600_000 + 1000)
    expect((await agent.get('/api/auth/me')).status).toBe(401)
  })

  it('ends every session when the password is reset or the admin is removed', async () => {
    const { app, rows } = setup()
    const agent = request.agent(app)
    await agent.post('/api/auth/login').send({ email: 'ada@example.com', password: PASSWORD })

    rows[0]!.tokenVersion = 1 // create-admin --reset-password
    expect((await agent.get('/api/auth/me')).status).toBe(401)

    await agent.post('/api/auth/login').send({ email: 'ada@example.com', password: PASSWORD })
    expect((await agent.get('/api/auth/me')).status).toBe(200)
    rows.pop() // create-admin --remove
    expect((await agent.get('/api/auth/me')).status).toBe(401)
  })

  it('signs out by clearing the cookie', async () => {
    const { app } = setup()
    const agent = request.agent(app)
    await agent.post('/api/auth/login').send({ email: 'ada@example.com', password: PASSWORD })

    const res = await agent.post('/api/auth/logout')
    expect(res.status).toBe(204)
    expect(sessionCookie(res)).toMatch(/Expires=Thu, 01 Jan 1970/)
    expect((await agent.get('/api/auth/me')).status).toBe(401)
  })

  it('is not mounted when the app has no auth configured', async () => {
    const app = createApp({ clientOrigins: [ALLOWED_ORIGIN], isProduction: false })
    expect((await request(app).post('/api/auth/login').send({})).status).toBe(404)
  })
})

describe('requireRole', () => {
  it('lets admins through and gives editors 403', async () => {
    const rows: Row[] = [
      {
        id: 'a1',
        name: 'A',
        email: 'a@example.com',
        role: 'admin',
        tokenVersion: 0,
        passwordHash: hash,
      },
      {
        id: 'e1',
        name: 'E',
        email: 'e@example.com',
        role: 'editor',
        tokenVersion: 0,
        passwordHash: hash,
      },
    ]
    const guard = createAuthGuard(memoryStore(rows), SECRET, () => T0)
    const app = express()
    app.use(cookieParser())
    app.get('/api/admins', guard.requireAdmin, guard.requireRole('admin'), (_req, res) => {
      res.json({ ok: true })
    })
    app.use(createErrorHandler({ isProduction: false, logger: silentLogger }))

    const as = async (id: string) =>
      `${SESSION_COOKIE}=${await signSessionToken({ adminId: id, tokenVersion: 0 }, SECRET, 8, T0)}`
    expect(
      (
        await request(app)
          .get('/api/admins')
          .set('Cookie', await as('a1'))
      ).status,
    ).toBe(200)
    const editor = await request(app)
      .get('/api/admins')
      .set('Cookie', await as('e1'))
    expect(editor.status).toBe(403)
    expect(editor.body.error.code).toBe('FORBIDDEN')
  })
})

describe('building blocks', () => {
  it('hashes with argon2id and verifies only the right password', async () => {
    expect(hash).toMatch(/^\$argon2id\$/)
    expect(await verifyPassword(hash, PASSWORD)).toBe(true)
    expect(await verifyPassword(hash, 'wrong')).toBe(false)
    expect(await verifyPassword('not-a-hash', PASSWORD)).toBe(false)
  })

  it('verifies session tokens only with the right secret and before expiry', async () => {
    const token = await signSessionToken({ adminId: 'a1', tokenVersion: 3 }, SECRET, 8, T0)
    expect(await verifySessionToken(token, SECRET, T0)).toEqual({ adminId: 'a1', tokenVersion: 3 })
    expect(await verifySessionToken(token, `${SECRET}x`, T0)).toBeNull()
    expect(await verifySessionToken(`${token}x`, SECRET, T0)).toBeNull()
    expect(
      await verifySessionToken(token, SECRET, new Date(T0.getTime() + 9 * 3600_000)),
    ).toBeNull()
  })

  it('never selects the password hash by default', () => {
    expect(AdminModel.schema.path('passwordHash').options.select).toBe(false)
    expect(AdminModel.schema.path('email').options.unique).toBe(true)
  })

  it('validates JWT_SECRET length and treats empty as unset', () => {
    const base = { MONGODB_URI: 'mongodb://localhost/pans' }
    expect(loadEnv({ ...base, JWT_SECRET: '' }).JWT_SECRET).toBeUndefined()
    expect(() => loadEnv({ ...base, JWT_SECRET: 'short' })).toThrow(/at least 32 characters/)
    expect(loadEnv({ ...base, JWT_SECRET: SECRET }).JWT_SECRET).toBe(SECRET)
  })

  it('documents the three auth routes', () => {
    const paths = buildOpenApiDocument().paths ?? {}
    expect(paths['/api/auth/login']?.post?.operationId).toBe('login')
    expect(paths['/api/auth/logout']?.post?.operationId).toBe('logout')
    expect(paths['/api/auth/me']?.get?.operationId).toBe('getCurrentAdmin')
  })
})
