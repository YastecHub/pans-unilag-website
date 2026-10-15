import { model, Schema } from 'mongoose'
import { contentPlugin } from '../../../lib/contentPlugin.js'
import { textIndex, textWeights } from '../../../lib/textIndex.js'
import { SEARCH_FIELDS } from '../../search/application/hits.js'
import { photoField } from '../../../lib/validators.js'

/**
 * day:     exact dates.
 * month:   only the month(s) are known: startsAt is the first day of the first month and endsAt the last
 *          day of the last month (Africa/Lagos). Shown as "April – May 2027", never as an invented day.
 * unknown: the event already happened but its dates are not recorded yet. Listed as past.
 */
export const DATE_PRECISIONS = ['day', 'month', 'unknown'] as const

type EventDates = {
  startsAt?: Date | null
  endsAt?: Date | null
  datePrecision?: (typeof DATE_PRECISIONS)[number]
  isPlaceholder?: boolean
}

const eventSchema = new Schema({
  slug: {
    type: String,
    required: true,
    unique: true,
    match: [/^[a-z0-9]+(-[a-z0-9]+)*$/, 'slug must be lower-case words joined by hyphens'],
  },
  title: { type: String, required: true, trim: true, maxlength: 160 },
  /** Groups days of a multi-day event, e.g. "PANS Health Week 2026: Redefine+". */
  series: { type: String, default: '', trim: true, maxlength: 120 },
  dayNumber: { type: Number, min: 1, max: 31 },
  startsAt: { type: Date },
  endsAt: { type: Date, index: true },
  datePrecision: { type: String, enum: DATE_PRECISIONS, default: 'day' },
  venue: { type: String, default: '', trim: true, maxlength: 200 },
  /** Markdown. */
  description: { type: String, default: '', trim: true },
  coverImage: photoField,
  registrationUrl: {
    type: String,
    default: '',
    trim: true,
    match: [/^$|^https:\/\/\S+$/, 'registrationUrl must be an https:// link'],
  },
  /** Slug of the organising committee (committees.json), if any. */
  committee: { type: String, default: '', trim: true },
})
eventSchema.plugin(contentPlugin)
eventSchema.index(textIndex(SEARCH_FIELDS.event), {
  name: 'search',
  weights: textWeights(SEARCH_FIELDS.event),
})
eventSchema.index({ series: 1, dayNumber: 1 })

eventSchema.pre(
  'validate',
  function (this: EventDates & { invalidate: (path: string, message: string) => void }) {
    if (this.datePrecision === 'unknown') {
      if (this.startsAt || this.endsAt)
        this.invalidate('datePrecision', 'events with unknown dates must not have startsAt/endsAt')
      if (!this.isPlaceholder)
        this.invalidate('datePrecision', 'an event with unknown dates must be a placeholder')
      return
    }
    if (!this.startsAt)
      this.invalidate('startsAt', 'startsAt is required unless datePrecision is "unknown"')
    if (!this.endsAt)
      this.invalidate('endsAt', 'endsAt is required unless datePrecision is "unknown"')
    if (this.startsAt && this.endsAt && this.endsAt < this.startsAt)
      this.invalidate('endsAt', 'endsAt must not be before startsAt')
  },
)

export const EventModel = model('Event', eventSchema)
