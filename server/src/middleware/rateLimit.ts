import { rateLimit } from 'express-rate-limit'
import { HttpError } from '../lib/httpError.js'

type Options = {
  /** Time window in milliseconds. */
  windowMs: number
  /** Maximum requests per IP within the window. */
  limit: number
}

/**
 * Per-IP rate limiter. Over the limit it responds 429 with code RATE_LIMITED (via the error handler)
 * and RateLimit / Retry-After headers.
 *
 * @example router.post('/login', createRateLimiter({ windowMs: 15 * 60_000, limit: 10 }), ...)
 */
export function createRateLimiter({ windowMs, limit }: Options) {
  return rateLimit({
    windowMs,
    limit,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    handler: (_req, _res, next) => {
      next(HttpError.tooManyRequests())
    },
  })
}
