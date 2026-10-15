import { model, Schema } from 'mongoose'
import { contentPlugin } from '../../../lib/contentPlugin.js'
import { optionalHttpsUrl } from '../../../lib/urls.js'

/** Home-page notices (README → Home page). Shown from publishAt until expiresAt; pinned ones first. */
const announcementSchema = new Schema({
  title: { type: String, required: true, trim: true, maxlength: 120 },
  /** Markdown, kept short: the home page shows it in full. */
  body: { type: String, required: true, trim: true, maxlength: 1000 },
  publishAt: { type: Date, required: true, default: () => new Date() },
  /** Hidden from this moment on. Leave empty for a notice that stays until it is removed. */
  expiresAt: {
    type: Date,
    validate: {
      validator(this: { publishAt?: Date }, value: Date | null) {
        return !value || !this.publishAt || value > this.publishAt
      },
      message: 'expiresAt must be after publishAt',
    },
  },
  pinned: { type: Boolean, default: false },
  /** Optional "Read more" link (https). */
  link: optionalHttpsUrl,
})
announcementSchema.plugin(contentPlugin)
announcementSchema.index({ publishAt: -1 })

export const AnnouncementModel = model('Announcement', announcementSchema)
