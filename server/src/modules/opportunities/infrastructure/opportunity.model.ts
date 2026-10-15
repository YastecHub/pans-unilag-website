import { model, Schema } from 'mongoose'
import { contentPlugin } from '../../../lib/contentPlugin.js'
import { textIndex, textWeights } from '../../../lib/textIndex.js'
import { SEARCH_FIELDS } from '../../search/application/hits.js'
import { httpsUrlUnlessPlaceholder } from '../../../lib/urls.js'

export const OPPORTUNITY_TYPES = [
  'scholarship',
  'internship',
  'competition',
  'conference',
  'training',
  'job',
  'other',
] as const

/** Opportunities Hub listings, run by CPD & CBC. Hidden once the deadline day has passed (Lagos time). */
const opportunitySchema = new Schema({
  slug: {
    type: String,
    required: true,
    unique: true,
    match: [/^[a-z0-9]+(-[a-z0-9]+)*$/, 'slug must be lower-case words joined by hyphens'],
  },
  title: { type: String, required: true, trim: true, maxlength: 160 },
  type: { type: String, required: true, enum: OPPORTUNITY_TYPES },
  organisation: { type: String, default: '', trim: true, maxlength: 120 },
  /** Markdown. */
  description: { type: String, default: '', trim: true },
  eligibility: { type: String, default: '', trim: true, maxlength: 500 },
  /** Last day to apply. Empty for rolling opportunities, which stay listed until removed. */
  deadline: { type: Date, index: true },
  applyUrl: httpsUrlUnlessPlaceholder('applyUrl'),
  /** When CPD & CBC last confirmed the listing is still accurate. */
  lastCheckedAt: { type: Date },
})
opportunitySchema.plugin(contentPlugin)
opportunitySchema.index(textIndex(SEARCH_FIELDS.opportunity), {
  name: 'search',
  weights: textWeights(SEARCH_FIELDS.opportunity),
})

export const OpportunityModel = model('Opportunity', opportunitySchema)
