import { z } from 'zod'
import type { ZodOpenApiPathsObject } from 'zod-openapi'
import { errors, placeholderShape } from '../../../docs/schemas.js'
import { slugParamsSchema } from '../../../lib/slug.js'

export const albumParamsSchema = slugParamsSchema('health-week-2026-day-3')

export const albumQuerySchema = z.strictObject({
  series: z
    .string()
    .trim()
    .min(1)
    .max(120)
    .optional()
    .meta({ description: 'Only the albums of one series', example: 'Pharmalympics 2026' }),
})

const summaryShape = {
  slug: z.string(),
  title: z.string(),
  event: z.string().meta({ description: 'Slug of the event (GET /api/events/{slug})' }),
  series: z.string(),
  cover: z.string().meta({ description: 'Cloudinary public id; empty until photos are uploaded' }),
  photoCount: z.number().int(),
  ...placeholderShape,
}

export const albumSummarySchema = z.object(summaryShape).meta({ id: 'AlbumSummary' })

export const albumSchema = z
  .object({
    ...summaryShape,
    photos: z.array(
      z.object({
        publicId: z.string().meta({ description: 'Cloudinary public id' }),
        alt: z.string().meta({ description: 'Always present: use as the image alt text' }),
        caption: z.string(),
      }),
    ),
    sourceFolderUrl: z.string().meta({ description: 'Link to the full folder; empty if none' }),
  })
  .meta({ id: 'Album' })

export const albumsResponseSchema = z
  .object({ albums: z.array(albumSummarySchema) })
  .meta({ id: 'AlbumsResponse' })

export const albumsPaths: ZodOpenApiPathsObject = {
  '/api/albums': {
    get: {
      tags: ['Events'],
      operationId: 'listAlbums',
      summary: 'Gallery albums',
      description:
        'One album per event day, by series and day. Placeholder albums (photos not uploaded yet) are included with their note. Cached for 5 minutes.',
      requestParams: { query: albumQuerySchema },
      responses: {
        '200': {
          description: 'Album cards (without the photo lists)',
          content: { 'application/json': { schema: albumsResponseSchema } },
        },
        ...errors.badRequest,
        ...errors.internal,
      },
    },
  },
  '/api/albums/{slug}': {
    get: {
      tags: ['Events'],
      operationId: 'getAlbum',
      summary: 'One album with its photos',
      requestParams: { path: albumParamsSchema },
      responses: {
        '200': {
          description: 'The album',
          content: { 'application/json': { schema: albumSchema } },
        },
        ...errors.badRequest,
        ...errors.notFound,
        ...errors.internal,
      },
    },
  },
}
