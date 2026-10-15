import type { Model } from 'mongoose'
import { z } from 'zod'
import { AnnouncementModel } from '../../announcements/infrastructure/announcement.model.js'
import { DATE_PRECISIONS, EventModel } from '../../events/infrastructure/event.model.js'
import {
  OPPORTUNITY_TYPES,
  OpportunityModel,
} from '../../opportunities/infrastructure/opportunity.model.js'

/** A stored item as the dashboard sees it: every field, `id` instead of `_id`, timestamps included. */
export type AdminRecord = Record<string, unknown> & { id: string }

export type AdminPage = { items: AdminRecord[]; total: number; page: number; pageSize: number }

/** One collection the dashboard can manage. MongoDB in the app; an in-memory list in tests. */
export type AdminCollection = {
  list(page: number, pageSize: number): Promise<AdminPage>
  get(id: string): Promise<AdminRecord | null>
  /** Validates with the model (including its cross-field rules) before storing. */
  create(data: Record<string, unknown>): Promise<AdminRecord>
  /** `null` values remove a field. Returns null when the id is unknown. */
  update(id: string, changes: Record<string, unknown>): Promise<AdminRecord | null>
  remove(id: string): Promise<boolean>
}

/** ISO date-time with an offset ("2026-11-30T09:00:00+01:00"), stored as a Date. */
const dateTime = z.iso.datetime({ offset: true }).transform((value) => new Date(value))
/** A date-time, or null to clear it. */
const optionalDateTime = z.union([z.null(), dateTime]).optional()

const slug = z
  .string()
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'Use lower-case words joined by hyphens')
  .max(80)

const placeholderFields = {
  /** Leave out to mark the item as real content (saving clears the placeholder flag). */
  isPlaceholder: z.boolean().optional(),
  placeholderNote: z.string().trim().max(300).optional(),
}

const announcementFields = z.strictObject({
  title: z.string().trim().min(1).max(120),
  body: z.string().trim().min(1).max(1000),
  publishAt: dateTime.optional(),
  expiresAt: optionalDateTime,
  pinned: z.boolean().optional(),
  link: z.string().trim().max(500).optional(),
  ...placeholderFields,
})

const eventFields = z.strictObject({
  slug,
  title: z.string().trim().min(1).max(160),
  series: z.string().trim().max(120).optional(),
  dayNumber: z.union([z.null(), z.number().int().min(1).max(31)]).optional(),
  startsAt: optionalDateTime,
  endsAt: optionalDateTime,
  datePrecision: z.enum(DATE_PRECISIONS).optional(),
  venue: z.string().trim().max(200).optional(),
  description: z.string().trim().max(10_000).optional(),
  coverImage: z.string().trim().max(300).optional(),
  registrationUrl: z.string().trim().max(500).optional(),
  committee: z.string().trim().max(80).optional(),
  ...placeholderFields,
})

const opportunityFields = z.strictObject({
  slug,
  title: z.string().trim().min(1).max(160),
  type: z.enum(OPPORTUNITY_TYPES),
  organisation: z.string().trim().max(120).optional(),
  description: z.string().trim().max(10_000).optional(),
  eligibility: z.string().trim().max(500).optional(),
  deadline: optionalDateTime,
  applyUrl: z.string().trim().max(500).optional(),
  lastCheckedAt: optionalDateTime,
  ...placeholderFields,
})

export type AdminResource = {
  /** URL segment: /api/admin/<name>. */
  name: string
  /** For messages, e.g. "Announcement not found". */
  label: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  model: Model<any>
  create: z.ZodType<Record<string, unknown>>
  update: z.ZodType<Record<string, unknown>>
}

/** The content that changes most, managed from the dashboard. Add a resource here to expose it. */
export const ADMIN_RESOURCES = [
  {
    name: 'announcements',
    label: 'Announcement',
    model: AnnouncementModel,
    create: announcementFields,
    update: announcementFields.partial(),
  },
  {
    name: 'events',
    label: 'Event',
    model: EventModel,
    create: eventFields,
    update: eventFields.partial(),
  },
  {
    name: 'opportunities',
    label: 'Opportunity',
    model: OpportunityModel,
    create: opportunityFields,
    update: opportunityFields.partial(),
  },
] as const satisfies readonly AdminResource[]

export type AdminResourceName = (typeof ADMIN_RESOURCES)[number]['name']

/**
 * Saving from the dashboard means the content is real: unless the editor explicitly keeps the
 * item as a placeholder, the flag and its note are cleared.
 */
export function withPlaceholderRule(body: Record<string, unknown>): Record<string, unknown> {
  if (body.isPlaceholder === true) return body
  return { ...body, isPlaceholder: false, placeholderNote: '' }
}
