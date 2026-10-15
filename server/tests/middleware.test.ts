import express from 'express'
import request from 'supertest'
import { describe, expect, it } from 'vitest'
import { HttpError } from '../src/lib/httpError.js'
import { createErrorHandler } from '../src/middleware/errorHandler.js'
import { createRateLimiter } from '../src/middleware/rateLimit.js'

function appThatThrows(error: unknown, isProduction: boolean) {
  const app = express()
  app.get('/boom', () => {
    throw error
  })
  app.use(createErrorHandler({ isProduction, log: () => {} }))
  return app
}

describe('error handler', () => {
  it('uses the status and message of an HttpError', async () => {
    const res = await request(appThatThrows(new HttpError(403, 'Forbidden'), true)).get('/boom')

    expect(res.status).toBe(403)
    expect(res.body.error.message).toBe('Forbidden')
  })

  it('hides internal details in production', async () => {
    const res = await request(appThatThrows(new Error('db password is hunter2'), true)).get('/boom')

    expect(res.status).toBe(500)
    expect(res.body.error.message).toBe('Something went wrong. Please try again.')
    expect(JSON.stringify(res.body)).not.toMatch(/hunter2/)
  })

  it('includes debug information in development', async () => {
    const res = await request(appThatThrows(new Error('kaboom'), false)).get('/boom')

    expect(res.status).toBe(500)
    expect(res.body.error.debug).toMatch(/kaboom/)
  })
})

describe('rate limiter', () => {
  it('returns JSON 429 after the limit', async () => {
    const app = express()
    app.get('/limited', createRateLimiter({ windowMs: 60_000, limit: 2 }), (_req, res) => {
      res.json({ ok: true })
    })

    const agent = request(app)
    expect((await agent.get('/limited')).status).toBe(200)
    expect((await agent.get('/limited')).status).toBe(200)
    const third = await agent.get('/limited')
    expect(third.status).toBe(429)
    expect(third.body.error.message).toMatch(/Too many requests/)
  })
})
