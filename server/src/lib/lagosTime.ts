/**
 * Dates on the Lagos calendar. Africa/Lagos is UTC+1 all year (no daylight saving),
 * so a fixed offset is exact.
 */
export const LAGOS_OFFSET_MS = 60 * 60 * 1000
const DAY_MS = 24 * 60 * 60 * 1000

/** The first instant after the Lagos calendar day that contains `date`. */
export function startOfNextLagosDay(date: Date): Date {
  const lagosDayStart = Math.floor((date.getTime() + LAGOS_OFFSET_MS) / DAY_MS) * DAY_MS
  return new Date(lagosDayStart + DAY_MS - LAGOS_OFFSET_MS)
}

/** True until the end of the Lagos day `date` falls on: a deadline of "4 Dec" is open all of 4 Dec. */
export function isOnOrBeforeLagosDay(now: Date, date: Date): boolean {
  return now < startOfNextLagosDay(date)
}

/** Lagos month "2027-04" as [first instant, first instant of the next month). */
export function lagosMonthRange(month: string): [Date, Date] {
  const [year, monthNumber] = month.split('-').map(Number) as [number, number]
  return [
    new Date(Date.UTC(year, monthNumber - 1, 1) - LAGOS_OFFSET_MS),
    new Date(Date.UTC(year, monthNumber, 1) - LAGOS_OFFSET_MS),
  ]
}

/** The first instant of the Lagos calendar day that contains `date`. */
export function startOfLagosDay(date: Date): Date {
  return new Date(startOfNextLagosDay(date).getTime() - 24 * 60 * 60 * 1000)
}
