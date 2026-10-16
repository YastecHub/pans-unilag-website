import { rateLimit, type Store } from 'express-rate-limit'
import { HttpError } from '../lib/httpError.js'

type Options = {
  /** Time window in milliseconds. */
  windowMs: number
  /** Maximum requests per IP within the window. */
  limit: number
  /** Where the counts live. Defaults to this process's memory (one server, tests). */
  store?: Store
}

/** Makes the shared store for one named limiter (production: MongoDB, see appFromEnv.ts). */
export type RateLimitStores = (name: string) => Store

/**
 * Per-IP rate limiter. Over the limit it responds 429 with code RATE_LIMITED (via the error handler)
 * and RateLimit / Retry-After headers.
 *
 * @example router.post('/login', createRateLimiter({ windowMs: 15 * 60_000, limit: 10 }), ...)
 */
export function createRateLimiter({ windowMs, limit, store }: Options) {
  return rateLimit({
    windowMs,
    limit,
    ...(store && {
      store,
      // If the database is briefly unreachable, let people through rather than lock everyone out.
      passOnStoreError: true,
    }),
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    handler: (_req, _res, next) => {
      next(HttpError.tooManyRequests())
    },
  })
}
