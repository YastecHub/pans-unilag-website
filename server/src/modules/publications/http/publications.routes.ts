import { Router } from 'express'
import { PUBLIC_CACHE_CONTROL } from '../../../lib/publicView.js'
import { validate } from '../../../middleware/validate.js'
import {
  comparePublications,
  type PublicationReader,
  type PublicationSeries,
  toPublicationView,
} from '../application/publicationView.js'
import { publicationQuerySchema } from './publications.openapi.js'

/** GET /api/publications?series=. Documented in publications.openapi.ts. */
export function publicationsRouter(publications: PublicationReader): Router {
  const router = Router()

  router.get('/', validate({ query: publicationQuerySchema }), async (req, res) => {
    const { series } = req.query as { series?: PublicationSeries }
    const stored = await publications.list({ series })
    res.set('Cache-Control', PUBLIC_CACHE_CONTROL)
    res.json({ publications: stored.map(toPublicationView).sort(comparePublications) })
  })

  return router
}
