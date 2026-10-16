import express from 'express'
import mongoose from 'mongoose'
import request from 'supertest'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { createApp } from '../src/app.js'
import { mongoRateLimitStores } from '../src/config/appFromEnv.js'
import { loadEnv } from '../src/config/env.js'
import { silentLogger } from '../src/lib/logger.js'
import {
  MongoRateLimitStore,
  type RateLimitCollection,
  type RateLimitDoc,
} from '../src/lib/mongoRateLimitStore.js'
import { createErrorHandler } from '../src/middleware/errorHandler.js'
import { createRateLimiter } from '../src/middleware/rateLimit.js'
import { createVercelHandler, originalUrl, vercelEnv } from '../src/vercel.js'
import { ALLOWED_ORIGIN } from './helpers.js'

type Filter = { _id: string; resetAt?: { $gt?: Date; $lte?: Date }; hits?: { $gt: number } }

/** Just enough of a MongoDB collection for the store, with the same matching and upsert rules. */
function fakeCollection() {
  const docs = new Map<string, RateLimitDoc>()
  const matches = (doc: RateLimitDoc | undefined, f: Filter) =>
    !!doc &&
    (f.resetAt?.$gt === undefined || doc.resetAt > f.resetAt.$gt) &&
    (f.resetAt?.$lte === undefined || doc.resetAt <= f.resetAt.$lte) &&
    (f.hits === undefined || doc.hits > f.hits.$gt)
  const apply = (
    doc: RateLimitDoc,
    u: { $inc?: { hits: number }; $set?: Partial<RateLimitDoc> },
  ) => {
    if (u.$inc) doc.hits += u.$inc.hits
    if (u.$set) Object.assign(doc, u.$set)
    return { ...doc }
  }
  const collection: RateLimitCollection & { docs: typeof docs; fail: boolean } = {
    docs,
    fail: false,
    async findOne(filter) {
      const f = filter as Filter
      const doc = docs.get(f._id)
      return matches(doc, f) ? { ...doc! } : null
    },
    async findOneAndUpdate(filter, update, options) {
      if (collection.fail) throw new Error('database unreachable')
      const f = filter as Filter
      const doc = docs.get(f._id)
      if (matches(doc, f)) return apply(doc!, update as never)
      if (!options.upsert) return null
      if (doc) throw Object.assign(new Error('E11000 duplicate key'), { code: 11000 })
      const created = { _id: f._id, hits: 0, resetAt: new Date(0) }
      docs.set(f._id, created)
      return apply(created, update as never)
    },
    async updateOne(filter, update) {
      const f = filter as Filter
      const doc = docs.get(f._id)
      if (matches(doc, f)) apply(doc!, update as never)
    },
    async deleteOne(filter) {
      docs.delete((filter as Filter)._id)
    },
    async createIndex() {},
  }
  return collection
}

/** Two separate apps, like two serverless instances, sharing one counter collection. */
function instances(collection: RateLimitCollection, limit: number, clock: () => Date) {
  return [1, 2].map(() => {
    const app = express()
    app.get(
      '/limited',
      createRateLimiter({
        windowMs: 60_000,
        limit,
        store: new MongoRateLimitStore(() => collection, 'test', clock),
      }),
      (_req, res) => {
        res.json({ ok: true })
      },
    )
    app.use(createErrorHandler({ isProduction: true, logger: silentLogger }))
    return app
  })
}

describe('shared rate limits (one count across every instance)', () => {
  it('counts requests to different instances together, and starts again after the window', async () => {
    let now = new Date('2026-10-16T10:00:00Z')
    const collection = fakeCollection()
    const [a, b] = instances(collection, 3, () => now)
    expect((await request(a!).get('/limited')).status).toBe(200)
    expect((await request(b!).get('/limited')).status).toBe(200)
    const third = await request(a!).get('/limited')
    expect(third.status).toBe(200)
    expect(third.headers.ratelimit).toMatch(/r=0/)
    const fourth = await request(b!).get('/limited')
    expect(fourth.status).toBe(429)
    expect(fourth.body.error.code).toBe('RATE_LIMITED')
    expect([...collection.docs.values()]).toEqual([
      { _id: expect.stringMatching(/^test:/), hits: 4, resetAt: new Date('2026-10-16T10:01:00Z') },
    ])

    now = new Date('2026-10-16T10:01:00Z')
    expect((await request(b!).get('/limited')).status).toBe(200)
    expect([...collection.docs.values()][0]!.hits).toBe(1)
  })

  it('keeps each limiter’s counts apart and can reset or undo one', async () => {
    const now = () => new Date('2026-10-16T10:00:00Z')
    const collection = fakeCollection()
    const login = new MongoRateLimitStore(() => collection, 'login', now)
    const feedback = new MongoRateLimitStore(() => collection, 'feedback', now)
    login.init({ windowMs: 900_000 } as never)
    feedback.init({ windowMs: 3_600_000 } as never)
    await login.increment('1.2.3.4')
    await login.increment('1.2.3.4')
    expect(await feedback.get('1.2.3.4')).toBeUndefined()
    expect((await feedback.increment('1.2.3.4')).resetTime).toEqual(
      new Date('2026-10-16T11:00:00Z'),
    )
    await login.decrement('1.2.3.4')
    expect(await login.get('1.2.3.4')).toEqual({
      totalHits: 1,
      resetTime: new Date('2026-10-16T10:15:00Z'),
    })
    await login.resetKey('1.2.3.4')
    expect(await login.get('1.2.3.4')).toBeUndefined()
  })

  it('counts a request that loses the race to start a window', async () => {
    const now = () => new Date('2026-10-16T10:00:00Z')
    const collection = fakeCollection()
    const store = new MongoRateLimitStore(() => collection, 'race', now)
    store.init({ windowMs: 60_000 } as never)
    const real = collection.findOneAndUpdate.bind(collection)
    let first = true
    // The first "open window" lookup misses, then another instance starts the window.
    collection.findOneAndUpdate = async (filter, update, options) => {
      if (first) {
        first = false
        collection.docs.set('race:ip', {
          _id: 'race:ip',
          hits: 1,
          resetAt: new Date('2026-10-16T10:01:00Z'),
        })
        return null
      }
      return real(filter, update, options)
    }
    expect((await store.increment('ip')).totalHits).toBe(2)
  })

  it('lets people through if the database is unreachable', async () => {
    const collection = fakeCollection()
    const [a] = instances(collection, 1, () => new Date())
    collection.fail = true
    expect((await request(a!).get('/limited')).status).toBe(200)
    expect((await request(a!).get('/limited')).status).toBe(200)
  })

  it('uses a named store for sign-in and each form', () => {
    const names: string[] = []
    createApp({
      clientOrigins: [ALLOWED_ORIGIN],
      isProduction: true,
      rateLimitStores: (name) => {
        names.push(name)
        return new MongoRateLimitStore(() => fakeCollection(), name)
      },
      auth: { jwtSecret: 'x'.repeat(32) },
    })
    expect(names.sort()).toEqual(['alumni', 'feedback', 'login'])
    expect(mongoRateLimitStores('login')).toBeInstanceOf(MongoRateLimitStore)
  })
})

