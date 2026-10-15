import { Router } from 'express'
import { dbStatus } from '../../../config/db.js'

/** GET /api/health: used by hosting and uptime checks. */
export function healthRouter(): Router {
  const router = Router()

  router.get('/', (_req, res) => {
    const db = dbStatus()
    res.json({
      status: db === 'connected' ? 'ok' : 'degraded',
      db,
      uptimeSeconds: Math.round(process.uptime()),
    })
  })

  return router
}
