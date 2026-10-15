import { Router } from 'express'
import { PUBLIC_CACHE_CONTROL } from '../../../lib/publicView.js'
import type { PatronReader } from '../application/patronView.js'

/** GET /api/patrons. Documented in patrons.openapi.ts. */
export function patronsRouter(patrons: PatronReader): Router {
  const router = Router()

  router.get('/', async (_req, res) => {
    res.set('Cache-Control', PUBLIC_CACHE_CONTROL)
    res.json({ patrons: await patrons.list() })
  })

  return router
}
