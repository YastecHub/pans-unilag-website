import { Router } from 'express'
import { HttpError } from '../../../lib/httpError.js'
import { PUBLIC_CACHE_CONTROL } from '../../../lib/publicView.js'
import { listForSession, sessionQuerySchema } from '../../../lib/sessions.js'
import { validate } from '../../../middleware/validate.js'
import type { CommitteeReader } from '../application/committeeView.js'
import { committeeParamsSchema } from './committees.openapi.js'

/** GET /api/committees?session= and GET /api/committees/:slug. Documented in committees.openapi.ts. */
export function committeesRouter(committees: CommitteeReader): Router {
  const router = Router()

  router.get('/', validate({ query: sessionQuerySchema }), async (req, res) => {
    const { session } = req.query as { session?: string }
    const { items, ...list } = await listForSession(committees, session)
    res.set('Cache-Control', PUBLIC_CACHE_CONTROL)
    res.json({ ...list, committees: items })
  })

  router.get('/:slug', validate({ params: committeeParamsSchema }), async (req, res) => {
    const committee = await committees.findBySlug(req.params.slug as string)
    if (!committee) throw HttpError.notFound('Committee not found')
    res.set('Cache-Control', PUBLIC_CACHE_CONTROL)
    res.json(committee)
  })

  return router
}
