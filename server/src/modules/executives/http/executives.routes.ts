import { Router } from 'express'
import { PUBLIC_CACHE_CONTROL } from '../../../lib/publicView.js'
import { listForSession, sessionQuerySchema } from '../../../lib/sessions.js'
import { validate } from '../../../middleware/validate.js'
import type { ExecutiveReader } from '../application/executiveView.js'

/** GET /api/executives?session=. Documented in executives.openapi.ts. */
export function executivesRouter(executives: ExecutiveReader): Router {
  const router = Router()

  router.get('/', validate({ query: sessionQuerySchema }), async (req, res) => {
    const { session } = req.query as { session?: string }
    const { items, ...list } = await listForSession(executives, session)
    res.set('Cache-Control', PUBLIC_CACHE_CONTROL)
    res.json({ ...list, executives: items })
  })

  return router
}
