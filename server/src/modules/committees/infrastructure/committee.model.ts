import { model, Schema } from 'mongoose'
import { contentPlugin } from '../../../lib/contentPlugin.js'
import { LEVELS, photoField, sessionField } from '../../../lib/validators.js'

/** Officer titles vary by committee: Lead/Assistant, Chairman/Secretary, LEO/LLO. */
const officerSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 60 },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    level: { type: String, enum: [...LEVELS, ''], default: '' },
  },
  { _id: false, strict: 'throw' },
)

const listField = { type: [{ type: String, trim: true, maxlength: 300 }], default: [] }

/** The committees appointed for a session (README → Committees shown on the site). */
const committeeSchema = new Schema({
  slug: {
    type: String,
    required: true,
    unique: true,
    match: [/^[a-z0-9]+(-[a-z0-9]+)*$/, 'slug must be lower-case words joined by hyphens'],
  },
  name: { type: String, required: true, trim: true, maxlength: 160 },
  shortName: { type: String, required: true, trim: true, maxlength: 40 },
  session: sessionField,
  order: { type: Number, required: true, min: 1 },
  /** Markdown. Required unless the committee is a placeholder waiting for its write-up. */
  description: {
    type: String,
    trim: true,
    default: '',
    validate: {
      validator(this: { isPlaceholder?: boolean }, text: string) {
        return this.isPlaceholder === true || text.length > 0
      },
      message: 'description is required unless the committee is a placeholder',
    },
  },
  activities: listField,
  achievements: listField,
  plans: listField,
  motto: { type: String, default: '', trim: true, maxlength: 160 },
  officers: { type: [officerSchema], default: [] },
  coverImage: photoField,
})
committeeSchema.plugin(contentPlugin)

export const CommitteeModel = model('Committee', committeeSchema)
