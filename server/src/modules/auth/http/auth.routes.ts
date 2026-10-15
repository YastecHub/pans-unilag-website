import { type CookieOptions, Router } from 'express'
import type { z } from 'zod'
import { HttpError } from '../../../lib/httpError.js'
import type { AuthGuard } from '../../../middleware/requireAdmin.js'
import { SESSION_COOKIE } from '../../../middleware/requireAdmin.js'
import { createRateLimiter } from '../../../middleware/rateLimit.js'
import { validate } from '../../../middleware/validate.js'
import type { AdminStore } from '../application/adminView.js'
import { signIn } from '../application/authService.js'
import { signSessionToken } from '../application/sessionTokens.js'
import { loginBodySchema } from './auth.openapi.js'

export type AuthRouterOptions = {
  store: AdminStore
  guard: AuthGuard
  secret: string
  isProduction: boolean
  now: () => Date
  sessionHours?: number
  loginRateLimit?: { windowMs: number; limit: number }
}

export const DEFAULT_SESSION_HOURS = 8
export const DEFAULT_LOGIN_RATE_LIMIT = { windowMs: 15 * 60_000, limit: 10 }

/** POST /api/auth/login, POST /api/auth/logout, GET /api/auth/me. Documented in auth.openapi.ts. */
export function authRouter({
  store,
  guard,
  secret,
  isProduction,
  now,
  sessionHours = DEFAULT_SESSION_HOURS,
  loginRateLimit = DEFAULT_LOGIN_RATE_LIMIT,
}: AuthRouterOptions): Router {
  const router = Router()
  // Lax: the cookie is not sent on cross-site POSTs, which (with JSON-only bodies) blocks CSRF.
  // The site must reach the API on its own domain (an /api rewrite on the static host) for this to work.
  const cookie: CookieOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    path: '/api',
  }
  router.use((_req, res, next) => {
    res.set('Cache-Control', 'no-store')
    next()
  })

  router.post(
    '/login',
    createRateLimiter(loginRateLimit),
    validate({ body: loginBodySchema }),
    async (req, res) => {
      const { email, password } = req.body as z.infer<typeof loginBodySchema>
      const admin = await signIn(store, email, password, now())
      if (!admin) throw HttpError.unauthorized('Email or password is incorrect')

      const { tokenVersion, ...view } = admin
      const token = await signSessionToken(
        { adminId: view.id, tokenVersion },
        secret,
        sessionHours,
        now(),
      )
      res.cookie(SESSION_COOKIE, token, { ...cookie, maxAge: sessionHours * 3600 * 1000 })
      res.json({ admin: view })
    },
  )

  router.post('/logout', (_req, res) => {
    res.clearCookie(SESSION_COOKIE, cookie)
    res.status(204).end()
  })

  router.get('/me', guard.requireAdmin, (req, res) => {
    res.json({ admin: req.admin })
  })

  return router
}
