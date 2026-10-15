import { Router } from 'express'
import { dbStatus } from '../../../config/db.js'
import type { HealthResponse } from './health.openapi.js'

/** GET /api/health: used by hosting and uptime checks. Documented in health.openapi.ts. */
export function healthRouter(): Router {
  const router = Router()

  router.get('/', (_req, res) => {
    const db = dbStatus()
    const body: HealthResponse = {
      status: db === 'connected' ? 'ok' : 'degraded',
      db,
      uptimeSeconds: Math.round(process.uptime()),
    }
    res.json(body)
  })

  return router
}
