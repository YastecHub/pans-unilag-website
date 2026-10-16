import { z } from 'zod'
import type { ZodOpenApiPathsObject } from 'zod-openapi'
import { errors, placeholderShape } from '../../../docs/schemas.js'
import { slugParamsSchema } from '../../../lib/slug.js'
import { DATE_PRECISIONS } from '../infrastructure/event.model.js'

export const eventParamsSchema = slugParamsSchema('freshers-week-2026')

export const eventQuerySchema = z.strictObject({
  status: z
    .enum(['upcoming', 'past'])
    .optional()
    .meta({ description: 'Upcoming until the end of the Lagos day the event ends on' }),
  series: z.string().trim().min(1).max(120).optional().meta({
    description: 'Only the days of one series, in day order',
    example: 'PANS Health Week 2026: Redefine+',
  }),
  month: z
    .string()
    .regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'month must look like "2027-04"')
    .optional()
    .meta({ description: 'Events whose dates overlap this Lagos month', example: '2027-04' }),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(12),
})

export const eventSchema = z
  .object({
    slug: z.string(),
    title: z.string(),
    series: z.string().meta({ description: 'Empty for a one-off event' }),
    dayNumber: z.number().int().nullable(),
    startsAt: z.iso.datetime().nullable(),
    endsAt: z.iso.datetime().nullable(),
    datePrecision: z.enum(DATE_PRECISIONS).meta({
      description:
        'day: exact dates. month: show only the month(s), e.g. "April – May 2027". unknown: past event whose dates are not recorded (startsAt/endsAt are null)',
    }),
    status: z.enum(['upcoming', 'past']),
    venue: z.string(),
    description: z.string().meta({ description: 'Markdown' }),
    coverImage: z.string().meta({ description: 'Cloudinary public id; empty if none' }),
    coverImageAlt: z
      .string()
      .meta({ description: 'Alt text for the cover photo; set whenever coverImage is' }),
    registrationUrl: z.string().meta({ description: 'https link; empty until registration opens' }),
    committee: z.string().meta({ description: 'Slug of the organising committee, if any' }),
    ...placeholderShape,
  })
  .meta({
    id: 'Event',
    example: {
      slug: 'pharmalympics-2027',
      title: 'Pharmalympics 2027',
      series: 'Pharmalympics 2027',
      dayNumber: null,
      startsAt: '2027-03-31T23:00:00.000Z',
      endsAt: '2027-05-31T22:59:59.000Z',
      datePrecision: 'month',
      status: 'upcoming',
      venue: '',
      description: '',
      coverImage: '',
      coverImageAlt: '',
      registrationUrl: '',
      committee: '',
      isPlaceholder: true,
      placeholderNote: 'Exact dates, venue, registration link and description to be confirmed',
    },
  })

export const eventPageSchema = z
  .object({
    events: z.array(eventSchema),
    page: z.number().int(),
    pageSize: z.number().int(),
    total: z.number().int(),
    totalPages: z.number().int(),
  })
  .meta({ id: 'EventPage' })

export const eventsPaths: ZodOpenApiPathsObject = {
  '/api/events': {
    get: {
      tags: ['Events'],
      operationId: 'listEvents',
      summary: 'Events',
      description: [
        'Upcoming events soonest first, then past events most recent first (events with unknown dates last).',
        'With `series`, the days of that series in order. Cached for 5 minutes.',
      ].join(' '),
      requestParams: { query: eventQuerySchema },
      responses: {
        '200': {
          description: 'One page of events (an empty list is a normal result)',
          content: { 'application/json': { schema: eventPageSchema } },
        },
        ...errors.badRequest,
        ...errors.internal,
      },
    },
  },
  '/api/events/{slug}': {
    get: {
      tags: ['Events'],
      operationId: 'getEvent',
      summary: 'One event',
      requestParams: { path: eventParamsSchema },
      responses: {
        '200': {
          description: 'The event',
          content: { 'application/json': { schema: eventSchema } },
        },
        ...errors.badRequest,
        ...errors.notFound,
        ...errors.internal,
      },
    },
  },
}
