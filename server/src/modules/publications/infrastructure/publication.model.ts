import { model, Schema } from 'mongoose'
import { contentPlugin } from '../../../lib/contentPlugin.js'
import { optionalHttpsUrl } from '../../../lib/urls.js'
import { photoField } from '../../../lib/validators.js'

/** Recipharm is the Editorial Board's annual magazine (Art. 19 S.F). */
export const PUBLICATION_SERIES = ['recipharm', 'newspaper', 'substack'] as const

const publicationSchema = new Schema({
  slug: {
    type: String,
    required: true,
    unique: true,
    match: [/^[a-z0-9]+(-[a-z0-9]+)*$/, 'slug must be lower-case words joined by hyphens'],
  },
  title: { type: String, required: true, trim: true, maxlength: 160 },
  series: { type: String, required: true, enum: PUBLICATION_SERIES },
  /** e.g. "2026" or "Issue 3". */
  edition: { type: String, default: '', trim: true, maxlength: 60 },
  publishedOn: { type: Date },
  summary: { type: String, default: '', trim: true, maxlength: 300 },
  cover: photoField,
  /** A PDF to download (e.g. a Recipharm edition). A publication needs this or `link` unless it is a placeholder. */
  fileUrl: {
    ...optionalHttpsUrl,
    validate: {
      validator(this: { link?: string; isPlaceholder?: boolean }, url: string) {
        return url !== '' || !!this.link || this.isPlaceholder === true
      },
      message: 'a publication needs a fileUrl or a link unless it is a placeholder',
    },
  },
  /** A page to open (e.g. the Substack). */
  link: optionalHttpsUrl,
})
publicationSchema.plugin(contentPlugin)

export const PublicationModel = model('Publication', publicationSchema)
