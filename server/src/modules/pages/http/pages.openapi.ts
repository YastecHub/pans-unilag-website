import { z } from 'zod'
import type { ZodOpenApiPathsObject } from 'zod-openapi'
import { errors } from '../../../docs/schemas.js'

export const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/

export const pageParamsSchema = z.strictObject({
  slug: z
    .string()
    .max(80)
    .regex(SLUG_PATTERN, 'Use lower-case words joined by hyphens, e.g. "who-we-are"')
    .meta({ description: 'Page slug', example: 'who-we-are' }),
})

const sectionSchema = z.object({
  heading: z.string(),
  bodyMarkdown: z.string().meta({ description: 'Markdown; render it sanitised' }),
  articleRefs: z.array(z.string()).meta({
    description: 'Constitution references the reader can check, e.g. "Art. 19" or "Art. 4 S.B"',
  }),
})

export const pageResponseSchema = z
  .object({
    slug: z.string(),
    title: z.string(),
    order: z.number().int().meta({ description: 'Position in the About section navigation' }),
    sections: z.array(sectionSchema),
    isPlaceholder: z.boolean(),
    placeholderNote: z
      .string()
      .optional()
      .meta({ description: 'What is missing; only sent while isPlaceholder is true' }),
    updatedAt: z.iso.datetime().optional().meta({ description: 'Last edit' }),
  })
  .meta({
    id: 'Page',
    example: {
      slug: 'who-we-are',
      title: 'Who we are',
      order: 1,
      sections: [
        {
          heading: 'Our name',
          bodyMarkdown:
            'The **Pharmaceutical Association of Nigeria Students, University of Lagos**, abbreviated **PANS UNILAG**.',
          articleRefs: ['Art. 2 S.A'],
        },
      ],
      isPlaceholder: false,
      updatedAt: '2026-10-15T12:00:00.000Z',
    },
  })

export const pagesPaths: ZodOpenApiPathsObject = {
  '/api/pages/{slug}': {
    get: {
      tags: ['Pages'],
      operationId: 'getPage',
      summary: 'One constitution-derived page',
      description:
        'About-section pages (Who we are, Governance, Elections, …) with each section citing its constitution article. Cached for 5 minutes.',
      requestParams: { path: pageParamsSchema },
      responses: {
        '200': {
          description: 'The page',
          content: { 'application/json': { schema: pageResponseSchema } },
        },
        ...errors.badRequest,
        ...errors.notFound,
        ...errors.internal,
      },
    },
  },
}
