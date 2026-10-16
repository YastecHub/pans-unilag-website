import type { Model } from 'mongoose'
import { z } from 'zod'
import { isBlockedLink } from '../../../lib/blockedLinks.js'
import { isSession } from '../../../lib/sessions.js'
import { LEVELS } from '../../../lib/validators.js'
import { AlbumModel } from '../../albums/infrastructure/album.model.js'
import { AnnouncementModel } from '../../announcements/infrastructure/announcement.model.js'
import { CommitteeModel } from '../../committees/infrastructure/committee.model.js'
import { DocumentModel } from '../../documents/infrastructure/document.model.js'
import { DATE_PRECISIONS, EventModel } from '../../events/infrastructure/event.model.js'
import {
  EXECUTIVE_OFFICES,
  ExecutiveModel,
} from '../../executives/infrastructure/executive.model.js'
import { GradingScaleModel } from '../../grading/infrastructure/gradingScale.model.js'
import {
  OPPORTUNITY_TYPES,
  OpportunityModel,
} from '../../opportunities/infrastructure/opportunity.model.js'
import { PageModel } from '../../pages/infrastructure/page.model.js'
import { PatronModel } from '../../patrons/infrastructure/patron.model.js'
import {
  PUBLICATION_SERIES,
  PublicationModel,
} from '../../publications/infrastructure/publication.model.js'
import { ResourceModel, SEMESTERS } from '../../resources/infrastructure/resource.model.js'
import { SENATE_POSITIONS, SenatorModel } from '../../senate/infrastructure/senator.model.js'
import { SOCIAL_PLATFORMS, SettingsModel } from '../../settings/infrastructure/settings.model.js'

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

/** Short text fields. The models hold the exact rules (https links, emails, ids); these bound sizes. */
const line = (max: number) => z.string().trim().max(max)
const required = (max: number) => z.string().trim().min(1).max(max)
const session = z.string().refine(isSession, 'session must look like "2026/2027"')
const level = z.enum([...LEVELS, ''])
/** A Cloudinary public id, or empty. */
const photo = line(300)
const link = line(500)
const count = z.union([z.null(), z.number().int().min(0)]).optional()

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
  coverImageAlt: z.string().trim().max(200).optional(),
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

/** Constitution-derived pages: fixed by the site's routes, so only their text is edited. */
const pageFields = z.strictObject({
  title: required(120),
  sections: z
    .array(
      z.strictObject({
        heading: required(120),
        bodyMarkdown: required(20_000),
        articleRefs: z.array(line(40)).max(20).optional(),
      }),
    )
    .min(1)
    .max(30),
  ...placeholderFields,
})

/**
 * The display order follows the constitution's list of offices, so it is set from the office
 * rather than typed in.
 */
function orderFrom<T extends readonly string[]>(key: string, list: T) {
  return (body: Record<string, unknown>) => {
    const value = body[key]
    return typeof value === 'string' ? { ...body, order: list.indexOf(value) + 1 } : body
  }
}

const executiveBase = z.strictObject({
  session,
  office: z.enum(EXECUTIVE_OFFICES),
  name: required(120),
  level: level.optional(),
  bio: line(800).optional(),
  photo: photo.optional(),
  roleEmail: line(160).optional(),
  ...placeholderFields,
})
const executiveOrder = orderFrom('office', EXECUTIVE_OFFICES)

const senatorBase = z.strictObject({
  session,
  position: z.enum(SENATE_POSITIONS),
  name: required(120),
  level: level.optional(),
  ...placeholderFields,
})
const senatorOrder = orderFrom('position', SENATE_POSITIONS)

const listItems = z.array(required(300)).max(30).optional()

const committeeFields = z.strictObject({
  slug,
  name: required(160),
  shortName: required(40),
  session,
  order: z.number().int().min(1).max(100),
  description: line(10_000).optional(),
  activities: listItems,
  achievements: listItems,
  plans: listItems,
  motto: line(160).optional(),
  officers: z
    .array(z.strictObject({ title: required(60), name: required(120), level: level.optional() }))
    .max(12)
    .optional(),
  coverImage: photo.optional(),
  ...placeholderFields,
})

const patronFields = z.strictObject({
  order: z.number().int().min(1).max(20),
  name: required(120),
  title: required(120),
  isDean: z.boolean().optional(),
  ...placeholderFields,
})

const albumFields = z.strictObject({
  slug,
  title: required(160),
  event: required(80),
  series: line(120).optional(),
  cover: photo.optional(),
  photos: z
    .array(
      z.strictObject({ publicId: required(300), alt: line(200), caption: line(300).optional() }),
    )
    .max(40)
    .optional(),
  sourceFolderUrl: link.optional(),
  consentConfirmed: z.boolean().optional(),
  ...placeholderFields,
})

