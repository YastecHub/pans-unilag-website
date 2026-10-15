import { describe, expect, it } from 'vitest'
import { lagosMonthRange, startOfNextLagosDay } from '../src/lib/lagosTime.js'
import { eventStatus, overlapsMonth } from '../src/modules/events/domain/eventTiming.js'

const at = (iso: string) => new Date(iso)
// Freshers' Week as seeded: ends 4 Dec 2026, 23:59:59 Lagos time.
const freshers = { endsAt: at('2026-12-04T23:59:59+01:00'), datePrecision: 'day' as const }

describe('upcoming/past around midnight in Lagos', () => {
  it('is upcoming until the last millisecond of the Lagos day it ends on', () => {
    expect(eventStatus(freshers, at('2026-12-04T23:59:59.999+01:00'))).toBe('upcoming')
    expect(eventStatus(freshers, at('2026-12-05T00:00:00.000+01:00'))).toBe('past')
  })

  it('uses the Lagos calendar, not UTC', () => {
    // 23:30 UTC on 4 Dec is already 00:30 on 5 Dec in Lagos.
    expect(eventStatus(freshers, at('2026-12-04T23:30:00Z'))).toBe('past')
    // 22:59 UTC is 23:59 in Lagos: still the last day.
    expect(eventStatus(freshers, at('2026-12-04T22:59:00Z'))).toBe('upcoming')
  })

  it('keeps an event upcoming all day even when endsAt holds an early time', () => {
    const morning = { endsAt: at('2026-12-04T09:00:00+01:00'), datePrecision: 'day' as const }
    expect(eventStatus(morning, at('2026-12-04T21:00:00+01:00'))).toBe('upcoming')
  })

  it('treats an event in progress as upcoming', () => {
    expect(eventStatus(freshers, at('2026-12-01T12:00:00+01:00'))).toBe('upcoming')
  })

  it('treats month-precision events like any other, by their last day', () => {
    const pharmalympics = {
      endsAt: at('2027-05-31T23:59:59+01:00'),
      datePrecision: 'month' as const,
    }
    expect(eventStatus(pharmalympics, at('2027-05-31T23:00:00+01:00'))).toBe('upcoming')
    expect(eventStatus(pharmalympics, at('2027-06-01T00:00:00+01:00'))).toBe('past')
  })

  it('always treats unknown dates as past', () => {
    expect(eventStatus({ datePrecision: 'unknown' }, at('2000-01-01T00:00:00Z'))).toBe('past')
  })

  it('finds the start of the next Lagos day', () => {
    expect(startOfNextLagosDay(at('2026-12-04T23:30:00Z')).toISOString()).toBe(
      '2026-12-05T23:00:00.000Z',
    )
  })
})

describe('month filter', () => {
  it('covers the whole Lagos month', () => {
    const [start, end] = lagosMonthRange('2027-04')
    expect(start.toISOString()).toBe('2027-03-31T23:00:00.000Z')
    expect(end.toISOString()).toBe('2027-04-30T23:00:00.000Z')
    expect(lagosMonthRange('2026-12')[1].toISOString()).toBe('2026-12-31T23:00:00.000Z')
  })

  it('matches events that overlap the month, never unknown dates', () => {
    const pharmalympics = {
      startsAt: at('2027-04-01T00:00:00+01:00'),
      endsAt: at('2027-05-31T23:59:59+01:00'),
      datePrecision: 'month' as const,
    }
    expect(overlapsMonth(pharmalympics, '2027-04')).toBe(true)
    expect(overlapsMonth(pharmalympics, '2027-05')).toBe(true)
    expect(overlapsMonth(pharmalympics, '2027-03')).toBe(false)
    expect(overlapsMonth(pharmalympics, '2027-06')).toBe(false)
    expect(overlapsMonth({ datePrecision: 'unknown' }, '2027-04')).toBe(false)
  })
})
