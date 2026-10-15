import request from 'supertest'
import { describe, expect, it } from 'vitest'
import { ALLOWED_ORIGIN, testApp } from './helpers.js'

describe('app', () => {
  it('returns a NOT_FOUND error for unknown routes', async () => {
    const res = await request(testApp()).get('/api/does-not-exist')

    expect(res.status).toBe(404)
    expect(res.body).toEqual({
      error: {
        code: 'NOT_FOUND',
        message: 'Not found: GET /api/does-not-exist',
        requestId: res.headers['x-request-id'],
      },
    })
  })

  it('returns INVALID_JSON for malformed bodies', async () => {
    const res = await request(testApp())
      .post('/api/health')
      .set('Content-Type', 'application/json')
      .send('{"broken":')

    expect(res.status).toBe(400)
    expect(res.body.error).toMatchObject({
      code: 'INVALID_JSON',
      message: 'Request body is not valid JSON',
    })
  })

  it('returns PAYLOAD_TOO_LARGE for bodies over the size limit', async () => {
    const res = await request(testApp())
      .post('/api/health')
      .set('Content-Type', 'application/json')
      .send(JSON.stringify({ text: 'x'.repeat(150_000) }))

    expect(res.status).toBe(413)
    expect(res.body.error).toMatchObject({
      code: 'PAYLOAD_TOO_LARGE',
      message: 'Request body is too large',
    })
  })

  it('allows CORS only for the configured origin and exposes X-Request-Id', async () => {
    const allowed = await request(testApp()).get('/api/health').set('Origin', ALLOWED_ORIGIN)
    const blocked = await request(testApp())
      .get('/api/health')
      .set('Origin', 'https://evil.example')

    expect(allowed.headers['access-control-allow-origin']).toBe(ALLOWED_ORIGIN)
    expect(allowed.headers['access-control-allow-credentials']).toBe('true')
    expect(allowed.headers['access-control-expose-headers']).toMatch(/X-Request-Id/i)
    expect(blocked.headers['access-control-allow-origin']).toBeUndefined()
  })
})

describe('request id', () => {
  it('generates an id for every request', async () => {
    const res = await request(testApp()).get('/api/health')

    expect(res.headers['x-request-id']).toMatch(/^[0-9a-f-]{36}$/)
  })

  it('reuses a safe incoming X-Request-Id', async () => {
    const res = await request(testApp()).get('/api/nope').set('X-Request-Id', 'render-abc.123')

    expect(res.headers['x-request-id']).toBe('render-abc.123')
    expect(res.body.error.requestId).toBe('render-abc.123')
  })

  it('replaces an unsafe incoming X-Request-Id', async () => {
    const res = await request(testApp())
      .get('/api/health')
      .set('X-Request-Id', '<script>alert(1)</script>')

    expect(res.headers['x-request-id']).toMatch(/^[0-9a-f-]{36}$/)
  })
})
