import { type EventStatus, overlapsMonth } from '../domain/eventTiming.js'
import { type EventView, type StoredEvent, toEventView } from './eventView.js'

export type EventQuery = {
  status?: EventStatus
  series?: string
  /** "YYYY-MM": events whose dates overlap that Lagos month. */
  month?: string
  page: number
  pageSize: number
}

export type EventPage = {
  events: EventView[]
  page: number
  pageSize: number
  total: number
  totalPages: number
}

const time = (iso: string | null) => (iso ? Date.parse(iso) : null)

/**
 * Display order without a series filter: upcoming before past; upcoming soonest first;
 * past most recent first, then events with unknown dates by series and day.
 */
export function compareEvents(a: EventView, b: EventView): number {
  if (a.status !== b.status) return a.status === 'upcoming' ? -1 : 1
  if (a.status === 'upcoming') return (time(a.startsAt) ?? 0) - (time(b.startsAt) ?? 0)
  const [aEnd, bEnd] = [time(a.endsAt), time(b.endsAt)]
  if (aEnd !== bEnd) {
    if (aEnd === null) return 1
    if (bEnd === null) return -1
    return bEnd - aEnd
  }
  return compareDays(a, b)
}

/** With a series filter: the days in order (Day 1, Day 2, …), whatever their status. */
export function compareDays(a: EventView, b: EventView): number {
  return (
    a.series.localeCompare(b.series) ||
    (a.dayNumber ?? Number.MAX_SAFE_INTEGER) - (b.dayNumber ?? Number.MAX_SAFE_INTEGER) ||
    (time(a.startsAt) ?? 0) - (time(b.startsAt) ?? 0) ||
    a.slug.localeCompare(b.slug)
  )
}

/** Filters, sorts and pages events. Events are few (tens per year), so this runs in memory. */
export function listEvents(stored: StoredEvent[], query: EventQuery, now: Date): EventPage {
  const events = stored
    .filter((e) => !query.series || e.series === query.series)
    .filter((e) =>
      query.month
        ? overlapsMonth(
            {
              startsAt: e.startsAt ? new Date(e.startsAt) : null,
              endsAt: e.endsAt ? new Date(e.endsAt) : null,
              datePrecision: e.datePrecision ?? 'day',
            },
            query.month,
          )
        : true,
    )
    .map((e) => toEventView(e, now))
    .filter((e) => !query.status || e.status === query.status)
    .sort(query.series ? compareDays : compareEvents)

  const start = (query.page - 1) * query.pageSize
  return {
    events: events.slice(start, start + query.pageSize),
    page: query.page,
    pageSize: query.pageSize,
    total: events.length,
    totalPages: Math.max(1, Math.ceil(events.length / query.pageSize)),
  }
}
