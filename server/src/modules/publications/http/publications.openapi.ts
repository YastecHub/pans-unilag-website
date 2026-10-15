import { z } from 'zod'
import type { ZodOpenApiPathsObject } from 'zod-openapi'
import { errors, placeholderShape } from '../../../docs/schemas.js'
import { PUBLICATION_SERIES } from '../infrastructure/publication.model.js'

export const publicationQuerySchema = z.strictObject({
  series: z.enum(PUBLICATION_SERIES).optional(),
})

const publicationSchema = z
  .object({
    slug: z.string(),
    title: z.string(),
    series: z.enum(PUBLICATION_SERIES),
    edition: z.string(),
    publishedOn: z.iso.datetime().nullable(),
    summary: z.string(),
    cover: z.string().meta({ description: 'Cloudinary public id; empty if none' }),
    fileUrl: z.string().meta({ description: 'PDF to download; empty if the item is a link' }),
    link: z.string().meta({ description: 'External page, e.g. Substack; empty if a file' }),
    ...placeholderShape,
  })
  .meta({ id: 'Publication' })

export const publicationsResponseSchema = z
  .object({ publications: z.array(publicationSchema) })
  .meta({ id: 'PublicationsResponse' })

export const publicationsPaths: ZodOpenApiPathsObject = {
  '/api/publications': {
    get: {
      tags: ['Content'],
      operationId: 'listPublications',
      summary: 'Publications',
      description:
        'Recipharm, the newspaper and Substack posts. Newest first; undated placeholder editions last. Cached for 5 minutes.',
      requestParams: { query: publicationQuerySchema },
      responses: {
        '200': {
          description: 'Publications',
          content: { 'application/json': { schema: publicationsResponseSchema } },
        },
        ...errors.badRequest,
        ...errors.internal,
      },
    },
  },
}
