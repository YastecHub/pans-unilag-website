import { Router } from 'express'
import { PUBLIC_CACHE_CONTROL } from '../../../lib/publicView.js'
import { listForSession, sessionQuerySchema } from '../../../lib/sessions.js'
import { validate } from '../../../middleware/validate.js'
import type { SenatorReader } from '../application/senatorView.js'

/** GET /api/senate?session=. Documented in senate.openapi.ts. */
export function senateRouter(senate: SenatorReader): Router {
  const router = Router()

  router.get('/', validate({ query: sessionQuerySchema }), async (req, res) => {
    const { session } = req.query as { session?: string }
    const { items, ...list } = await listForSession(senate, session)
    res.set('Cache-Control', PUBLIC_CACHE_CONTROL)
    res.json({ ...list, senators: items })
  })

  return router
}
