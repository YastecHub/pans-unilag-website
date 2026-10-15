import { z } from 'zod'
import type { ZodOpenApiPathsObject } from 'zod-openapi'
import { errors, placeholderShape, sessionListShape } from '../../../docs/schemas.js'
import { sessionQuerySchema } from '../../../lib/sessions.js'
import { slugParamsSchema } from '../../../lib/slug.js'

export const committeeParamsSchema = slugParamsSchema('admap')

export const committeeSchema = z
  .object({
    slug: z.string(),
    name: z.string(),
    shortName: z.string(),
    session: z.string(),
    order: z.number().int(),
    description: z.string().meta({ description: 'Markdown; empty while the write-up is missing' }),
    activities: z.array(z.string()),
    achievements: z.array(z.string()),
    plans: z.array(z.string()),
    motto: z.string(),
    officers: z.array(
      z.object({
        title: z.string().meta({ description: 'Lead, Assistant, Chairman, Secretary, LEO, LLO…' }),
        name: z.string(),
        level: z.string(),
      }),
    ),
    coverImage: z.string().meta({ description: 'Cloudinary public id; empty if none' }),
    ...placeholderShape,
  })
  .meta({
    id: 'Committee',
    example: {
      slug: 'media',
      name: 'Media Committee',
      shortName: 'Media',
      session: '2026/2027',
      order: 9,
      description: '',
      activities: [],
      achievements: [],
      plans: [],
      motto: '',
      officers: [],
      coverImage: '',
      isPlaceholder: true,
      placeholderNote: 'Write-up (description, activities, plans) needed from the committee',
    },
  })

export const committeesResponseSchema = z
  .object({ ...sessionListShape, committees: z.array(committeeSchema) })
  .meta({ id: 'CommitteesResponse' })

export const committeesPaths: ZodOpenApiPathsObject = {
  '/api/committees': {
    get: {
      tags: ['Leadership'],
      operationId: 'listCommittees',
      summary: 'Committees',
      description:
        'Committees appointed for the session, in display order. Without `session`, returns the newest session with data. Cached for 5 minutes.',
      requestParams: { query: sessionQuerySchema },
      responses: {
        '200': {
          description: 'The committees for the session (empty if the session has no data)',
          content: { 'application/json': { schema: committeesResponseSchema } },
        },
        ...errors.badRequest,
        ...errors.internal,
      },
    },
  },
  '/api/committees/{slug}': {
    get: {
      tags: ['Leadership'],
      operationId: 'getCommittee',
      summary: 'One committee',
      requestParams: { path: committeeParamsSchema },
      responses: {
        '200': {
          description: 'The committee',
          content: { 'application/json': { schema: committeeSchema } },
        },
        ...errors.badRequest,
        ...errors.notFound,
        ...errors.internal,
      },
    },
  },
}
