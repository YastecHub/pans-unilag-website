import { z } from 'zod'
import type { ZodOpenApiPathsObject } from 'zod-openapi'
import { errors, placeholderShape } from '../../../docs/schemas.js'

export const gradingScaleSchema = z
  .object({
    slug: z.string(),
    source: z.string(),
    grades: z
      .array(
        z.object({
          letter: z.string(),
          min: z.number().meta({ description: 'Lowest score for the grade (inclusive)' }),
          max: z.number().meta({ description: 'Highest score for the grade (inclusive)' }),
          point: z.number(),
        }),
      )
      .meta({ description: 'Best grade first' }),
    bands: z.array(z.object({ name: z.string(), min: z.number(), max: z.number() })).meta({
      description: 'CGPA results, inclusive; compare against the CGPA rounded to 2 decimals',
    }),
    passMark: z.number(),
    units: z.object({ min: z.number().int(), max: z.number().int() }),
    ...placeholderShape,
  })
  .meta({
    id: 'GradingScale',
    example: {
      slug: 'faculty-of-pharmacy-5-point',
      source: 'Faculty of Pharmacy student handbook, §3.5 (p. 22)',
      grades: [
        { letter: 'A', min: 70, max: 100, point: 5 },
        { letter: 'B', min: 60, max: 69, point: 4 },
        { letter: 'C', min: 50, max: 59, point: 3 },
        { letter: 'D', min: 45, max: 49, point: 2 },
        { letter: 'E', min: 40, max: 44, point: 1 },
        { letter: 'F', min: 0, max: 39, point: 0 },
      ],
      bands: [
        { name: 'Pass', min: 2.4, max: 5 },
        { name: 'Fail', min: 0, max: 2.39 },
      ],
      passMark: 2.4,
      units: { min: 1, max: 3 },
      isPlaceholder: false,
    },
  })

export const gradingPaths: ZodOpenApiPathsObject = {
  '/api/grading-scale': {
    get: {
      tags: ['Academics'],
      operationId: 'getGradingScale',
      summary: 'Active grading scale for the CGPA calculator',
      description: 'Grades, Pass/Fail bands, pass mark and unit limits. Cached for 5 minutes.',
      responses: {
        '200': {
          description: 'The active scale',
          content: { 'application/json': { schema: gradingScaleSchema } },
        },
        ...errors.notFound,
        ...errors.internal,
      },
    },
  },
}
