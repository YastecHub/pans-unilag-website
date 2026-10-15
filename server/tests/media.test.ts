import { createHash } from 'node:crypto'
import request from 'supertest'
import { describe, expect, it } from 'vitest'
import { createApp } from '../src/app.js'
import { buildOpenApiDocument } from '../src/docs/openapi.js'
import { SESSION_COOKIE } from '../src/middleware/requireAdmin.js'
import type { AdminStore } from '../src/modules/auth/application/adminView.js'
import { signSessionToken } from '../src/modules/auth/application/sessionTokens.js'
import { isAllowedFolder } from '../src/modules/media/application/mediaFolders.js'
import { ALLOWED_ORIGIN } from './helpers.js'

const SECRET = 'test-secret-that-is-at-least-32-characters-long'
const NOW = new Date('2026-10-16T09:00:00Z')
const media = {
  cloudName: 'pans-test',
  apiKey: '123456789012345',
  apiSecret: 'cloudinary-api-secret-value',
}

const admins: AdminStore = {
  findByEmailWithHash: async () => null,
  findById: async (id) =>
    id === 'ed1'
      ? { id, name: 'Editor', email: 'ed@example.com', role: 'editor', tokenVersion: 0 }
      : null,
  recordLogin: async () => undefined,
}

function app(withMedia = true) {
  return createApp({
    clientOrigins: [ALLOWED_ORIGIN],
    isProduction: false,
    now: () => NOW,
    auth: { jwtSecret: SECRET, admins, media: withMedia ? media : undefined },
  })
}

const cookie = async () =>
  `${SESSION_COOKIE}=${await signSessionToken({ adminId: 'ed1', tokenVersion: 0 }, SECRET, 8, NOW)}`

const sign = async (body: object, server = app()) =>
  request(server)
    .post('/api/admin/media/signature')
    .set('Cookie', await cookie())
    .send(body)

/** Cloudinary's documented scheme: sorted key=value pairs joined by &, then the secret, SHA-1. */
const expectedSignature = (params: Record<string, string | number>) =>
  createHash('sha1')
    .update(
      Object.keys(params)
        .sort()
        .map((k) => `${k}=${params[k]}`)
        .join('&') + media.apiSecret,
    )
    .digest('hex')

describe('POST /api/admin/media/signature', () => {
  it('requires sign-in', async () => {
    const res = await request(app()).post('/api/admin/media/signature').send({ folder: 'brand' })
    expect(res.status).toBe(401)
  })

  it('signs an upload into an allowed folder without exposing the API secret', async () => {
    const res = await sign({ folder: 'executives/2026-2027', publicId: 'president' })

    expect(res.status).toBe(200)
    expect(res.headers['cache-control']).toBe('no-store')
    expect(res.body).toMatchObject({
      uploadUrl: 'https://api.cloudinary.com/v1_1/pans-test/image/upload',
      cloudName: 'pans-test',
      apiKey: media.apiKey,
      params: {
        allowed_formats: 'jpg,jpeg,png,webp',
        folder: 'pans-unilag/executives/2026-2027',
        timestamp: NOW.getTime() / 1000,
        public_id: 'president',
        overwrite: 'true',
        invalidate: 'true',
      },
      expiresAt: '2026-10-16T10:00:00.000Z',
    })
    expect(res.body.signature).toBe(expectedSignature(res.body.params))
    expect(JSON.stringify(res.body)).not.toContain(media.apiSecret)
  })

  it('leaves out public_id and overwrite when no name is given', async () => {
    const res = await sign({ folder: 'events/health-week-2026/day-3' })
    expect(Object.keys(res.body.params).sort()).toEqual(['allowed_formats', 'folder', 'timestamp'])
    expect(res.body.signature).toBe(expectedSignature(res.body.params))
  })

  it('refuses folders outside the README structure and bad names', async () => {
    for (const body of [
      { folder: 'secret' },
      { folder: '../brand' },
      { folder: 'pans-unilag/brand' },
      { folder: 'executives/2026-2028' },
      { folder: 'brand', publicId: '../logo' },
      { folder: 'brand', extra: true },
    ]) {
      const res = await sign(body)
      expect(res.status, JSON.stringify(body)).toBe(400)
      expect(res.body.error.code).toBe('VALIDATION_ERROR')
    }
  })

  it('returns 503 when Cloudinary is not configured', async () => {
    const res = await sign({ folder: 'brand' }, app(false))
    expect(res.status).toBe(503)
    expect(res.body.error.code).toBe('SERVICE_UNAVAILABLE')
  })

  it('is documented', () => {
    expect(buildOpenApiDocument().paths?.['/api/admin/media/signature']?.post?.operationId).toBe(
      'adminSignUpload',
    )
  })
})

describe('allowed folders', () => {
  it('matches the README folder structure', () => {
    const allowed = [
      'brand',
      'executives/2026-2027',
      'senate/2026-2027',
      'committees/admap',
      'events/pharmalympics-2026',
      'events/pharmalympics-2026/day-9',
      'publications/recipharm',
    ]
    const refused = [
      '',
      'brand/logos',
      'executives/2026',
      'senate/2026-2026',
      'committees/ADMAP',
      'events/a/b/c',
      'publications/blog',
      'albums/x',
    ]
    for (const f of allowed) expect(isAllowedFolder(f), f).toBe(true)
    for (const f of refused) expect(isAllowedFolder(f), f).toBe(false)
  })
})
