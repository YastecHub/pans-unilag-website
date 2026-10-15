import { lagosDay, lagosTime } from '../../../lib/dates.ts'
import type { EventItem } from '../api/events.ts'

/**
 * "Add to calendar": an iCalendar (.ics, RFC 5545) file and a Google Calendar link, both in
 * Africa/Lagos time. Google Calendar and iOS Calendar both import the file.
 */

type CalendarEvent = Pick<
  EventItem,
  'slug' | 'title' | 'startsAt' | 'endsAt' | 'datePrecision' | 'status' | 'venue' | 'description'
>

/** Only exact dates can go in a calendar, and only for events still to come. */
export function canAddToCalendar(event: CalendarEvent): boolean {
  return (
    event.status === 'upcoming' &&
    event.datePrecision === 'day' &&
    !!event.startsAt &&
    !!event.endsAt
  )
}

type Timing =
  | { allDay: true; startDate: string; endDateExclusive: string }
  | { allDay: false; start: string; end: string }

const compact = (value: string) => value.replace(/[-:]/g, '')

const nextDay = (day: string) => {
  const d = new Date(`${day}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + 1)
  return d.toISOString().slice(0, 10)
}

/**
 * Events stored as midnight to 23:59 Lagos time (Freshers' Week, Health Week) are all-day events;
 * anything else keeps its Lagos clock times.
 */
export function eventTiming(startsAt: string, endsAt: string): Timing {
  if (lagosTime(startsAt) === '00:00' && lagosTime(endsAt) === '23:59') {
    return {
      allDay: true,
      startDate: compact(lagosDay(startsAt)),
      endDateExclusive: compact(nextDay(lagosDay(endsAt))),
    }
  }
  const local = (iso: string) => `${compact(lagosDay(iso))}T${compact(lagosTime(iso))}00`
  return { allDay: false, start: local(startsAt), end: local(endsAt) }
}

/**
 * Markdown to plain text for a calendar description: emphasis markers dropped (underscores inside
 * words and URLs kept), links as "text (url)", bullets as "•".
 */
export function plainText(markdown: string): string {
  return markdown
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1 ($2)')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^\s*[-*+]\s+/gm, '• ')
    .replace(/(\*\*|__)(.+?)\1/g, '$2')
    .replace(/(^|[^\w*])[*_](?!\s)(.+?)(?<!\s)[*_](?=[^\w*]|$)/g, '$1$2')
    .replace(/`([^`]+)`/g, '$1')
    .trim()
}

/** RFC 5545 §3.3.11: escape backslashes, semicolons, commas and newlines in text values. */
const escapeText = (value: string) =>
  value.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n')

/** RFC 5545 §3.1: lines longer than 75 octets continue on the next line after a space. */
function fold(line: string): string {
  const encoder = new TextEncoder()
  const parts: string[] = []
  let current = ''
  for (const char of line) {
    const limit = parts.length === 0 ? 75 : 74 // continuation lines start with a space
    if (encoder.encode(current + char).length > limit) {
      parts.push(current)
      current = char
    } else {
      current += char
    }
  }
  parts.push(current)
  return parts.join('\r\n ')
}

const VTIMEZONE = [
  'BEGIN:VTIMEZONE',
  'TZID:Africa/Lagos',
  'BEGIN:STANDARD',
  'DTSTART:19700101T000000',
  'TZOFFSETFROM:+0100',
  'TZOFFSETTO:+0100',
  'TZNAME:WAT',
  'END:STANDARD',
  'END:VTIMEZONE',
]

/** The .ics file for one event. `url` is the event's page on this site; `now` stamps the file. */
export function buildIcs(event: CalendarEvent, url: string, now: Date = new Date()): string {
  if (!event.startsAt || !event.endsAt) throw new Error('An event needs dates to go in a calendar')
  const timing = eventTiming(event.startsAt, event.endsAt)
  const description = [plainText(event.description), `Details: ${url}`].filter(Boolean).join('\n\n')

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//PANS UNILAG//Events//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    ...(timing.allDay ? [] : VTIMEZONE),
    'BEGIN:VEVENT',
    `UID:${event.slug}@pans-unilag`,
    `DTSTAMP:${compact(now.toISOString().slice(0, 19))}Z`,
    ...(timing.allDay
      ? [`DTSTART;VALUE=DATE:${timing.startDate}`, `DTEND;VALUE=DATE:${timing.endDateExclusive}`]
      : [`DTSTART;TZID=Africa/Lagos:${timing.start}`, `DTEND;TZID=Africa/Lagos:${timing.end}`]),
    `SUMMARY:${escapeText(event.title)}`,
    ...(event.venue ? [`LOCATION:${escapeText(event.venue)}`] : []),
    `DESCRIPTION:${escapeText(description)}`,
    `URL:${url}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ]
  return lines.map(fold).join('\r\n') + '\r\n'
}

/** Google Calendar's "create event" page, filled in, in Lagos time. */
export function googleCalendarUrl(event: CalendarEvent, url: string): string {
  if (!event.startsAt || !event.endsAt) throw new Error('An event needs dates to go in a calendar')
  const timing = eventTiming(event.startsAt, event.endsAt)
  const dates = timing.allDay
    ? `${timing.startDate}/${timing.endDateExclusive}`
    : `${timing.start}/${timing.end}`
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    dates,
    ctz: 'Africa/Lagos',
    details: [plainText(event.description), url].filter(Boolean).join('\n\n'),
  })
  if (event.venue) params.set('location', event.venue)
  return `https://calendar.google.com/calendar/render?${params}`
}

/** Saves the .ics file; the phone or computer then offers to add it to the calendar. */
export function downloadIcs(event: CalendarEvent, url: string): void {
  const blob = new Blob([buildIcs(event, url)], { type: 'text/calendar;charset=utf-8' })
  const href = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = href
  a.download = `${event.slug}.ics`
  document.body.append(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(href), 0)
}
