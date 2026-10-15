import { Router } from 'express'
import { PUBLIC_CACHE_CONTROL } from '../../../lib/publicView.js'
import { type AnnouncementReader, activeAnnouncements } from '../application/announcementView.js'

/** GET /api/announcements. Documented in announcements.openapi.ts. */
export function announcementsRouter(announcements: AnnouncementReader, now: () => Date): Router {
  const router = Router()

  router.get('/', async (_req, res) => {
    const at = now()
    res.set('Cache-Control', PUBLIC_CACHE_CONTROL)
    res.json({ announcements: activeAnnouncements(await announcements.list(at), at) })
  })

  return router
}
