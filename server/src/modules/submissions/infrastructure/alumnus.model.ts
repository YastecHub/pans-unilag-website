import { model, Schema } from 'mongoose'
import { ALUMNI_INTERESTS } from '../application/submissionRules.js'

/** Alumni network sign-ups. Admin-only; kept until the person asks to be removed. */
const alumnusSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    graduationYear: { type: Number, required: true, min: 1960 },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    phone: { type: String, trim: true },
    interests: { type: [{ type: String, enum: ALUMNI_INTERESTS }], default: [] },
    /** When the person last agreed to the privacy notice. */
    consentAt: { type: Date, required: true },
  },
  { timestamps: true, strict: 'throw', collection: 'alumni' },
)

export const AlumnusModel = model('Alumnus', alumnusSchema)
