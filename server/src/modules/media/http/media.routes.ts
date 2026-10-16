import { type RequestHandler, Router } from 'express'
import { v2 as cloudinary } from 'cloudinary'
import type { z } from 'zod'
import { HttpError } from '../../../lib/httpError.js'
import { validate } from '../../../middleware/validate.js'
import { type MediaConfig, signUpload } from '../application/mediaFolders.js'
import { signatureBodySchema } from './media.openapi.js'

/**
 * POST /api/admin/media/signature (mounted behind requireAdmin). Documented in media.openapi.ts.
 * Content photos can be uploaded by any signed-in admin; the brand folder (badge, lockups,
 * preview image) only by the "admin" role, so an editor can't replace the logo.
 */
export function mediaRouter(
  config: MediaConfig | undefined,
  now: () => Date,
  adminOnly: RequestHandler = (_req, _res, next) => next(),
): Router {
  const router = Router()
  const brandNeedsAdmin: RequestHandler = (req, res, next) => {
    const folder = (req.body as { folder?: unknown } | undefined)?.folder
    if (folder === 'brand') adminOnly(req, res, next)
    else next()
  }

  router.post(
    '/signature',
    validate({ body: signatureBodySchema }),
    brandNeedsAdmin,
    (req, res) => {
      if (!config)
        throw new HttpError(
          503,
          'SERVICE_UNAVAILABLE',
          'Image uploads are not set up on the server yet',
        )
      const body = req.body as z.infer<typeof signatureBodySchema>
      res.set('Cache-Control', 'no-store')
      res.json(
        signUpload(config, body, now(), (params, secret) =>
          cloudinary.utils.api_sign_request(params, secret),
        ),
      )
    },
  )

  return router
}
