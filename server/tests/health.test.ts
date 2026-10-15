import request from 'supertest'
import { describe, expect, it } from 'vitest'
import { testApp } from './helpers.js'

describe('GET /api/health', () => {
  it('responds with status and database state', async () => {
    const res = await request(testApp()).get('/api/health')

    expect(res.status).toBe(200)
    expect(res.headers['content-type']).toMatch(/json/)
    // No database is connected in unit tests.
    expect(res.body).toMatchObject({ status: 'degraded', db: 'disconnected' })
    expect(typeof res.body.uptimeSeconds).toBe('number')
  })

  it('sends security headers and hides the framework', async () => {
    const res = await request(testApp()).get('/api/health')

    expect(res.headers['x-content-type-options']).toBe('nosniff')
    expect(res.headers['x-powered-by']).toBeUndefined()
  })
})
