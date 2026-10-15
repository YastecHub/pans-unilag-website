/**
 * When an event counts as upcoming or past. Pure functions: the current time is passed in.
 *
 * Dates are judged on the Lagos calendar (Africa/Lagos is UTC+1 all year, no daylight saving):
 * an event stays "upcoming" until the end of the Lagos day it ends on, whatever time of day
 * endsAt holds. So Freshers' Week (ends 4 Dec) is upcoming until 23:59:59.999 on 4 Dec in Lagos
 * and past from midnight.
 */
import { isOnOrBeforeLagosDay, lagosMonthRange } from '../../../lib/lagosTime.js'

export type EventStatus = 'upcoming' | 'past'

export type TimedEvent = {
  endsAt?: Date | null
  datePrecision: 'day' | 'month' | 'unknown'
}

export function eventStatus(event: TimedEvent, now: Date): EventStatus {
  // "unknown" means it already happened but the dates were not recorded.
  if (event.datePrecision === 'unknown' || !event.endsAt) return 'past'
  return isOnOrBeforeLagosDay(now, event.endsAt) ? 'upcoming' : 'past'
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
