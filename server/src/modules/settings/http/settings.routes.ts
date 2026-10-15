import { Router } from 'express'
import { HttpError } from '../../../lib/httpError.js'
import { PUBLIC_CACHE_CONTROL } from '../../../lib/publicView.js'
import { type SettingsReader, toSettingsView } from '../application/settingsView.js'

/** GET /api/settings. Documented in settings.openapi.ts. */
export function settingsRouter(settings: SettingsReader): Router {
  const router = Router()

  router.get('/', async (_req, res) => {
    const stored = await settings.find()
    if (!stored) throw HttpError.notFound('Site settings have not been set up yet')
    res.set('Cache-Control', PUBLIC_CACHE_CONTROL)
    res.json(toSettingsView(stored))
  })

  return router
}
