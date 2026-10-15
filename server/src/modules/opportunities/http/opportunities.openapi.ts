import { z } from 'zod'
import type { ZodOpenApiPathsObject } from 'zod-openapi'
import { errors, placeholderShape } from '../../../docs/schemas.js'
import { slugParamsSchema } from '../../../lib/slug.js'
import { OPPORTUNITY_TYPES } from '../infrastructure/opportunity.model.js'

export const opportunityParamsSchema = slugParamsSchema('bloomberg-workshop-2026')

export const opportunityQuerySchema = z.strictObject({
  type: z.enum(OPPORTUNITY_TYPES).optional(),
})

export const opportunitySchema = z
  .object({
    slug: z.string(),
    title: z.string(),
    type: z.enum(OPPORTUNITY_TYPES),
    organisation: z.string(),
    eligibility: z.string(),
    description: z.string().meta({ description: 'Markdown' }),
    deadline: z.iso
      .datetime()
      .nullable()
      .meta({ description: 'Last day to apply (inclusive, Lagos); null = rolling' }),
    applyUrl: z.string(),
    lastCheckedAt: z.iso.datetime().nullable(),
    ...placeholderShape,
  })
  .meta({ id: 'Opportunity' })

export const opportunitiesResponseSchema = z
  .object({ opportunities: z.array(opportunitySchema) })
  .meta({ id: 'OpportunitiesResponse' })

export const opportunitiesPaths: ZodOpenApiPathsObject = {
  '/api/opportunities': {
    get: {
      tags: ['Content'],
      operationId: 'listOpportunities',
      summary: 'Open opportunities',
      description:
        'Only open listings: an opportunity closes at the end of the Lagos day of its deadline. Closing soonest first, rolling ones last. Cached for 5 minutes.',
      requestParams: { query: opportunityQuerySchema },
      responses: {
        '200': {
          description: 'Open opportunities (empty until CPD & CBC add listings)',
          content: { 'application/json': { schema: opportunitiesResponseSchema } },
        },
        ...errors.badRequest,
        ...errors.internal,
      },
    },
  },
  '/api/opportunities/{slug}': {
    get: {
      tags: ['Content'],
      operationId: 'getOpportunity',
      summary: 'One open opportunity',
      description: 'A closed opportunity returns 404, the same as an unknown one.',
      requestParams: { path: opportunityParamsSchema },
      responses: {
        '200': {
          description: 'The opportunity',
          content: { 'application/json': { schema: opportunitySchema } },
        },
        ...errors.badRequest,
        ...errors.notFound,
        ...errors.internal,
      },
    },
  },
}
