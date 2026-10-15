import { type RequestHandler, Router } from 'express'
import { createRateLimiter } from '../../../middleware/rateLimit.js'
import { validate } from '../../../middleware/validate.js'
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
 * Nothing submitted is ever returned by a public endpoint; admins read it after sign-in.
 */
export function submissionsRouter(
  store: SubmissionStore,
  now: () => Date,
  rateLimit: FormRateLimit = DEFAULT_FORM_RATE_LIMIT,
): Router {
  const router = Router()
  const noStore: RequestHandler = (_req, res, next) => {
    res.set('Cache-Control', 'no-store')
    next()
  }

  router.post(
    '/feedback',
    noStore,
    createRateLimiter(rateLimit),
    validate({ body: feedbackInputSchema }),
    async (req, res) => {
      const input = req.body as FeedbackInput
      if (!isBot(input)) await store.saveFeedback(toNewFeedback(input))
      res.status(201).json(RECEIVED)
    },
  )

  router.post(
    '/alumni',
    noStore,
    createRateLimiter(rateLimit),
    // Built per request so the latest allowed graduation year follows the calendar.
    (req, res, next) => validate({ body: alumniInputSchema(now().getFullYear()) })(req, res, next),
    async (req, res) => {
      const input = req.body as AlumniInput
      if (!isBot(input)) await store.saveAlumnus(toNewAlumnus(input, now()))
      res.status(201).json(RECEIVED)
    },
  )

  return router
}
