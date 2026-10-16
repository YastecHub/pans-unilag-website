import { eventDateLabel } from '../../events/api/events.ts'
import { isoMonth, lagosEnd, lagosStart, monthEnd, monthStart, splitLagos } from './lagos.ts'
import {
  checkCommon,
  placeholderBody,
  type ResourceConfig,
  str,
  text,
  precision,
  type Precision,
  SLUG,
} from './types.ts'
import { EventFields } from './EventFields.tsx'

export const events: ResourceConfig = {
  name: 'events',
  singular: 'Event',
  plural: 'Events',
  intro: 'Upcoming and past events. The public pages and calendar update as soon as you save.',
  empty: () => ({
    title: '',
    slug: '',
    slugEdited: false,
    venue: '',
    registrationUrl: '',
    datePrecision: 'day',
    startDate: '',
    startTime: '',
    endDate: '',
    endTime: '',
    startMonth: '',
    endMonth: '',
    description: '',
    series: '',
    dayNumber: '',
    committee: '',
    coverImage: '',
    coverImageAlt: '',
    isPlaceholder: false,
    placeholderNote: '',
  }),
  fromRecord: (r) => {
    const start = splitLagos(r.startsAt)
    const end = splitLagos(r.endsAt)
    // An all-day event is stored as 00:00 to 23:59; show it with the times left empty.
    const allDay = start.time === '00:00' && end.time === '23:59'
    return {
      title: text(r.title),
      slug: text(r.slug),
      slugEdited: true,
      venue: text(r.venue),
      registrationUrl: text(r.registrationUrl),
      datePrecision: text(r.datePrecision) || 'day',
      startDate: start.date,
      startTime: allDay ? '' : start.time,
      endDate: end.date === start.date ? '' : end.date,
      endTime: allDay ? '' : end.time,
      startMonth: isoMonth(r.startsAt),
      endMonth: isoMonth(r.endsAt) === isoMonth(r.startsAt) ? '' : isoMonth(r.endsAt),
      description: text(r.description),
      series: text(r.series),
      dayNumber: typeof r.dayNumber === 'number' ? String(r.dayNumber) : '',
      committee: text(r.committee),
      coverImage: text(r.coverImage),
      coverImageAlt: text(r.coverImageAlt),
      isPlaceholder: r.isPlaceholder === true,
      placeholderNote: text(r.placeholderNote),
    }
  },
  check: (form) => {
    const errors: Record<string, string> = {}
    if (!str(form, 'title').trim()) errors.title = 'Add a title.'
    const slug = str(form, 'slug')
    if (!SLUG.test(slug))
      errors.slug = 'Use lower-case letters and numbers joined by hyphens, e.g. freshers-week-2026.'
    const p = precision(form)
    if (p === 'day') {
      if (!str(form, 'startDate')) errors.startDate = 'Choose the day it starts.'
      const end = str(form, 'endDate') || str(form, 'startDate')
      if (str(form, 'startDate') && end < str(form, 'startDate'))
        errors.endDate = 'The end is before the start.'
      else if (
        end === str(form, 'startDate') &&
        str(form, 'startTime') &&
        str(form, 'endTime') &&
        str(form, 'endTime') < str(form, 'startTime')
      )
        errors.endDate = 'The end time is before the start time.'
    }
    if (p === 'month') {
      if (!str(form, 'startMonth')) errors.startMonth = 'Choose the month it starts.'
      if (str(form, 'endMonth') && str(form, 'endMonth') < str(form, 'startMonth'))
        errors.endMonth = 'This is before the first month.'
    }
    const day = str(form, 'dayNumber').trim()
    if (day && !(/^\d+$/.test(day) && Number(day) >= 1 && Number(day) <= 31))
      errors.dayNumber = 'A number from 1 to 31.'
    if (str(form, 'coverImage') && !str(form, 'coverImageAlt').trim())
      errors.coverImageAlt = 'Describe the photo for people who can’t see it.'
    return {
      ...errors,
      ...checkCommon(form, [{ field: 'registrationUrl', label: 'registration link' }]),
    }
  },
  toBody: (form) => {
    const p = precision(form)
    const startDate = str(form, 'startDate')
    const dates =
      p === 'day'
        ? {
            startsAt: lagosStart(startDate, str(form, 'startTime')),
            endsAt: lagosEnd(str(form, 'endDate') || startDate, str(form, 'endTime')),
          }
        : p === 'month'
          ? {
              startsAt: monthStart(str(form, 'startMonth')),
              endsAt: monthEnd(str(form, 'endMonth') || str(form, 'startMonth')),
            }
          : { startsAt: null, endsAt: null }
    const day = str(form, 'dayNumber').trim()
    return {
      slug: str(form, 'slug'),
      title: str(form, 'title').trim(),
      venue: str(form, 'venue').trim(),
      registrationUrl: str(form, 'registrationUrl').trim(),
      datePrecision: p,
      ...dates,
      description: str(form, 'description').trim(),
      series: str(form, 'series').trim(),
      dayNumber: day ? Number(day) : null,
      committee: str(form, 'committee'),
      coverImage: str(form, 'coverImage'),
      coverImageAlt: str(form, 'coverImage') ? str(form, 'coverImageAlt').trim() : '',
      ...(p === 'unknown'
        ? {
            isPlaceholder: true,
            placeholderNote: str(form, 'placeholderNote').trim() || 'Dates to be confirmed',
          }
        : placeholderBody(form)),
    }
  },
  fieldFor: (path, form) => {
    const month = precision(form) === 'month'
    const map: Record<string, string> = {
      startsAt: month ? 'startMonth' : 'startDate',
      endsAt: month ? 'endMonth' : 'endDate',
    }
    return map[path] ?? path
  },
  labels: {
    title: 'Title',
    slug: 'Web address',
    venue: 'Venue',
    registrationUrl: 'Registration link',
    datePrecision: 'How exact are the dates?',
    startDate: 'Starts on',
    endDate: 'Ends on',
    startMonth: 'From month',
    endMonth: 'To month',
    dayNumber: 'Day',
    coverImage: 'Cover photo',
    coverImageAlt: 'Describe the photo',
    placeholderNote: 'What’s missing?',
  },
  Fields: EventFields,
  rowTitle: (r) => text(r.title),
  rowDetail: (r) =>
    [
      eventDateLabel({
        startsAt: (r.startsAt as string | null) ?? null,
        endsAt: (r.endsAt as string | null) ?? null,
        datePrecision: (text(r.datePrecision) || 'day') as Precision,
      }) ?? 'Dates not known',
      text(r.series),
    ]
      .filter(Boolean)
      .join(' · '),
  publicPath: (r) => `/events/${text(r.slug)}`,
}
