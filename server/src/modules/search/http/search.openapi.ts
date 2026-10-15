import { z } from 'zod'
import type { ZodOpenApiPathsObject } from 'zod-openapi'
import { errors } from '../../../docs/schemas.js'
import { SEARCH_QUERY_MAX, SEARCH_QUERY_MIN, SEARCH_TYPES } from '../application/search.js'

export const searchQuerySchema = z.strictObject({
  q: z
    .string()
    .trim()
    .min(SEARCH_QUERY_MIN, `Type at least ${SEARCH_QUERY_MIN} characters`)
    .max(SEARCH_QUERY_MAX)
    .meta({ description: 'What to search for (whole words)', example: 'pharmacovigilance' }),
  type: z.enum(SEARCH_TYPES).optional().meta({ description: 'Only one kind of result' }),
  limit: z.coerce.number().int().min(1).max(50).default(20),
})

const hitSchema = z.object({
  type: z.enum(SEARCH_TYPES),
  title: z.string(),
  summary: z.string().meta({ description: 'Plain text, one line' }),
  url: z
    .string()
    .meta({ description: 'Path on the site', example: '/leadership/committees/admap' }),
  externalUrl: z.string().optional().meta({ description: 'Resources only: the outside link' }),
  score: z.number(),
})

export const searchResponseSchema = z
  .object({ query: z.string(), results: z.array(hitSchema) })
  .meta({
    id: 'SearchResults',
    example: {
      query: 'drug abuse',
      results: [
        {
          type: 'committee',
          title: 'Anti-Drug Misuse and Abuse Program (ADMAP)',
          summary:
            'The Anti-Drug Misuse and Abuse Program (ADMAP) Committee is dedicated to advocating…',
          url: '/leadership/committees/admap',
          score: 12.5,
        },
      ],
    },
  })

export const searchPaths: ZodOpenApiPathsObject = {
  '/api/search': {
    get: {
      tags: ['Search'],
      operationId: 'search',
      summary: 'Search the site',
      description:
        'Events, open opportunities, publications, resources and committees, best match first. Placeholders are never returned. Cached for 1 minute.',
      requestParams: { query: searchQuerySchema },
      responses: {
        '200': {
          description: 'Results (an empty list when nothing matches)',
          content: { 'application/json': { schema: searchResponseSchema } },
        },
        ...errors.badRequest,
        ...errors.internal,
      },
    },
  },
}
