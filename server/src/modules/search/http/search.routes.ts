import { Router } from 'express'
import type { z } from 'zod'
import { validate } from '../../../middleware/validate.js'
import { searchSite, type SearchSource } from '../application/search.js'
import { searchQuerySchema } from './search.openapi.js'

/** GET /api/search?q=. Documented in search.openapi.ts. */
export function searchRouter(sources: SearchSource[], now: () => Date): Router {
  const router = Router()

  router.get('/', validate({ query: searchQuerySchema }), async (req, res) => {
    const query = req.query as unknown as z.infer<typeof searchQuerySchema>
    res.set('Cache-Control', 'public, max-age=60')
    res.json(await searchSite(sources, query, now()))
  })

  return router
}
