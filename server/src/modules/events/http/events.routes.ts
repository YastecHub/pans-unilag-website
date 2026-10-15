import { Router } from 'express'
import type { z } from 'zod'
import { HttpError } from '../../../lib/httpError.js'
import { PUBLIC_CACHE_CONTROL } from '../../../lib/publicView.js'
import { validate } from '../../../middleware/validate.js'
import { type EventReader, toEventView } from '../application/eventView.js'
import { listEvents } from '../application/listEvents.js'
import { eventParamsSchema, eventQuerySchema } from './events.openapi.js'

/**
 * GET /api/events and GET /api/events/:slug. Documented in events.openapi.ts.
 * `now` is injectable so tests can check the upcoming/past rule at a fixed time.
 */
export function eventsRouter(events: EventReader, now: () => Date): Router {
  const router = Router()

  router.get('/', validate({ query: eventQuerySchema }), async (req, res) => {
    const query = req.query as unknown as z.infer<typeof eventQuerySchema>
    const stored = await events.list({ series: query.series })
    res.set('Cache-Control', PUBLIC_CACHE_CONTROL)
    res.json(listEvents(stored, query, now()))
  })

  router.get('/:slug', validate({ params: eventParamsSchema }), async (req, res) => {
    const event = await events.findBySlug(req.params.slug as string)
    if (!event) throw HttpError.notFound('Event not found')
    res.set('Cache-Control', PUBLIC_CACHE_CONTROL)
    res.json(toEventView(event, now()))
  })

  return router
}
