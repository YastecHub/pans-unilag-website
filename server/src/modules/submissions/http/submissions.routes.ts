import { type RequestHandler, Router } from 'express'
import { createRateLimiter, type RateLimitStores } from '../../../middleware/rateLimit.js'
import { validate } from '../../../middleware/validate.js'
import { noNotifier, type SubmissionNotifier } from '../application/notifications.js'
import {
  type AlumniInput,
  alumniInputSchema,
  type FeedbackInput,
  feedbackInputSchema,
  isBot,
  type SubmissionStore,
  toNewAlumnus,
  toNewFeedback,
} from '../application/submissionRules.js'

export type FormRateLimit = { windowMs: number; limit: number }

/** Five submissions per form per hour from one IP: plenty for people, a wall for scripts. */
export const DEFAULT_FORM_RATE_LIMIT: FormRateLimit = { windowMs: 60 * 60_000, limit: 5 }

/** The same reply whether the entry was stored or dropped (honeypot), so bots learn nothing. */
const RECEIVED = { received: true } as const

/**
 * POST /api/feedback and POST /api/alumni. Documented in submissions.openapi.ts.
 * Nothing submitted is ever returned by a public endpoint; admins read it after sign-in, and the
 * PANS inbox gets an email about each new entry when email is set up (`notify`).
 */
export function submissionsRouter(
  store: SubmissionStore,
  now: () => Date,
  rateLimit: FormRateLimit = DEFAULT_FORM_RATE_LIMIT,
  rateLimitStores?: RateLimitStores,
  notify: SubmissionNotifier = noNotifier,
): Router {
  const router = Router()
  const noStore: RequestHandler = (_req, res, next) => {
    res.set('Cache-Control', 'no-store')
    next()
  }

  router.post(
    '/feedback',
    noStore,
    createRateLimiter({ ...rateLimit, store: rateLimitStores?.('feedback') }),
    validate({ body: feedbackInputSchema }),
    async (req, res) => {
      const input = req.body as FeedbackInput
      if (!isBot(input)) {
        const feedback = toNewFeedback(input)
        await store.saveFeedback(feedback)
        await notify.feedback(feedback)
      }
      res.status(201).json(RECEIVED)
    },
  )

  router.post(
    '/alumni',
    noStore,
    createRateLimiter({ ...rateLimit, store: rateLimitStores?.('alumni') }),
    // Built per request so the latest allowed graduation year follows the calendar.
    (req, res, next) => validate({ body: alumniInputSchema(now().getFullYear()) })(req, res, next),
    async (req, res) => {
      const input = req.body as AlumniInput
      if (!isBot(input)) {
        const alumnus = toNewAlumnus(input, now())
        await store.saveAlumnus(alumnus)
        await notify.alumnus(alumnus)
      }
      res.status(201).json(RECEIVED)
    },
  )

  return router
}
