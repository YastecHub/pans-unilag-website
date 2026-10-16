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

/**
 * A page on this site ("/academics/cgpa-calculator", never "//elsewhere") or an https:// link.
 * Anything else, such as javascript: links, is refused.
 */
export const SITE_OR_HTTPS_LINK = /^(\/(?!\/)\S*|https:\/\/\S+)$/
const siteOrHttpsMessage = 'must be a page on this site (starting with /) or an https:// link'

const quickLinkSchema = new Schema(
  {
    label: { type: String, required: true, trim: true, maxlength: 60 },
    url: {
      type: String,
      required: true,
      trim: true,
      match: [SITE_OR_HTTPS_LINK, `url ${siteOrHttpsMessage}`] as [RegExp, string],
    },
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
    url: {
      type: String,
      default: '',
      trim: true,
      validate: {
        validator: (url: string) => url === '' || SITE_OR_HTTPS_LINK.test(url),
        message: `homeBanner.url ${siteOrHttpsMessage}`,
      },
    },
  },
})
settingsSchema.plugin(contentPlugin)

export const SettingsModel = model('Settings', settingsSchema)
