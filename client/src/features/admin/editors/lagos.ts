import { lagosDay, lagosMonth, lagosTime } from '../../../lib/dates.ts'

/**
 * The dashboard's date and time boxes are Lagos wall-clock time (Africa/Lagos is UTC+1 all year);
 * the API takes ISO date-times with an offset. These convert between the two.
 */
const OFFSET = '+01:00'

/** "2026-11-30T08:00:00.000Z" → { date: "2026-11-30", time: "09:00" } */
export function splitLagos(iso: unknown): { date: string; time: string } {
  if (typeof iso !== 'string' || !iso) return { date: '', time: '' }
  return { date: lagosDay(iso), time: lagosTime(iso) }
}

/** ("2026-11-30", "09:00") → "2026-11-30T09:00:00+01:00"; no time = the start of the day. */
export function lagosStart(date: string, time = ''): string {
  return `${date}T${time || '00:00'}:00${OFFSET}`
}

/** ("2026-12-04", "") → "2026-12-04T23:59:59+01:00": an end with no time is the end of the day. */
export function lagosEnd(date: string, time = ''): string {
  return time ? `${date}T${time}:00${OFFSET}` : `${date}T23:59:59${OFFSET}`
}

/** "2027-04" → the first moment of April 2027 in Lagos. */
export const monthStart = (month: string) => `${month}-01T00:00:00${OFFSET}`

/** "2027-05" → the last moment of May 2027 in Lagos. */
export function monthEnd(month: string): string {
  const [y, m] = month.split('-').map(Number) as [number, number]
  const last = new Date(Date.UTC(y, m, 0)).getUTCDate()
  return `${month}-${String(last).padStart(2, '0')}T23:59:59${OFFSET}`
}

/** An ISO date-time → its Lagos month, "2027-04". */
export const isoMonth = (iso: unknown) => (typeof iso === 'string' && iso ? lagosMonth(iso) : '')

/** "Freshers' Week 2026!" → "freshers-week-2026", the web address name the API accepts. */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[’']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
    .replace(/-+$/, '')
}
