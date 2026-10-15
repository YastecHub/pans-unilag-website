import { type PlaceholderView, placeholderView } from '../../../lib/publicView.js'
import { type EventStatus, eventStatus } from '../domain/eventTiming.js'
import type { DATE_PRECISIONS } from '../infrastructure/event.model.js'

export type DatePrecision = (typeof DATE_PRECISIONS)[number]

/** A stored event (lean document or seed entry passed through the model). */
export type StoredEvent = {
  slug: string
  title: string
  series?: string
  dayNumber?: number | null
  startsAt?: Date | string | null
  endsAt?: Date | string | null
  datePrecision?: DatePrecision
  venue?: string
  description?: string
  coverImage?: string
  registrationUrl?: string
  committee?: string
  isPlaceholder?: boolean
  placeholderNote?: string
}

export type EventView = PlaceholderView & {
  slug: string
  title: string
  /** Groups the days of a multi-day event; empty for a one-off event. */
  series: string
  dayNumber: number | null
  /** ISO date-times; null when datePrecision is "unknown". */
  startsAt: string | null
  endsAt: string | null
  /** "month": show only the month(s), e.g. "April – May 2027", never an invented day. */
  datePrecision: DatePrecision
  /** Worked out from the Lagos calendar at request time. */
  status: EventStatus
  venue: string
  /** Markdown. */
  description: string
  coverImage: string
  registrationUrl: string
  /** Slug of the organising committee, if any. */
  committee: string
}

const toDate = (value: Date | string | null | undefined) => (value ? new Date(value) : null)

export function toEventView(event: StoredEvent, now: Date): EventView {
  const startsAt = toDate(event.startsAt)
  const endsAt = toDate(event.endsAt)
  const datePrecision = event.datePrecision ?? 'day'
  return {
    slug: event.slug,
    title: event.title,
    series: event.series ?? '',
    dayNumber: event.dayNumber ?? null,
    startsAt: startsAt?.toISOString() ?? null,
    endsAt: endsAt?.toISOString() ?? null,
    datePrecision,
    status: eventStatus({ endsAt, datePrecision }, now),
    venue: event.venue ?? '',
    description: event.description ?? '',
    coverImage: event.coverImage ?? '',
    registrationUrl: event.registrationUrl ?? '',
    committee: event.committee ?? '',
    ...placeholderView(event),
  }
}

/** Where events are read from. MongoDB in the app; the seed file in tests. */
export type EventReader = {
  /** All events, optionally only one series. Order does not matter; listEvents sorts. */
  list(filter: { series?: string }): Promise<StoredEvent[]>
  findBySlug(slug: string): Promise<StoredEvent | null>
}
