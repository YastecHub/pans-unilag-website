import { rateLimit } from 'express-rate-limit'

type Options = {
  /** Time window in milliseconds. */
  windowMs: number
  /** Maximum requests per IP within the window. */
  limit: number
}

/**
 * Per-IP rate limiter with a JSON error. Apply to sensitive routes, e.g.
 * router.post('/login', createRateLimiter({ windowMs: 15 * 60_000, limit: 10 }), ...)
 */
export function createRateLimiter({ windowMs, limit }: Options) {
  return rateLimit({
    windowMs,
    limit,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    handler: (_req, res) => {
      res.status(429).json({ error: { message: 'Too many requests. Please try again later.' } })
    },
  })
}
