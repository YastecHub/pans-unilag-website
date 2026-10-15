import { z } from 'zod'
import type { ZodOpenApiPathsObject } from 'zod-openapi'
import { errors, placeholderShape } from '../../../docs/schemas.js'

const announcementSchema = z
  .object({
    id: z.string(),
    title: z.string(),
    body: z.string().meta({ description: 'Markdown' }),
    publishAt: z.iso.datetime(),
    expiresAt: z.iso.datetime().nullable(),
    pinned: z.boolean(),
    link: z.string().meta({ description: 'Optional "Read more" https link; empty if none' }),
    ...placeholderShape,
  })
  .meta({ id: 'Announcement' })

export const announcementsResponseSchema = z
  .object({ announcements: z.array(announcementSchema) })
  .meta({ id: 'AnnouncementsResponse' })

export const announcementsPaths: ZodOpenApiPathsObject = {
  '/api/announcements': {
    get: {
      tags: ['Content'],
      operationId: 'listAnnouncements',
      summary: 'Active announcements',
      description:
        'Published (publishAt has passed) and not expired (before expiresAt). Pinned first, then newest. Cached for 5 minutes.',
      responses: {
        '200': {
          description: 'Active announcements (often empty)',
          content: { 'application/json': { schema: announcementsResponseSchema } },
        },
        ...errors.internal,
      },
    },
  },
}