describe('the Vercel function', () => {
  const env = () =>
    loadEnv({
      NODE_ENV: 'production',
      MONGODB_URI: 'mongodb+srv://user:pass@cluster.example/pans',
      CLIENT_ORIGIN: 'https://pans-unilag.vercel.app',
      JWT_SECRET: 'x'.repeat(40),
    })

  it('answers 503 while the database can’t be reached, then recovers on the next request', async () => {
    const connect = vi
      .fn<(uri: string) => Promise<void>>()
      .mockRejectedValueOnce(new Error('Could not connect to MongoDB'))
      .mockResolvedValue(undefined)
    const handler = createVercelHandler({ env, connect, logger: silentLogger })

    const down = await request(handler).get('/api/health')
    expect(down.status).toBe(503)
    expect(down.headers['retry-after']).toBe('10')
    expect(down.body.error.code).toBe('SERVICE_UNAVAILABLE')

    const up = await request(handler).get('/api/health')
    expect(up.status).toBe(200)
    expect(up.headers['x-request-id']).toBeTruthy()
    // Warm requests reuse the app and the connection.
    await request(handler).get('/api/health')
    expect(connect).toHaveBeenCalledTimes(2)
    expect(connect).toHaveBeenCalledWith('mongodb+srv://user:pass@cluster.example/pans')
  })

  it('refuses to start without JWT_SECRET, before touching the database', async () => {
    const connect = vi.fn(async () => undefined)
    const handler = createVercelHandler({
      env: () => loadEnv({ MONGODB_URI: 'mongodb://localhost/pans' }),
      connect,
      logger: silentLogger,
    })
    expect((await request(handler).get('/api/health')).status).toBe(503)
    expect(connect).not.toHaveBeenCalled()
  })

  it('runs in production mode on Vercel even if NODE_ENV was left out', () => {
    const base = { MONGODB_URI: 'mongodb://localhost/pans', JWT_SECRET: 'x'.repeat(40) }
    expect(vercelEnv(base).NODE_ENV).toBe('production')
    expect(vercelEnv({ ...base, NODE_ENV: '' }).NODE_ENV).toBe('production')
    expect(vercelEnv({ ...base, NODE_ENV: 'development' }).NODE_ENV).toBe('development')
  })

  it('restores the original path if the rewrite passes it as ?path=', () => {
    expect(originalUrl('/api/events?status=upcoming')).toBe('/api/events?status=upcoming')
    expect(originalUrl('/api?path=events&status=upcoming')).toBe('/api/events?status=upcoming')
    expect(originalUrl('/api?path=admin%2Fevents%2Fev1')).toBe('/api/admin/events/ev1')
    expect(originalUrl('/api/?path=health')).toBe('/api/health')
    expect(originalUrl('/api')).toBe('/api')
  })

  it('serves the API from the original /api path it was rewritten from', async () => {
    const handler = createVercelHandler({
      env,
      connect: async () => undefined,
      logger: silentLogger,
    })
    const res = await request(handler).get('/api/does-not-exist')
    expect(res.status).toBe(404)
    expect(res.body.error.code).toBe('NOT_FOUND')
    expect((await request(handler).get('/api?path=health')).status).toBe(200)
  })
})

/** Runs only when MONGODB_URI_TEST points at a throwaway database (see seed.integration.test.ts). */
const uri = process.env.MONGODB_URI_TEST
describe.skipIf(!uri)('shared rate limits against a real MongoDB', () => {
  beforeAll(async () => {
    await mongoose.connect(uri!)
    await mongoose.connection.collection('ratelimits').deleteMany({ _id: /^it-test:/ } as never)
  })
  afterAll(async () => {
    await mongoose.connection.collection('ratelimits').deleteMany({ _id: /^it-test:/ } as never)
    await mongoose.disconnect()
  })

  it('counts concurrent first requests in one window', async () => {
    const store = mongoRateLimitStores('it-test') as MongoRateLimitStore
    store.init({ windowMs: 60_000 } as never)
    const results = await Promise.all(Array.from({ length: 8 }, () => store.increment('ip')))
    expect(results.map((r) => r.totalHits).sort((x, y) => x - y)).toEqual([1, 2, 3, 4, 5, 6, 7, 8])
    expect((await store.get('ip'))?.totalHits).toBe(8)
  })
})
