import { describe, expect, it } from 'vitest'
import { formatDate, formatDayRange, formatMonthRange } from './dates.ts'

describe('dates (Lagos time, British style)', () => {
  it('formats a date in Lagos time, whatever the UTC date', () => {
    expect(formatDate('2026-10-16T08:00:00.000Z')).toBe('16 Oct 2026')
    // 23:30 UTC on 29 Nov is already 30 Nov in Lagos.
    expect(formatDate('2026-11-29T23:30:00.000Z')).toBe('30 Nov 2026')
  })

  it('formats day ranges the way people write them', () => {
    expect(formatDayRange('2026-11-29T23:00:00.000Z', '2026-12-04T22:59:59.000Z')).toBe(
      '30 Nov – 4 Dec 2026',
    )
    expect(formatDayRange('2027-06-06T23:00:00.000Z', '2027-06-11T22:59:59.000Z')).toBe(
      '7 – 11 Jun 2027',
    )
    expect(formatDayRange('2026-06-22T08:00:00.000Z', '2026-06-22T16:00:00.000Z')).toBe(
      '22 Jun 2026',
    )
    expect(formatDayRange('2026-12-28T08:00:00.000Z', '2027-01-02T16:00:00.000Z')).toBe(
      '28 Dec 2026 – 2 Jan 2027',
    )
  })

  it('formats month-precision events without inventing a day', () => {
    expect(formatMonthRange('2027-03-31T23:00:00.000Z', '2027-05-31T22:59:59.000Z')).toBe(
      'April – May 2027',
    )
    expect(formatMonthRange('2027-08-31T23:00:00.000Z', '2027-09-30T22:59:59.000Z')).toBe(
      'September 2027',
    )
  })
})
