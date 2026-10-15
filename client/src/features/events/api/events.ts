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

/** "30 Nov – 4 Dec 2026", "April – May 2027", or null when the dates are not known yet. */
export function eventDateLabel(event: Pick<EventItem, 'startsAt' | 'endsAt' | 'datePrecision'>) {
  if (event.datePrecision === 'unknown' || !event.startsAt || !event.endsAt) return null
  return event.datePrecision === 'month'
    ? formatMonthRange(event.startsAt, event.endsAt)
    : formatDayRange(event.startsAt, event.endsAt)
}
