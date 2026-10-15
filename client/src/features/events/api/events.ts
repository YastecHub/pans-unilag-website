import { useQuery } from '@tanstack/react-query'
import { formatDayRange, formatMonthRange } from '../../../lib/dates.ts'
import { api } from '../../../lib/http.ts'

/** GET /api/events (README → API reference). */
export type EventItem = {
  slug: string
  title: string
  series: string
  dayNumber: number | null
  startsAt: string | null
  endsAt: string | null
  datePrecision: 'day' | 'month' | 'unknown'
  status: 'upcoming' | 'past'
  venue: string
  description: string
  coverImage: string
  registrationUrl: string
  committee: string
  isPlaceholder: boolean
  placeholderNote?: string
}

export type EventPage = {
  events: EventItem[]
  page: number
  pageSize: number
  total: number
  totalPages: number
}

export type EventQuery = {
  status?: 'upcoming' | 'past'
  series?: string
  month?: string
  page?: number
  pageSize?: number
}

export function eventsPath(query: EventQuery): string {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== '') params.set(key, String(value))
  }
  const qs = params.toString()
  return `/api/events${qs ? `?${qs}` : ''}`
}

export function useEvents(query: EventQuery) {
  return useQuery({
    queryKey: ['events', query],
    queryFn: ({ signal }) => api.get<EventPage>(eventsPath(query), signal),
  })
}

/** GET /api/events/:slug. */
export function useEvent(slug: string) {
  return useQuery({
    queryKey: ['event', slug],
    queryFn: ({ signal }) => api.get<EventItem>(`/api/events/${encodeURIComponent(slug)}`, signal),
  })
}

/** The API's largest page. */
const MAX_PAGE_SIZE = 50

/**
 * Every event matching the query, following the pages. Events are few (tens a year), so this is
 * one request today; the loop keeps the list complete as the archive grows.
 */
export function useAllEvents(query: Omit<EventQuery, 'page' | 'pageSize'>) {
  return useQuery({
    queryKey: ['events', 'all', query],
    queryFn: async ({ signal }) => {
      const events: EventItem[] = []
      for (let page = 1; ; page++) {
        const result = await api.get<EventPage>(
          eventsPath({ ...query, page, pageSize: MAX_PAGE_SIZE }),
          signal,
        )
        events.push(...result.events)
        if (page >= result.totalPages) return events
      }
    },
  })
}

export type SeriesGroup = {
  /** "Pharmalympics 2026"; empty for the group of one-off events. */
  series: string
  events: EventItem[]
}

/**
 * Past events grouped by series (Health Week 2026, Pharmalympics 2026), in the order the API lists
 * them (most recent first), each series in day order. One-off events come last, together.
 */
export function groupBySeries(events: EventItem[]): SeriesGroup[] {
  const groups = new Map<string, EventItem[]>()
  for (const event of events) {
    groups.set(event.series, [...(groups.get(event.series) ?? []), event])
  }
  const byDay = (a: EventItem, b: EventItem) =>
    (a.dayNumber ?? Number.MAX_SAFE_INTEGER) - (b.dayNumber ?? Number.MAX_SAFE_INTEGER)
  const list = [...groups].map(([series, list]) => ({
    series,
    events: series ? [...list].sort(byDay) : list,
  }))
  return [...list.filter((g) => g.series), ...list.filter((g) => !g.series)]
}

/** "30 Nov – 4 Dec 2026", "April – May 2027", or null when the dates are not known yet. */
export function eventDateLabel(event: Pick<EventItem, 'startsAt' | 'endsAt' | 'datePrecision'>) {
  if (event.datePrecision === 'unknown' || !event.startsAt || !event.endsAt) return null
  return event.datePrecision === 'month'
    ? formatMonthRange(event.startsAt, event.endsAt)
    : formatDayRange(event.startsAt, event.endsAt)
}
