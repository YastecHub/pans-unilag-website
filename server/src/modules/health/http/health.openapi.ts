import { z } from 'zod'
import type { ZodOpenApiPathsObject } from 'zod-openapi'
import { DB_STATES } from '../../../config/db.js'
import { errors } from '../../../docs/schemas.js'

export const healthResponseSchema = z
  .object({
    status: z
      .enum(['ok', 'degraded'])
      .meta({ description: '"degraded" when the API is up but the database is not connected' }),
    db: z.enum([...DB_STATES, 'unknown']),
    uptimeSeconds: z.number().int().nonnegative(),
  })
  .meta({
    id: 'HealthResponse',
    example: { status: 'ok', db: 'connected', uptimeSeconds: 1234 },
  })

export type HealthResponse = z.infer<typeof healthResponseSchema>

export const healthPaths: ZodOpenApiPathsObject = {
  '/api/health': {
    get: {
      tags: ['Health'],
      operationId: 'getHealth',
      summary: 'Health check',
      description:
        'Used by the host and uptime monitors. Always 200 while the API process is running.',
      responses: {
        '200': {
          description: 'The API is running',
          content: { 'application/json': { schema: healthResponseSchema } },
        },
        ...errors.internal,
      },
    },
  },
}
