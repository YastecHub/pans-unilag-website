import { model, Schema } from 'mongoose'
import { contentPlugin } from '../../../lib/contentPlugin.js'
import { textIndex, textWeights } from '../../../lib/textIndex.js'
import { SEARCH_FIELDS } from '../../search/application/hits.js'
import { httpsUrlUnlessPlaceholder } from '../../../lib/urls.js'
import { LEVELS } from '../../../lib/validators.js'

export const SEMESTERS = ['first', 'second'] as const

/** Vetted academic links from the Academics Committee. */
const resourceSchema = new Schema({
  title: { type: String, required: true, trim: true, maxlength: 160 },
  level: { type: String, required: true, enum: LEVELS },
  semester: { type: String, required: true, enum: SEMESTERS },
  /** Course code, e.g. "PCH201". */
  course: { type: String, default: '', trim: true, uppercase: true, maxlength: 20 },
  description: { type: String, default: '', trim: true, maxlength: 300 },
  url: httpsUrlUnlessPlaceholder('url'),
  /** Who in the Academics Committee checked the link. Required unless a placeholder. */
  verifiedBy: {
    type: String,
    default: '',
    trim: true,
    maxlength: 120,
    validate: {
      validator(this: { isPlaceholder?: boolean }, name: string) {
        return this.isPlaceholder === true || name.length > 0
      },
      message: 'verifiedBy is required unless the resource is a placeholder',
    },
  },
})
resourceSchema.plugin(contentPlugin)
resourceSchema.index(textIndex(SEARCH_FIELDS.resource), {
  name: 'search',
  weights: textWeights(SEARCH_FIELDS.resource),
})
resourceSchema.index({ level: 1, semester: 1, course: 1 })

export const ResourceModel = model('Resource', resourceSchema)
