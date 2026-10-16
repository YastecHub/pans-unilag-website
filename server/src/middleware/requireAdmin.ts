import type { RequestHandler } from 'express'
import { HttpError } from '../lib/httpError.js'
import { type AdminRole, type AdminStore, hasRole } from '../modules/auth/application/adminView.js'
import { adminForSession } from '../modules/auth/application/authService.js'

export const SESSION_COOKIE = 'pans_admin_session'

export type AuthGuard = {
  /** 401 unless the request carries a valid session for an existing admin. Sets req.admin. */
  requireAdmin: RequestHandler
  /** Use after requireAdmin: 403 unless the admin's role is at least `role` (developer > admin > editor). */
  requireRole: (role: AdminRole) => RequestHandler
}

export function createAuthGuard(store: AdminStore, secret: string, now: () => Date): AuthGuard {
  return {
    requireAdmin: async (req, res, next) => {
      const token = req.cookies?.[SESSION_COOKIE] as string | undefined
      const admin = await adminForSession(store, token, secret, now())
      if (!admin) {
        // A stale or tampered cookie is removed so the browser stops sending it.
        if (token) res.clearCookie(SESSION_COOKIE, { path: '/api' })
        throw HttpError.unauthorized()
      }
      req.admin = admin
      next()
    },
    requireRole: (role) => (req, _res, next) => {
      if (!req.admin || !hasRole(req.admin.role, role)) throw HttpError.forbidden()
      next()
    },
  }
}
