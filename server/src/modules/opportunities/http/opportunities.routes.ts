import { Router } from 'express'
import { HttpError } from '../../../lib/httpError.js'
import { PUBLIC_CACHE_CONTROL } from '../../../lib/publicView.js'
import { validate } from '../../../middleware/validate.js'
import {
  isOpen,
  type OpportunityReader,
  type OpportunityType,
  openOpportunities,
  toOpportunityView,
} from '../application/opportunityView.js'
import { opportunityParamsSchema, opportunityQuerySchema } from './opportunities.openapi.js'

/** GET /api/opportunities and GET /api/opportunities/:slug. Documented in opportunities.openapi.ts. */
export function opportunitiesRouter(opportunities: OpportunityReader, now: () => Date): Router {
  const router = Router()

  router.get('/', validate({ query: opportunityQuerySchema }), async (req, res) => {
    const { type } = req.query as { type?: OpportunityType }
    const stored = await opportunities.list({ type })
    res.set('Cache-Control', PUBLIC_CACHE_CONTROL)
    res.json({ opportunities: openOpportunities(stored, now(), type) })
  })

  router.get('/:slug', validate({ params: opportunityParamsSchema }), async (req, res) => {
    const opportunity = await opportunities.findBySlug(req.params.slug as string)
    // A closed listing is treated as gone, so old links never show an expired opportunity.
    if (!opportunity || !isOpen(opportunity, now()))
      throw HttpError.notFound('Opportunity not found')
    res.set('Cache-Control', PUBLIC_CACHE_CONTROL)
    res.json(toOpportunityView(opportunity))
  })

  return router
}
