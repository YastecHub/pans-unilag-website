import { Router } from 'express'
import { HttpError } from '../../../lib/httpError.js'
import { PUBLIC_CACHE_CONTROL } from '../../../lib/publicView.js'
import { type GradingScaleReader, toGradingScaleView } from '../application/gradingView.js'

/** GET /api/grading-scale. Documented in grading.openapi.ts. */
export function gradingRouter(scales: GradingScaleReader): Router {
  const router = Router()

  router.get('/', async (_req, res) => {
    const scale = await scales.findActive()
    if (!scale) throw HttpError.notFound('No active grading scale')
    res.set('Cache-Control', PUBLIC_CACHE_CONTROL)
    res.json(toGradingScaleView(scale))
  })

  return router
}
