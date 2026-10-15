import request from 'supertest'
import { describe, expect, it } from 'vitest'
import { createApp } from '../src/app.js'
import { buildOpenApiDocument } from '../src/docs/openapi.js'
import type {
  NewAlumnus,
  NewFeedback,
  SubmissionStore,
} from '../src/modules/submissions/application/submissionRules.js'
import { ALLOWED_ORIGIN } from './helpers.js'
import { seedReaders } from './seedReaders.js'

const NOW = new Date('2026-10-16T09:00:00+01:00')

function setup(formRateLimit = { windowMs: 60_000, limit: 100 }) {
  const saved = { feedback: [] as NewFeedback[], alumni: [] as NewAlumnus[] }
  const store: SubmissionStore = {
    saveFeedback: async (f) => void saved.feedback.push(f),
    saveAlumnus: async (a) => void saved.alumni.push(a),
  }
  const app = createApp({
    clientOrigins: [ALLOWED_ORIGIN],
    isProduction: false,
    readers: seedReaders(),
    now: () => NOW,
    submissions: store,
    formRateLimit,
  })
  return { app, saved }
}

const feedback = { category: 'suggestion', message: 'Please post the Pharmathon results online.' }
const alumnus = {
  name: 'Ada Okafor',
  graduationYear: 2019,
  email: 'Ada@Example.com',
  interests: ['mentoring'],
  consent: true,
}

describe('POST /api/feedback', () => {
  it('stores anonymous feedback and replies without echoing it', async () => {
    const { app, saved } = setup()
    const res = await request(app).post('/api/feedback').send(feedback)

    expect(res.status).toBe(201)
    expect(res.body).toEqual({ received: true })
    expect(res.headers['cache-control']).toBe('no-store')
    expect(saved.feedback).toEqual([feedback])
  })

  it('keeps a contact email when given and treats an empty one as anonymous', async () => {
    const { app, saved } = setup()
    await request(app)
      .post('/api/feedback')
      .send({ ...feedback, contactEmail: 'me@example.com' })
    await request(app)
      .post('/api/feedback')
      .send({ ...feedback, contactEmail: '' })

    expect(saved.feedback[0]?.contactEmail).toBe('me@example.com')
    expect(saved.feedback[1]).not.toHaveProperty('contactEmail', expect.anything())
  })

  it('rejects an oversized message, a short one, a bad category and unknown fields', async () => {
    const { app, saved } = setup()
    const cases = [
      { ...feedback, message: 'x'.repeat(2001) },
      { ...feedback, message: 'hi' },
      { ...feedback, category: 'praise' },
      { ...feedback, contactEmail: 'not-an-email' },
      { ...feedback, status: 'resolved' },
    ]
    for (const body of cases) {
      const res = await request(app).post('/api/feedback').send(body)
      expect(res.status, JSON.stringify(body).slice(0, 60)).toBe(400)
      expect(res.body.error.code).toBe('VALIDATION_ERROR')
    }
    expect(saved.feedback).toEqual([])
  })

  it('drops honeypot submissions silently', async () => {
    const { app, saved } = setup()
    const res = await request(app)
      .post('/api/feedback')
      .send({ ...feedback, website: 'https://spam.example' })

    expect(res.status).toBe(201)
    expect(res.body).toEqual({ received: true })
    expect(saved.feedback).toEqual([])
  })

  it('rate-limits each IP with 429 RATE_LIMITED', async () => {
    const { app, saved } = setup({ windowMs: 60_000, limit: 2 })
    for (let i = 0; i < 2; i++)
      expect((await request(app).post('/api/feedback').send(feedback)).status).toBe(201)

    const blocked = await request(app).post('/api/feedback').send(feedback)
    expect(blocked.status).toBe(429)
    expect(blocked.body.error.code).toBe('RATE_LIMITED')
    expect(blocked.headers['retry-after']).toBeDefined()
    expect(saved.feedback).toHaveLength(2)
  })
})

describe('POST /api/alumni', () => {
  it('stores the details with the consent time, never the raw consent flag', async () => {
    const { app, saved } = setup()
    const res = await request(app).post('/api/alumni').send(alumnus)

    expect(res.status).toBe(201)
    expect(res.body).toEqual({ received: true })
    expect(saved.alumni).toEqual([
      {
        name: 'Ada Okafor',
        graduationYear: 2019,
        email: 'Ada@Example.com',
        interests: ['mentoring'],
        consentAt: NOW,
      },
    ])
  })

  it('requires consent', async () => {
    const { app, saved } = setup()
    for (const consent of [undefined, false, 'yes']) {
      const res = await request(app)
        .post('/api/alumni')
        .send({ ...alumnus, consent })
      expect(res.status, String(consent)).toBe(400)
      expect(JSON.stringify(res.body.error.details)).toMatch(/consent/)
    }
    expect(saved.alumni).toEqual([])
  })

  it('rejects a future graduation year, a bad email, a bad phone and unknown interests', async () => {
    const { app } = setup()
    const cases = [
      { ...alumnus, graduationYear: 2028 },
      { ...alumnus, graduationYear: 1950 },
      { ...alumnus, email: 'ada' },
      { ...alumnus, phone: 'call me' },
      { ...alumnus, interests: ['dating'] },
    ]
    for (const body of cases)
      expect((await request(app).post('/api/alumni').send(body)).status).toBe(400)
    // Next year's graduates may sign up early.
    expect(
      (
        await request(app)
          .post('/api/alumni')
          .send({ ...alumnus, graduationYear: 2027 })
      ).status,
    ).toBe(201)
  })

  it('accepts an optional phone number and drops honeypot submissions', async () => {
    const { app, saved } = setup()
    await request(app)
      .post('/api/alumni')
      .send({ ...alumnus, phone: '+234 801 234 5678' })
    await request(app)
      .post('/api/alumni')
      .send({ ...alumnus, website: 'spam' })

    expect(saved.alumni).toHaveLength(1)
    expect(saved.alumni[0]?.phone).toBe('+234 801 234 5678')
  })
})

describe('submissions stay private', () => {
  it('has no public route that reads them back', async () => {
    const { app } = setup()
    await request(app).post('/api/feedback').send(feedback)
    for (const path of ['/api/feedback', '/api/alumni']) {
      expect((await request(app).get(path)).status, path).toBe(404)
    }
    const paths = buildOpenApiDocument().paths ?? {}
    expect(Object.keys(paths['/api/feedback'] ?? {})).toEqual(['post'])
    expect(Object.keys(paths['/api/alumni'] ?? {})).toEqual(['post'])
  })
})
