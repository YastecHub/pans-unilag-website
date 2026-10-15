import express from 'express'
import request from 'supertest'
import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import { createErrorHandler } from '../src/middleware/errorHandler.js'
import { validate } from '../src/middleware/validate.js'

function appWithRoute() {
  const app = express()
  app.use(express.json())
  app.post(
    '/items/:id',
    validate({
      params: z.strictObject({ id: z.string().regex(/^\d+$/) }),
      query: z.strictObject({ preview: z.enum(['true', 'false']).optional() }),
      body: z.strictObject({ name: z.string().min(1), count: z.coerce.number().int() }),
    }),
    (req, res) => {
      res.json({ params: req.params, query: req.query, body: req.body })
    },
  )
  app.use(createErrorHandler({ isProduction: true, log: () => {} }))
  return app
}

describe('validate middleware', () => {
  it('passes parsed values to the route', async () => {
    const res = await request(appWithRoute())
      .post('/items/7?preview=true')
      .send({ name: 'Recipharm', count: '3' })

    expect(res.status).toBe(200)
    expect(res.body).toEqual({
      params: { id: '7' },
      query: { preview: 'true' },
      body: { name: 'Recipharm', count: 3 },
    })
  })

  it('rejects unknown fields and invalid values with details', async () => {
    const res = await request(appWithRoute())
      .post('/items/abc')
      .send({ name: '', count: 1, isAdmin: true })

    expect(res.status).toBe(400)
    expect(res.body.error.message).toBe('Invalid request')
    const locations = res.body.error.details.map((d: { location: string }) => d.location)
    expect(locations).toContain('params')
    expect(locations).toContain('body')
    const messages = JSON.stringify(res.body.error.details)
    expect(messages).toMatch(/isAdmin/)
  })
})
