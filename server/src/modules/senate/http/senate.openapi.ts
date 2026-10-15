import { z } from 'zod'
import type { ZodOpenApiPathsObject } from 'zod-openapi'
import { errors, placeholderShape, sessionListShape } from '../../../docs/schemas.js'
import { sessionQuerySchema } from '../../../lib/sessions.js'
import { SENATE_POSITIONS } from '../infrastructure/senator.model.js'

const senatorSchema = z
  .object({
    session: z.string(),
    position: z.enum(SENATE_POSITIONS),
    order: z.number().int(),
    name: z.string().meta({ description: '"Election pending" until the Senate election' }),
    level: z.string(),
    ...placeholderShape,
  })
  .meta({ id: 'Senator' })

export const senateResponseSchema = z
  .object({ ...sessionListShape, senators: z.array(senatorSchema) })
  .meta({
    id: 'SenateResponse',
    example: {
      session: '2026/2027',
      sessions: ['2026/2027'],
      senators: [
        {
          session: '2026/2027',
          position: 'Senate President',
          order: 1,
          name: 'Election pending',
          level: '',
          isPlaceholder: true,
          placeholderNote: 'The 2026/27 Senate election has not been held yet',
        },
      ],
    },
  })

export const senatePaths: ZodOpenApiPathsObject = {
  '/api/senate': {
    get: {
      tags: ['Leadership'],
      operationId: 'listSenate',
      summary: 'Senate principal officers',
      description:
        'Senate President, Deputy Senate President, Senate Leader and Chief Whip (Art. 18). Without `session`, returns the newest session with data. Cached for 5 minutes.',
      requestParams: { query: sessionQuerySchema },
      responses: {
        '200': {
          description: 'The principal officers for the session (empty if the session has no data)',
          content: { 'application/json': { schema: senateResponseSchema } },
        },
        ...errors.badRequest,
        ...errors.internal,
      },
    },
  },
}
