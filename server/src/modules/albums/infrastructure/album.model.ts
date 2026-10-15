import { model, Schema } from 'mongoose'
import { contentPlugin } from '../../../lib/contentPlugin.js'
import { photoField } from '../../../lib/validators.js'

const photoSchema = new Schema(
  {
    publicId: { ...photoField, required: true },
    /** Required: describe the photo for people who can't see it. */
    alt: { type: String, required: true, trim: true, maxlength: 200 },
    caption: { type: String, default: '', trim: true, maxlength: 300 },
  },
  { _id: false, strict: 'throw' },
)

type AlbumDoc = {
  photos: { publicId: string }[]
  cover?: string
  consentConfirmed?: boolean
  isPlaceholder?: boolean
  invalidate: (path: string, message: string) => void
}

/** A photo album for one event (README → Gallery rules). */
const albumSchema = new Schema({
  slug: { type: String, required: true, unique: true, match: /^[a-z0-9]+(-[a-z0-9]+)*$/ },
  title: { type: String, required: true, trim: true, maxlength: 160 },
  /** Slug of the event in events.json. */
  event: { type: String, required: true, trim: true },
  series: { type: String, default: '', trim: true },
  cover: { type: String, default: '' },
  photos: { type: [photoSchema], default: [] },
  /** Link to the full Drive folder. Entered in the dashboard, never committed to the repository. */
  sourceFolderUrl: {
    type: String,
    default: '',
    trim: true,
    match: [/^$|^https:\/\/\S+$/, 'sourceFolderUrl must be an https:// link'] as [RegExp, string],
  },
  /** The Media Committee confirms the people pictured agreed to publication. */
  consentConfirmed: { type: Boolean, default: false },
})
albumSchema.plugin(contentPlugin)

albumSchema.pre('validate', function (this: AlbumDoc) {
  if (this.photos.length === 0) {
    if (!this.isPlaceholder)
      this.invalidate('photos', 'an album without photos must be a placeholder')
    return
  }
  if (this.photos.length > 40) this.invalidate('photos', 'an album holds at most 40 photos')
  if (!this.consentConfirmed)
    this.invalidate('consentConfirmed', 'photos can only be published once consent is confirmed')
  if (!this.photos.some((p) => p.publicId === this.cover))
    this.invalidate('cover', 'cover must be one of the album photos')
})

export const AlbumModel = model('Album', albumSchema)
