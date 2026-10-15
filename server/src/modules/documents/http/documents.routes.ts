import { Router } from 'express'
import { PUBLIC_CACHE_CONTROL } from '../../../lib/publicView.js'
import { type DocumentReader, latestVersions } from '../application/documentView.js'

/** GET /api/documents. Documented in documents.openapi.ts. */
export function documentsRouter(documents: DocumentReader): Router {
  const router = Router()

  router.get('/', async (_req, res) => {
    res.set('Cache-Control', PUBLIC_CACHE_CONTROL)
    res.json({ documents: latestVersions(await documents.list()) })
  })

  return router
}
