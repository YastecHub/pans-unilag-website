/**
 * Dates are stored in UTC and shown in Lagos time (README → Data model), British style: "30 Nov 2026".
 * Africa/Lagos has no daylight saving, so the browser's own time zone never matters.
 */
const TIME_ZONE = 'Africa/Lagos'
const LOCALE = 'en-GB'

const parts = (iso: string) => {
  const date = new Date(iso)
  const get = (options: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat(LOCALE, { timeZone: TIME_ZONE, ...options }).format(date)
  return {
    day: get({ day: 'numeric' }),
    shortMonth: get({ month: 'short' }),
    longMonth: get({ month: 'long' }),
    year: get({ year: 'numeric' }),
  }
}

/** "16 Oct 2026". */
export function formatDate(iso: string): string {
  const p = parts(iso)
  return `${p.day} ${p.shortMonth} ${p.year}`
}

/**
 * A date range as people write it: "22 Jun 2026", "7 – 11 Jun 2027", "30 Nov – 4 Dec 2026",
 * "28 Dec 2026 – 2 Jan 2027".
 */
export function formatDayRange(startIso: string, endIso: string): string {
  const [s, e] = [parts(startIso), parts(endIso)]
  if (s.year !== e.year) return `${formatDate(startIso)} – ${formatDate(endIso)}`
  if (s.shortMonth !== e.shortMonth)
    return `${s.day} ${s.shortMonth} – ${e.day} ${e.shortMonth} ${e.year}`
  if (s.day !== e.day) return `${s.day} – ${e.day} ${e.shortMonth} ${e.year}`
  return formatDate(startIso)
}

/** Month precision, never an invented day: "September 2027", "April – May 2027". */
export function formatMonthRange(startIso: string, endIso: string): string {
  const [s, e] = [parts(startIso), parts(endIso)]
  if (s.year !== e.year) return `${s.longMonth} ${s.year} – ${e.longMonth} ${e.year}`
  if (s.longMonth !== e.longMonth) return `${s.longMonth} – ${e.longMonth} ${e.year}`
  return `${s.longMonth} ${s.year}`
}
