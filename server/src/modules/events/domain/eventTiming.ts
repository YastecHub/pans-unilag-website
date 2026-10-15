/**
 * When an event counts as upcoming or past. Pure functions: the current time is passed in.
 *
 * Dates are judged on the Lagos calendar (Africa/Lagos is UTC+1 all year, no daylight saving):
 * an event stays "upcoming" until the end of the Lagos day it ends on, whatever time of day
 * endsAt holds. So Freshers' Week (ends 4 Dec) is upcoming until 23:59:59.999 on 4 Dec in Lagos
 * and past from midnight.
 */

export const LAGOS_OFFSET_MS = 60 * 60 * 1000
const DAY_MS = 24 * 60 * 60 * 1000

export type EventStatus = 'upcoming' | 'past'

export type TimedEvent = {
  endsAt?: Date | null
  datePrecision: 'day' | 'month' | 'unknown'
}

/** The first instant after the Lagos calendar day that contains `date`. */
export function startOfNextLagosDay(date: Date): Date {
  const lagosDayStart = Math.floor((date.getTime() + LAGOS_OFFSET_MS) / DAY_MS) * DAY_MS
  return new Date(lagosDayStart + DAY_MS - LAGOS_OFFSET_MS)
}

export function eventStatus(event: TimedEvent, now: Date): EventStatus {
  // "unknown" means it already happened but the dates were not recorded.
  if (event.datePrecision === 'unknown' || !event.endsAt) return 'past'
  return now < startOfNextLagosDay(event.endsAt) ? 'upcoming' : 'past'
}

/** Lagos month "2027-04" as [first instant, first instant of the next month). */
export function lagosMonthRange(month: string): [Date, Date] {
  const [year, monthNumber] = month.split('-').map(Number) as [number, number]
  const start = Date.UTC(year, monthNumber - 1, 1) - LAGOS_OFFSET_MS
  const end = Date.UTC(year, monthNumber, 1) - LAGOS_OFFSET_MS
  return [new Date(start), new Date(end)]
}

/** True if the event's dates overlap the Lagos month. Events with unknown dates never match. */
export function overlapsMonth(
  event: TimedEvent & { startsAt?: Date | null },
  month: string,
): boolean {
  if (event.datePrecision === 'unknown' || !event.startsAt || !event.endsAt) return false
  const [start, end] = lagosMonthRange(month)
  return event.startsAt < end && event.endsAt >= start
}
