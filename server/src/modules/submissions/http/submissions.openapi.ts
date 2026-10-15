import { z } from 'zod'
import type { ZodOpenApiPathsObject } from 'zod-openapi'
import { errors } from '../../../docs/schemas.js'
import { alumniInputSchema, feedbackInputSchema } from '../application/submissionRules.js'

const receivedSchema = z
  .object({ received: z.literal(true) })
  .meta({ id: 'SubmissionReceived', example: { received: true } })

const created = {
  '201': {
    description:
      'Received. The reply is the same whether or not the entry was stored, and never echoes it back.',
    content: { 'application/json': { schema: receivedSchema } },
  },
}

const honeypotNote =
  'Leave `website` out or empty: it is a hidden spam trap, and filled-in submissions are silently dropped.'

export const submissionsPaths: ZodOpenApiPathsObject = {
  '/api/feedback': {
    post: {
      tags: ['Forms'],
      operationId: 'submitFeedback',
      summary: 'Send feedback to the Secretary General',
      description: [
        'Anonymous unless `contactEmail` is given. Read only by signed-in admins; deleted after 12 months.',
        'Rate-limited to 5 per hour per IP.',
        honeypotNote,
      ].join(' '),
      requestBody: {
        content: {
          'application/json': {
            schema: feedbackInputSchema.meta({
              id: 'FeedbackInput',
              example: {
                category: 'suggestion',
                message: 'Please share the Pharmathon results on the website.',
              },
            }),
          },
        },
      },
      responses: { ...created, ...errors.badRequest, ...errors.rateLimited, ...errors.internal },
    },
  },
  '/api/alumni': {
    post: {
      tags: ['Forms'],
      operationId: 'joinAlumniNetwork',
      summary: 'Join the alumni network',
      description: [
        '`consent` must be `true`. Read only by the Alumni Network Committee through the admin dashboard; kept until the person asks to be removed.',
        'Signing up again with the same email updates the details. Rate-limited to 5 per hour per IP.',
        honeypotNote,
      ].join(' '),
      requestBody: {
        content: {
          'application/json': {
            schema: alumniInputSchema(new Date().getFullYear()).meta({
              id: 'AlumniInput',
              example: {
                name: 'Ada Okafor',
                graduationYear: 2019,
                email: 'ada@example.com',
                interests: ['mentoring', 'speaking'],
                consent: true,
              },
            }),
          },
        },
      },
      responses: { ...created, ...errors.badRequest, ...errors.rateLimited, ...errors.internal },
    },
  },
}
