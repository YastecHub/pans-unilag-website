import { model, Schema } from 'mongoose'
import { contentPlugin } from '../../../lib/contentPlugin.js'
import { LEVELS, sessionField } from '../../../lib/validators.js'

/** Principal officers of the Senate (Art. 18). Only these are listed on the site for 2026/27. */
export const SENATE_POSITIONS = [
  'Senate President',
  'Deputy Senate President',
  'Senate Leader',
  'Chief Whip',
] as const

const senatorSchema = new Schema({
  session: sessionField,
  position: { type: String, required: true, enum: SENATE_POSITIONS },
  order: { type: Number, required: true, min: 1 },
  name: { type: String, required: true, trim: true, maxlength: 120 },
  level: { type: String, enum: [...LEVELS, ''], default: '' },
})
senatorSchema.plugin(contentPlugin)
senatorSchema.index({ session: 1, position: 1 }, { unique: true })

export const SenatorModel = model('Senator', senatorSchema)
