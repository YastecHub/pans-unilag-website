import { Router } from 'express'
import { HttpError } from '../../../lib/httpError.js'
import { validate } from '../../../middleware/validate.js'
import type { PageReader } from '../application/pageView.js'
import { pageParamsSchema } from './pages.openapi.js'

/** GET /api/pages/:slug. Documented in pages.openapi.ts. */
export function pagesRouter(pages: PageReader): Router {
  const router = Router()

  router.get('/:slug', validate({ params: pageParamsSchema }), async (req, res) => {
    const page = await pages.findBySlug(req.params.slug as string)
    if (!page) throw HttpError.notFound('Page not found')
    // Pages change rarely (dashboard edits); browsers and the CDN may reuse them for 5 minutes.
    res.set('Cache-Control', 'public, max-age=300')
    res.json(page)
  })

  return router
}
