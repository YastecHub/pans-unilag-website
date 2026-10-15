import { lagosDay } from '../../../lib/dates.ts'
import type { EventItem } from '../api/events.ts'

/** A month as the API takes it: "2026-11". */
export type MonthKey = string

const MONTH_KEY = /^(\d{4})-(0[1-9]|1[0-2])$/

export function isMonthKey(value: string | null | undefined): value is MonthKey {
  return !!value && MONTH_KEY.test(value)
}

const split = (month: MonthKey) => month.split('-').map(Number) as [number, number]
const pad = (n: number) => String(n).padStart(2, '0')

/** "2026-12" + 1 → "2027-01". */
export function shiftMonth(month: MonthKey, delta: number): MonthKey {
  const [y, m] = split(month)
  const d = new Date(Date.UTC(y, m - 1 + delta, 1))
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}`
}

/** "November 2026". */
export function monthTitle(month: MonthKey): string {
  const [y, m] = split(month)
  return new Intl.DateTimeFormat('en-GB', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(y, m - 1, 1)))
}

export type CalendarDay = {
  /** "2026-11-30". */
  date: string
  dayOfMonth: number
  /** False for the days of the previous/next month that fill the first and last weeks. */
  inMonth: boolean
}

/** The weeks of a month, Monday first, padded with the neighbouring months' days. */
export function monthWeeks(month: MonthKey): CalendarDay[][] {
  const [y, m] = split(month)
  const first = new Date(Date.UTC(y, m - 1, 1))
  const lead = (first.getUTCDay() + 6) % 7 // days before the 1st since Monday
  const daysInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate()
  const cells = Math.ceil((lead + daysInMonth) / 7) * 7
  const days: CalendarDay[] = []
  for (let i = 0; i < cells; i++) {
    const d = new Date(Date.UTC(y, m - 1, 1 - lead + i))
    days.push({
      date: d.toISOString().slice(0, 10),
      dayOfMonth: d.getUTCDate(),
      inMonth: d.getUTCMonth() === m - 1,
    })
  }
  return Array.from({ length: cells / 7 }, (_, w) => days.slice(w * 7, w * 7 + 7))
}

/**
 * Events placed on the Lagos days they run. Only exact ("day" precision) dates go on the grid:
 * a month-precision event never gets an invented day, so it is returned in `undated` instead.
 */
export function placeEvents(events: EventItem[]): {
  byDay: Map<string, EventItem[]>
  undated: EventItem[]
} {
  const byDay = new Map<string, EventItem[]>()
  const undated: EventItem[] = []
  for (const event of events) {
    if (event.datePrecision !== 'day' || !event.startsAt || !event.endsAt) {
      undated.push(event)
      continue
    }
    const last = lagosDay(event.endsAt)
    const cursor = new Date(`${lagosDay(event.startsAt)}T00:00:00Z`)
    // Events last days, not months; the cap guards against a bad end date.
    for (let i = 0; i < 62 && cursor.toISOString().slice(0, 10) <= last; i++) {
      const key = cursor.toISOString().slice(0, 10)
      byDay.set(key, [...(byDay.get(key) ?? []), event])
      cursor.setUTCDate(cursor.getUTCDate() + 1)
    }
  }
  return { byDay, undated }
}
