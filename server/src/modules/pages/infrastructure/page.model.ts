import { model, Schema, type InferSchemaType } from 'mongoose'
import { contentPlugin, type ContentFields } from '../../../lib/contentPlugin.js'

/** "Art. 19", "Art. 4 S.B", "Art. 8 S.C Ss(ix)" or "Preamble": where the reader can check the text. */
export const ARTICLE_REF = /^(Preamble|Art\. \d+( S\.[A-Z](-[A-Z])?)?( Ss\([ivx]+\))?)$/

const sectionSchema = new Schema(
  {
    heading: { type: String, required: true, trim: true, maxlength: 120 },
    /** Markdown, rendered sanitised on the client. */
    bodyMarkdown: { type: String, required: true, trim: true },
    articleRefs: {
      type: [
        {
          type: String,
          match: [ARTICLE_REF, 'articleRefs must look like "Art. 19" or "Art. 4 S.B"'],
        },
      ],
      default: [],
    },
  },
  { _id: false, strict: 'throw' },
)

/** Constitution-derived page content (About, Governance, Elections, …). Seeded from server/seed/pages.json. */
const pageSchema = new Schema({
  slug: {
    type: String,
    required: true,
    unique: true,
    match: [/^[a-z0-9]+(-[a-z0-9]+)*$/, 'slug must be lower-case words joined by hyphens'],
  },
  title: { type: String, required: true, trim: true, maxlength: 120 },
  order: { type: Number, required: true, min: 0 },
  sections: {
    type: [sectionSchema],
    validate: {
      validator: (s: unknown[]) => s.length > 0,
      message: 'a page needs at least one section',
    },
  },
})
pageSchema.plugin(contentPlugin)

export type Page = InferSchemaType<typeof pageSchema> & ContentFields

export const PageModel = model('Page', pageSchema)