const publicationFields = z.strictObject({
  slug,
  title: required(160),
  series: z.enum(PUBLICATION_SERIES),
  edition: line(60).optional(),
  publishedOn: optionalDateTime,
  summary: line(300).optional(),
  cover: photo.optional(),
  fileUrl: link.optional(),
  link: link.optional(),
  ...placeholderFields,
})

const documentFields = z.strictObject({
  slug,
  title: required(160),
  version: required(40),
  approvedOn: dateTime,
  approvedBy: line(160).optional(),
  summary: line(500).optional(),
  fileUrl: link.optional(),
  fileSizeBytes: count,
  pageCount: count,
  ...placeholderFields,
})

const resourceFields = z.strictObject({
  title: required(160),
  level: z.enum(LEVELS),
  semester: z.enum(SEMESTERS),
  course: line(20).optional(),
  description: line(300).optional(),
  url: link
    .refine((url) => !isBlockedLink(url), 'url is on a site known for pirated books')
    .optional(),
  verifiedBy: line(120).optional(),
  ...placeholderFields,
})

const range = { min: z.number().min(0).max(100), max: z.number().min(0).max(100) }
const gradingFields = z.strictObject({
  slug,
  active: z.boolean().optional(),
  source: required(300),
  grades: z
    .array(
      z.strictObject({
        letter: z.string().regex(/^[A-F]$/),
        ...range,
        point: z.number().min(0).max(5),
      }),
    )
    .min(1)
    .max(10),
  bands: z
    .array(z.strictObject({ name: required(60), ...range }))
    .min(1)
    .max(10),
  passMark: z.number().min(0).max(5),
  units: z.strictObject({ min: z.number().int().min(1), max: z.number().int().min(1) }),
  ...placeholderFields,
})

/** The one site-wide settings document: edited, never created or deleted from the dashboard. */
const settingsFields = z.strictObject({
  postalAddress: required(300),
  location: line(300).optional(),
  contactEmail: line(160).optional(),
  socialLinks: z
    .array(z.strictObject({ platform: z.enum(SOCIAL_PLATFORMS), url: required(500) }))
    .max(SOCIAL_PLATFORMS.length)
    .optional(),
  quickLinks: z
    .array(z.strictObject({ label: required(60), url: required(500) }))
    .max(12)
    .optional(),
  homeBanner: z.strictObject({ text: line(200), url: link }).optional(),
  ...placeholderFields,
})

export type AdminResource = {
  /** URL segment: /api/admin/<name>. Matches the collection name in the placeholder list. */
  name: string
  /** For messages, e.g. "Announcement not found". */
  label: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  model: Model<any>
  /** Leave out for content the site has a fixed set of (pages, settings): no POST route. */
  create?: z.ZodType<Record<string, unknown>>
  update: z.ZodType<Record<string, unknown>>
  /** false: no DELETE route. */
  deletable?: boolean
}

/** Everything the site shows, managed from the dashboard. Add a resource here to expose it. */
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
  {
    name: 'pages',
    label: 'Page',
    model: PageModel,
    update: pageFields.partial(),
    deletable: false,
  },
  {
    name: 'executives',
    label: 'Executive',
    model: ExecutiveModel,
    create: executiveBase.transform(executiveOrder),
    update: executiveBase.partial().transform(executiveOrder),
  },
  {
    name: 'senators',
    label: 'Senator',
    model: SenatorModel,
    create: senatorBase.transform(senatorOrder),
    update: senatorBase.partial().transform(senatorOrder),
  },
  {
    name: 'committees',
    label: 'Committee',
    model: CommitteeModel,
    create: committeeFields,
    update: committeeFields.partial(),
  },
  {
    name: 'patrons',
    label: 'Patron',
    model: PatronModel,
    create: patronFields,
    update: patronFields.partial(),
  },
  {
    name: 'albums',
    label: 'Album',
    model: AlbumModel,
    create: albumFields,
    update: albumFields.partial(),
  },
  {
    name: 'publications',
    label: 'Publication',
    model: PublicationModel,
    create: publicationFields,
    update: publicationFields.partial(),
  },
  {
    name: 'documents',
    label: 'Document',
    model: DocumentModel,
    create: documentFields,
    update: documentFields.partial(),
  },
  {
    name: 'resources',
    label: 'Resource',
    model: ResourceModel,
    create: resourceFields,
    update: resourceFields.partial(),
  },
  {
    name: 'gradingscales',
    label: 'Grading scale',
    model: GradingScaleModel,
    create: gradingFields,
    update: gradingFields.partial(),
  },
  {
    name: 'settings',
    label: 'Settings',
    model: SettingsModel,
    update: settingsFields.partial(),
    deletable: false,
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
