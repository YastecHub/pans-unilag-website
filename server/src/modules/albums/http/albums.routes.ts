import { Router } from 'express'
import { HttpError } from '../../../lib/httpError.js'
import { PUBLIC_CACHE_CONTROL } from '../../../lib/publicView.js'
import { validate } from '../../../middleware/validate.js'
import {
  type AlbumReader,
  compareAlbums,
  toAlbumSummaryView,
  toAlbumView,
} from '../application/albumView.js'
import { albumParamsSchema, albumQuerySchema } from './albums.openapi.js'

/** GET /api/albums and GET /api/albums/:slug. Documented in albums.openapi.ts. */
export function albumsRouter(albums: AlbumReader): Router {
  const router = Router()

  router.get('/', validate({ query: albumQuerySchema }), async (req, res) => {
    const { series } = req.query as { series?: string }
    const stored = await albums.list({ series })
    res.set('Cache-Control', PUBLIC_CACHE_CONTROL)
    res.json({ albums: stored.map(toAlbumSummaryView).sort(compareAlbums) })
  })

  router.get('/:slug', validate({ params: albumParamsSchema }), async (req, res) => {
    const album = await albums.findBySlug(req.params.slug as string)
    if (!album) throw HttpError.notFound('Album not found')
    res.set('Cache-Control', PUBLIC_CACHE_CONTROL)
    res.json(toAlbumView(album))
  })

  return router
}
