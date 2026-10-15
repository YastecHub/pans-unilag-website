import { model, Schema } from 'mongoose'
import { contentPlugin } from '../../../lib/contentPlugin.js'
import { LEVELS, maxWords, photoField, sessionField } from '../../../lib/validators.js'

/** The 14 offices of the Executive Council, in constitutional order (Art. 6). Duties are in pages.json. */
export const EXECUTIVE_OFFICES = [
  'President',
  'Vice President',
  'Secretary General',
  'Assistant Secretary General',
  'Treasurer',
  'Financial Secretary',
  'Public Relations Officer',
  'Assistant Public Relations Officer',
  'Editor-in-Chief',
  'Social Secretary',
  'Assistant Social Secretary',
  'Sports Secretary',
  'Assistant Sports Secretary',
  'Welfare Secretary',
] as const

const executiveSchema = new Schema({
  session: sessionField,
  office: { type: String, required: true, enum: EXECUTIVE_OFFICES },
  order: { type: Number, required: true, min: 1 },
  name: { type: String, required: true, trim: true, maxlength: 120 },
  level: { type: String, enum: [...LEVELS, ''], default: '' },
  bio: { type: String, default: '', trim: true, validate: maxWords(60) },
  photo: photoField,
  /** Official role email only, never a personal address. */
  roleEmail: {
    type: String,
    default: '',
    trim: true,
    lowercase: true,
    match: [/^$|^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'roleEmail must be an email address'],
  },
})
executiveSchema.plugin(contentPlugin)
executiveSchema.index({ session: 1, office: 1 }, { unique: true })

export const ExecutiveModel = model('Executive', executiveSchema)
