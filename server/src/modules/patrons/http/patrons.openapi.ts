import { z } from 'zod'
import type { ZodOpenApiPathsObject } from 'zod-openapi'
import { errors, placeholderShape } from '../../../docs/schemas.js'

const patronSchema = z
  .object({
    order: z.number().int(),
    name: z.string(),
    title: z.string().meta({ example: 'Dean, Faculty of Pharmacy' }),
    isDean: z.boolean(),
    ...placeholderShape,
  })
  .meta({ id: 'Patron' })

export const patronsResponseSchema = z.object({ patrons: z.array(patronSchema) }).meta({
  id: 'PatronsResponse',
  example: {
    patrons: [
      {
        order: 1,
        name: 'Name to be announced',
        title: 'Dean, Faculty of Pharmacy',
        isDean: true,
        isPlaceholder: true,
        placeholderNote: 'Name of the Dean of the Faculty of Pharmacy needed',
      },
    ],
  },
})

export const patronsPaths: ZodOpenApiPathsObject = {
  '/api/patrons': {
    get: {
      tags: ['Leadership'],
      operationId: 'listPatrons',
      summary: 'Patrons',
      description:
        'The Dean of the Faculty of Pharmacy first, then the other patrons. Cached for 5 minutes.',
      responses: {
        '200': {
          description: 'All patrons',
          content: { 'application/json': { schema: patronsResponseSchema } },
        },
        ...errors.internal,
      },
    },
  },
}
