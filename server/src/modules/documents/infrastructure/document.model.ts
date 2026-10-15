import { model, Schema } from 'mongoose'
import { contentPlugin } from '../../../lib/contentPlugin.js'
import { httpsUrlUnlessPlaceholder } from '../../../lib/urls.js'

/** Approved documents such as the constitution. Each new version is a new entry; the site shows the latest. */
const documentSchema = new Schema({
  /** Same for every version of one document, e.g. "constitution". */
  slug: {
    type: String,
    required: true,
    match: [/^[a-z0-9]+(-[a-z0-9]+)*$/, 'slug must be lower-case words joined by hyphens'],
  },
  title: { type: String, required: true, trim: true, maxlength: 160 },
  version: { type: String, required: true, trim: true, maxlength: 40 },
  approvedOn: { type: Date, required: true },
  approvedBy: { type: String, default: '', trim: true, maxlength: 160 },
  summary: { type: String, default: '', trim: true, maxlength: 500 },
  /** The PDF (https). Empty only while the document is a placeholder waiting for its upload. */
  fileUrl: httpsUrlUnlessPlaceholder('fileUrl'),
  /** For the download label, e.g. "PDF, 7.1 MB". */
  fileSizeBytes: { type: Number, min: 0 },
  pageCount: { type: Number, min: 1 },
})
documentSchema.plugin(contentPlugin)
documentSchema.index({ slug: 1, version: 1 }, { unique: true })

export const DocumentModel = model('Document', documentSchema)
