import { z } from 'zod'
import type { ZodOpenApiResponseObject, ZodOpenApiResponsesObject } from 'zod-openapi'
import { ERROR_CODES } from '../lib/httpError.js'

/** The shape of every error response (see middleware/errorHandler.ts). */
export const errorResponseSchema = z
  .object({
    error: z.object({
      code: z.enum(ERROR_CODES).meta({ description: 'Stable, machine-readable error code' }),
      message: z.string().meta({ description: 'Human-readable message, safe to show to users' }),
      details: z.unknown().optional().meta({
        description:
          'Extra information. For VALIDATION_ERROR: a list of { location, path, message }.',
      }),
      requestId: z.string().optional().meta({
        description: 'Same as the X-Request-Id response header; quote it when reporting a problem',
      }),
    }),
  })
  .meta({
    id: 'ErrorResponse',
    example: {
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid request',
        details: [{ location: 'body', path: 'email', message: 'Invalid email address' }],
        requestId: '2f1c6c1e-6a3b-4d8e-9a43-1c2b7a5d9e10',
      },
    },
  })

function errorResponse(description: string): ZodOpenApiResponseObject {
  return { description, content: { 'application/json': { schema: errorResponseSchema } } }
}

/** Reusable error responses for operations. Spread the ones a route can actually return. */
export const errors = {
  badRequest: {
    '400': errorResponse('Invalid request (VALIDATION_ERROR, INVALID_JSON, INVALID_ID)'),
  },
  unauthorized: { '401': errorResponse('Not signed in (UNAUTHORIZED)') },
  forbidden: { '403': errorResponse('Signed in but not allowed (FORBIDDEN)') },
  notFound: { '404': errorResponse('Not found (NOT_FOUND)') },
  conflict: { '409': errorResponse('Conflicts with an existing record (CONFLICT)') },
  rateLimited: { '429': errorResponse('Too many requests (RATE_LIMITED)') },
  internal: { '500': errorResponse('Unexpected error (INTERNAL_ERROR)') },
} satisfies Record<string, ZodOpenApiResponsesObject>
