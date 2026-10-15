import { z } from 'zod'
import type { ZodOpenApiPathsObject } from 'zod-openapi'
import { errors, placeholderShape } from '../../../docs/schemas.js'
import { LEVELS } from '../../../lib/validators.js'
import { SEMESTERS } from '../infrastructure/resource.model.js'

export const resourceQuerySchema = z.strictObject({
  level: z.enum(LEVELS).optional(),
  semester: z.enum(SEMESTERS).optional(),
})

const resourceSchema = z
  .object({
    id: z.string(),
    title: z.string(),
    level: z.enum(LEVELS),
    semester: z.enum(SEMESTERS),
    course: z.string().meta({ example: 'PCH 201' }),
    description: z.string(),
    url: z.string(),
    verifiedBy: z.string().meta({ description: 'Academics Committee member who checked it' }),
    ...placeholderShape,
  })
  .meta({ id: 'Resource' })

export const resourcesResponseSchema = z
  .object({ resources: z.array(resourceSchema) })
  .meta({ id: 'ResourcesResponse' })

export const resourcesPaths: ZodOpenApiPathsObject = {
  '/api/resources': {
    get: {
      tags: ['Content'],
      operationId: 'listResources',
      summary: 'Academic resources',
      description:
        'Vetted links from the Academics Committee, by level, semester and course. Cached for 5 minutes.',
      requestParams: { query: resourceQuerySchema },
      responses: {
        '200': {
          description: 'Resources (empty until the Academics Committee adds them)',
          content: { 'application/json': { schema: resourcesResponseSchema } },
        },
        ...errors.badRequest,
        ...errors.internal,
      },
    },
  },
}
