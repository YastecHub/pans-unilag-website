import { describe, expect, it } from 'vitest'
import { lagosDay, lagosMonth, lagosTime } from '../../../lib/dates.ts'
import type { EventItem } from '../api/events.ts'
import { buildIcs, canAddToCalendar, eventTiming, googleCalendarUrl, plainText } from './ics.ts'
import { isMonthKey, monthTitle, monthWeeks, placeEvents, shiftMonth } from './month.ts'

const event = (overrides: Partial<EventItem>): EventItem => ({
  slug: 'freshers-week-2026',
  title: "Freshers' Week",
  series: '',
  dayNumber: null,
  startsAt: '2026-11-29T23:00:00.000Z', // 30 Nov, 00:00 Lagos
  endsAt: '2026-12-04T22:59:59.000Z', // 4 Dec, 23:59:59 Lagos
  datePrecision: 'day',
  status: 'upcoming',
  venue: '',
  description: '',
  coverImage: '',
  registrationUrl: '',
  committee: '',
  isPlaceholder: false,
  ...overrides,
})

describe('Lagos dates', () => {
  it('reads the Lagos calendar, not UTC', () => {
    // 23:30 UTC on 31 Dec is already 00:30 on 1 Jan in Lagos.
    expect(lagosDay('2026-12-31T23:30:00Z')).toBe('2027-01-01')
    expect(lagosMonth('2026-12-31T23:30:00Z')).toBe('2027-01')
    expect(lagosTime('2026-11-30T17:30:00Z')).toBe('18:30')
  })
})

describe('month grid', () => {
  it('validates and moves between months across years', () => {
    expect(isMonthKey('2026-11')).toBe(true)
    expect(isMonthKey('2026-13')).toBe(false)
    expect(isMonthKey('nov')).toBe(false)
    expect(shiftMonth('2026-12', 1)).toBe('2027-01')
    expect(shiftMonth('2027-01', -1)).toBe('2026-12')
    expect(monthTitle('2027-04')).toBe('April 2027')
  })

  it('lays a month out in Monday-first weeks', () => {
    const weeks = monthWeeks('2026-11') // 1 Nov 2026 is a Sunday
    expect(weeks).toHaveLength(6)
    expect(weeks[0]![0]).toEqual({ date: '2026-10-26', dayOfMonth: 26, inMonth: false })
    expect(weeks[0]![6]).toEqual({ date: '2026-11-01', dayOfMonth: 1, inMonth: true })
    expect(weeks[5]![0]).toEqual({ date: '2026-11-30', dayOfMonth: 30, inMonth: true })
    expect(weeks.flat().filter((d) => d.inMonth)).toHaveLength(30)
  })

  it('puts exact dates on every Lagos day they run, and month-only dates on none', () => {
    const freshers = event({})
    const pharmalympics = event({
      slug: 'pharmalympics-2027',
      datePrecision: 'month',
      startsAt: '2027-03-31T23:00:00.000Z',
      endsAt: '2027-05-31T22:59:59.000Z',
    })
    const { byDay, undated } = placeEvents([freshers, pharmalympics])
    expect([...byDay.keys()]).toEqual([
      '2026-11-30',
      '2026-12-01',
      '2026-12-02',
      '2026-12-03',
      '2026-12-04',
    ])
    expect(undated).toEqual([pharmalympics])
  })
})

describe('add to calendar', () => {
  it('is offered only for upcoming events with exact dates', () => {
    expect(canAddToCalendar(event({}))).toBe(true)
    expect(canAddToCalendar(event({ datePrecision: 'month' }))).toBe(false)
    expect(canAddToCalendar(event({ datePrecision: 'unknown', startsAt: null }))).toBe(false)
    expect(canAddToCalendar(event({ status: 'past' }))).toBe(false)
  })

  it('treats midnight-to-23:59 Lagos as all-day, with an exclusive end date', () => {
    expect(eventTiming('2026-11-29T23:00:00Z', '2026-12-04T22:59:59Z')).toEqual({
      allDay: true,
      startDate: '20261130',
      endDateExclusive: '20261205',
    })
    expect(eventTiming('2026-11-30T09:00:00Z', '2026-11-30T15:00:00Z')).toEqual({
      allDay: false,
      start: '20261130T100000',
      end: '20261130T160000',
    })
  })

  it('builds a valid all-day .ics with CRLF line endings', () => {
    const ics = buildIcs(
      event({ venue: 'Faculty of Pharmacy, Idi-Araba', description: 'Welcome; **all** freshers' }),
      'https://pansunilag.org/events/freshers-week-2026',
      new Date('2026-10-16T08:00:00Z'),
    )
    const lines = ics.split('\r\n')
    expect(ics.endsWith('\r\n')).toBe(true)
    expect(ics.replace(/\r\n/g, '')).not.toMatch(/\n/)
    expect(lines).toEqual(
      expect.arrayContaining([
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'UID:freshers-week-2026@pans-unilag',
        'DTSTAMP:20261016T080000Z',
        'DTSTART;VALUE=DATE:20261130',
        'DTEND;VALUE=DATE:20261205',
        "SUMMARY:Freshers' Week",
        'LOCATION:Faculty of Pharmacy\\, Idi-Araba',
        'URL:https://pansunilag.org/events/freshers-week-2026',
        'END:VCALENDAR',
      ]),
    )
    expect(ics).toContain('DESCRIPTION:Welcome\\; all freshers\\n\\nDetails: https://')
    expect(ics).not.toContain('VTIMEZONE')
  })

  it('pins timed events to Africa/Lagos and folds long lines at 75 octets', () => {
    const ics = buildIcs(
      event({
        startsAt: '2026-11-30T09:00:00Z',
        endsAt: '2026-11-30T15:00:00Z',
        description: 'Ọ̀rọ̀ '.repeat(40),
      }),
      'https://pansunilag.org/events/freshers-week-2026',
    )
    expect(ics).toContain('BEGIN:VTIMEZONE\r\nTZID:Africa/Lagos')
    expect(ics).toContain('DTSTART;TZID=Africa/Lagos:20261130T100000')
    expect(ics).toContain('DTEND;TZID=Africa/Lagos:20261130T160000')
    for (const line of ics.split('\r\n')) {
      expect(new TextEncoder().encode(line).length).toBeLessThanOrEqual(75)
    }
    // Unfolding (RFC 5545 §3.1) gives back the whole description.
    expect(ics.replace(/\r\n /g, '')).toContain(`DESCRIPTION:${'Ọ̀rọ̀ '.repeat(40).trim()}`)
  })

  it('fills in a Google Calendar link in Lagos time', () => {
    const url = new URL(googleCalendarUrl(event({ venue: 'LUTH' }), 'https://x.test/e'))
    expect(url.origin).toBe('https://calendar.google.com')
    expect(url.searchParams.get('action')).toBe('TEMPLATE')
    expect(url.searchParams.get('dates')).toBe('20261130/20261205')
    expect(url.searchParams.get('ctz')).toBe('Africa/Lagos')
    expect(url.searchParams.get('location')).toBe('LUTH')
  })

  it('turns Markdown into readable text without breaking URLs', () => {
    expect(
      plainText(
        '## Programme\n- **Talks** by _alumni_\n- Follow [us](https://instagram.com/pans_unilag)',
      ),
    ).toBe('Programme\n• Talks by alumni\n• Follow us (https://instagram.com/pans_unilag)')
  })
})
