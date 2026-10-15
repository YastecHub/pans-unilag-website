import { model, Schema } from 'mongoose'
import { contentPlugin } from '../../../lib/contentPlugin.js'

/** The Dean of the Faculty of Pharmacy and four others (Art. 4 S.C). */
const patronSchema = new Schema({
  order: { type: Number, required: true, min: 1, unique: true },
  name: { type: String, required: true, trim: true, maxlength: 120 },
  title: { type: String, required: true, trim: true, maxlength: 120 },
  isDean: { type: Boolean, default: false },
})
patronSchema.plugin(contentPlugin)

export const PatronModel = model('Patron', patronSchema)
