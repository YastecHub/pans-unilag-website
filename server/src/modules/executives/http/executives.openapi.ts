import { z } from 'zod'
import type { ZodOpenApiPathsObject } from 'zod-openapi'
import { errors, placeholderShape, sessionListShape } from '../../../docs/schemas.js'
import { sessionQuerySchema } from '../../../lib/sessions.js'
import { EXECUTIVE_OFFICES } from '../infrastructure/executive.model.js'

const executiveSchema = z
  .object({
    session: z.string(),
    office: z.enum(EXECUTIVE_OFFICES),
    order: z.number().int().meta({ description: 'Constitutional order (Art. 6), 1 = President' }),
    name: z.string().meta({ description: '"Name to be announced" while a placeholder' }),
    level: z.string().meta({ description: 'e.g. "400L"; empty if not given' }),
    bio: z.string().meta({ description: 'Up to 300 words; empty until supplied' }),
    photo: z.string().meta({ description: 'Cloudinary public id; empty until the official photo' }),
    roleEmail: z.string().meta({ description: 'Official role email; empty if none' }),
    ...placeholderShape,
  })
  .meta({ id: 'Executive' })

export const executivesResponseSchema = z
  .object({ ...sessionListShape, executives: z.array(executiveSchema) })
  .meta({
    id: 'ExecutivesResponse',
    example: {
      session: '2026/2027',
      sessions: ['2026/2027'],
      executives: [
        {
          session: '2026/2027',
          office: 'Vice President',
          order: 2,
          name: 'Name to be announced',
          level: '',
          bio: '',
          photo: '',
          roleEmail: '',
          isPlaceholder: true,
          placeholderNote: "Name and bio to come in the President's Exco document",
        },
      ],
    },
  })

export const executivesPaths: ZodOpenApiPathsObject = {
  '/api/executives': {
    get: {
      tags: ['Leadership'],
      operationId: 'listExecutives',
      summary: 'Executive Council',
      description:
        'The 14 offices in constitutional order. Without `session`, returns the newest session with data. Cached for 5 minutes.',
      requestParams: { query: sessionQuerySchema },
      responses: {
        '200': {
          description: 'The Executive Council for the session (empty if the session has no data)',
          content: { 'application/json': { schema: executivesResponseSchema } },
        },
        ...errors.badRequest,
        ...errors.internal,
      },
    },
  },
}
