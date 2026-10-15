import { model, Schema } from 'mongoose'
import { contentPlugin } from '../../../lib/contentPlugin.js'

export const SOCIAL_PLATFORMS = [
  'Instagram',
  'X',
  'YouTube',
  'LinkedIn',
  'Facebook',
  'TikTok',
  'WhatsApp',
] as const

const httpsUrl = {
  type: String,
  required: true,
  trim: true,
  match: [/^https:\/\/\S+$/, 'must be an https:// link'] as [RegExp, string],
}

const socialLinkSchema = new Schema(
  { platform: { type: String, required: true, enum: SOCIAL_PLATFORMS }, url: httpsUrl },
  { _id: false, strict: 'throw' },
)

const quickLinkSchema = new Schema(
  {
    label: { type: String, required: true, trim: true, maxlength: 60 },
    url: { type: String, required: true, trim: true },
  },
  { _id: false, strict: 'throw' },
)

/** Site-wide settings: a single document with key "site". */
const settingsSchema = new Schema({
  key: { type: String, required: true, unique: true, enum: ['site'] },
  postalAddress: { type: String, required: true, trim: true },
  location: { type: String, default: '', trim: true },
  /** Official role email only, never a personal address. */
  contactEmail: {
    type: String,
    default: '',
    trim: true,
    lowercase: true,
    match: [/^$|^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'contactEmail must be an email address'],
  },
  socialLinks: { type: [socialLinkSchema], default: [] },
  quickLinks: { type: [quickLinkSchema], default: [] },
  homeBanner: {
    text: { type: String, default: '', trim: true, maxlength: 200 },
    url: { type: String, default: '', trim: true },
  },
})
settingsSchema.plugin(contentPlugin)

export const SettingsModel = model('Settings', settingsSchema)
