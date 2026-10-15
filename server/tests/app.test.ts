import request from 'supertest'
import { describe, expect, it } from 'vitest'
import { ALLOWED_ORIGIN, testApp } from './helpers.js'

describe('app', () => {
  it('returns JSON 404 for unknown routes', async () => {
    const res = await request(testApp()).get('/api/does-not-exist')

    expect(res.status).toBe(404)
    expect(res.body).toEqual({ error: { message: 'Not found: GET /api/does-not-exist' } })
  })

  it('returns JSON 400 for invalid JSON bodies', async () => {
    const res = await request(testApp())
      .post('/api/health')
      .set('Content-Type', 'application/json')
      .send('{"broken":')

    expect(res.status).toBe(400)
    expect(res.body.error.message).toBe('Request body is not valid JSON')
  })

  it('returns JSON 413 for bodies over the size limit', async () => {
    const res = await request(testApp())
      .post('/api/health')
      .set('Content-Type', 'application/json')
      .send(JSON.stringify({ text: 'x'.repeat(150_000) }))

    expect(res.status).toBe(413)
    expect(res.body.error.message).toBe('Request body is too large')
  })

  it('allows CORS only for the configured origin', async () => {
    const allowed = await request(testApp()).get('/api/health').set('Origin', ALLOWED_ORIGIN)
    const blocked = await request(testApp())
      .get('/api/health')
      .set('Origin', 'https://evil.example')

    expect(allowed.headers['access-control-allow-origin']).toBe(ALLOWED_ORIGIN)
    expect(allowed.headers['access-control-allow-credentials']).toBe('true')
    expect(blocked.headers['access-control-allow-origin']).toBeUndefined()
  })
})
