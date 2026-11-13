import request from 'supertest'
import { describe, expect, it } from 'vitest'
import { createApp } from '../src/app.js'
import { appFromEnv } from '../src/config/appFromEnv.js'
import { loadEnv } from '../src/config/env.js'
import { type Logger, silentLogger } from '../src/lib/logger.js'
import {
  alumnusEmail,
  emailNotifier,
  feedbackEmail,
  type SubmissionEmail,
} from '../src/modules/submissions/application/notifications.js'
import type { SubmissionStore } from '../src/modules/submissions/application/submissionRules.js'
import { ALLOWED_ORIGIN } from './helpers.js'
import { seedReaders } from './seedReaders.js'

const SITE = 'https://pans.example'
const CONSENT = new Date('2026-11-13T09:00:00Z')
const alumnus = {
  name: 'Ada\nOkafor',
  graduationYear: 2019,
  email: 'ada@example.com',
  interests: ['mentoring', 'internships-and-jobs'] as const,
  consentAt: CONSENT,
}

describe('submission emails', () => {
  it('describe feedback, anonymous or not, with a link to the dashboard', () => {
    const named = feedbackEmail(
      { category: 'welfare', message: 'The water dispenser is broken.', contactEmail: 'me@x.com' },
      SITE,
    )
    expect(named.subject).toBe('New feedback on the PANS website: Welfare concern')
    expect(named.replyTo).toBe('me@x.com')
    expect(named.text).toContain('The water dispenser is broken.')
    expect(named.text).toContain(`${SITE}/admin/feedback`)

    const anonymous = feedbackEmail({ category: 'other', message: 'Thanks for the site!' }, SITE)
    expect(anonymous.replyTo).toBeUndefined()
    expect(anonymous.text).toContain('Anonymous')
  })

  it('describe an alumni sign-up on one subject line, replying to the alumnus', () => {
    const email = alumnusEmail({ ...alumnus, interests: [...alumnus.interests] }, SITE)
    expect(email.subject).toBe('New alumni sign-up: Ada Okafor (graduated 2019)')
    expect(email.replyTo).toBe('ada@example.com')
    expect(email.text).toContain('Mentoring students, Internships and jobs')
    expect(email.text).toContain('Phone: Not given')
    expect(email.text).toContain(`${SITE}/admin/alumni`)
  })

  it('never fail the form when sending fails, and log without personal details', async () => {
    const warnings: unknown[][] = []
    const logger: Logger = {
      info: () => {},
      error: () => {},
      warn: (...args) => void warnings.push(args),
    }
    const notifier = emailNotifier(
      async () => {
        throw new Error('Invalid login')
      },
      `${SITE}/`,
      logger,
    )
    await expect(
      notifier.alumnus({ ...alumnus, interests: [...alumnus.interests] }),
    ).resolves.toBeUndefined()
    expect(JSON.stringify(warnings)).toContain('Invalid login')
    expect(JSON.stringify(warnings)).not.toContain('ada@example.com')
  })
})

describe('forms email the PANS inbox', () => {
  function setup() {
    const sent: SubmissionEmail[] = []
    const store: SubmissionStore = { saveFeedback: async () => {}, saveAlumnus: async () => {} }
    const app = createApp({
      clientOrigins: [ALLOWED_ORIGIN],
      isProduction: false,
      readers: seedReaders(),
      now: () => CONSENT,
      submissions: store,
      formRateLimit: { windowMs: 60_000, limit: 100 },
      notifier: emailNotifier(async (email) => void sent.push(email), SITE, {
        info: () => {},
        warn: () => {},
        error: () => {},
      }),
    })
    return { app, sent }
  }

  it('after each saved feedback message and alumni sign-up, but not for bots', async () => {
    const { app, sent } = setup()
    await request(app)
      .post('/api/feedback')
      .send({ category: 'suggestion', message: 'Please post the results online.' })
      .expect(201)
    await request(app)
      .post('/api/alumni')
      .send({ name: 'Ada Okafor', graduationYear: 2019, email: 'ada@example.com', consent: true })
      .expect(201)
    await request(app)
      .post('/api/feedback')
      .send({ category: 'other', message: 'Buy cheap pills here now', website: 'spam' })
      .expect(201)

    expect(sent.map((e) => e.subject)).toEqual([
      'New feedback on the PANS website: Suggestion',
      'New alumni sign-up: Ada Okafor (graduated 2019)',
    ])
  })
})

describe('email settings', () => {
  const base = { MONGODB_URI: 'mongodb://localhost/pans' }

  it('are optional, accept an app password typed with spaces and default to no recipients', () => {
    expect(loadEnv(base)).toMatchObject({ NOTIFY_EMAIL: [] })
    const env = loadEnv({
      ...base,
      GMAIL_USER: 'pansunilag@gmail.com',
      GMAIL_APP_PASSWORD: 'abcd efgh ijkl mnop',
      NOTIFY_EMAIL: 'a@example.com, b@example.com',
    })
    expect(env.GMAIL_APP_PASSWORD).toBe('abcdefghijklmnop')
    expect(env.NOTIFY_EMAIL).toEqual(['a@example.com', 'b@example.com'])
  })

  it('reject a normal password, a bad sender and bad recipients', () => {
    expect(() => loadEnv({ ...base, GMAIL_APP_PASSWORD: 'my-password' })).toThrow(/app password/)
    expect(() => loadEnv({ ...base, GMAIL_USER: 'pans' })).toThrow(/GMAIL_USER/)
    expect(() => loadEnv({ ...base, NOTIFY_EMAIL: 'pans, x@y.com' })).toThrow(/NOTIFY_EMAIL/)
  })

  it('need both the Gmail account and its app password before the API starts', () => {
    const secret = { ...base, JWT_SECRET: 'x'.repeat(40) }
    expect(() =>
      appFromEnv(loadEnv({ ...secret, GMAIL_USER: 'pansunilag@gmail.com' }), silentLogger),
    ).toThrow(/set both/)
    expect(() =>
      appFromEnv(
        loadEnv({
          ...secret,
          GMAIL_USER: 'pansunilag@gmail.com',
          GMAIL_APP_PASSWORD: 'abcdefghijklmnop',
        }),
        silentLogger,
      ),
    ).not.toThrow()
  })
})
