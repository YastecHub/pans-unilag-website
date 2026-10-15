import { Router } from 'express'
import { PUBLIC_CACHE_CONTROL } from '../../../lib/publicView.js'
import { validate } from '../../../middleware/validate.js'
import {
  compareResources,
  type Level,
  type ResourceReader,
  type Semester,
  toResourceView,
} from '../application/resourceView.js'
import { resourceQuerySchema } from './resources.openapi.js'

/** GET /api/resources?level=&semester=. Documented in resources.openapi.ts. */
export function resourcesRouter(resources: ResourceReader): Router {
  const router = Router()

  router.get('/', validate({ query: resourceQuerySchema }), async (req, res) => {
    const { level, semester } = req.query as { level?: Level; semester?: Semester }
    const stored = await resources.list({ level, semester })
    res.set('Cache-Control', PUBLIC_CACHE_CONTROL)
    res.json({ resources: stored.map(toResourceView).sort(compareResources) })
  })

  return router
}
