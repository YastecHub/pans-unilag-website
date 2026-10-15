import express from 'express'
import request from 'supertest'
import { describe, expect, it } from 'vitest'
import { createLogger, silentLogger } from '../src/lib/logger.js'
import { createErrorHandler } from '../src/middleware/errorHandler.js'
import { createRateLimiter } from '../src/middleware/rateLimit.js'

describe('rate limiter', () => {
  it('returns RATE_LIMITED with a Retry-After header after the limit', async () => {
    const app = express()
    app.get('/limited', createRateLimiter({ windowMs: 60_000, limit: 2 }), (_req, res) => {
      res.json({ ok: true })
    })
    app.use(createErrorHandler({ isProduction: true, logger: silentLogger }))

    const agent = request(app)
    expect((await agent.get('/limited')).status).toBe(200)
    expect((await agent.get('/limited')).status).toBe(200)
    const third = await agent.get('/limited')
    expect(third.status).toBe(429)
    expect(third.body.error).toMatchObject({
      code: 'RATE_LIMITED',
      message: 'Too many requests. Please try again later.',
    })
    expect(third.headers['retry-after']).toBeDefined()
  })
})

describe('logger', () => {
  it('writes one JSON object per line in JSON mode, serialising errors', () => {
    const lines: string[] = []
    const logger = createLogger({ json: true, write: (line) => lines.push(line) })

    logger.error('Something failed', {
      requestId: 'abc',
      error: new Error('outer', { cause: new Error('inner') }),
    })

    const entry = JSON.parse(lines[0] ?? '')
    expect(entry).toMatchObject({
      level: 'error',
      message: 'Something failed',
      requestId: 'abc',
      error: { name: 'Error', message: 'outer', cause: { message: 'inner' } },
    })
    expect(typeof entry.time).toBe('string')
  })

  it('writes readable text in development mode', () => {
    const lines: string[] = []
    const logger = createLogger({ json: false, write: (line) => lines.push(line) })

    logger.info('API started', { port: 4000 })

    expect(lines[0]).toMatch(/INFO API started \{"port":4000\}$/)
  })
})
