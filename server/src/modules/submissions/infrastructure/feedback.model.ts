import { model, Schema } from 'mongoose'
import { FEEDBACK_CATEGORIES, FEEDBACK_MESSAGE_MAX } from '../application/submissionRules.js'

export const FEEDBACK_STATUSES = ['new', 'read', 'resolved'] as const
const TWELVE_MONTHS_SECONDS = 365 * 24 * 60 * 60

/** Feedback for the Secretary General. Admin-only; MongoDB deletes it 12 months after it arrives. */
const feedbackSchema = new Schema(
  {
    category: { type: String, required: true, enum: FEEDBACK_CATEGORIES },
    message: { type: String, required: true, trim: true, maxlength: FEEDBACK_MESSAGE_MAX },
    /** Only when the sender chose to leave one; otherwise the feedback is anonymous. */
    contactEmail: { type: String, trim: true, lowercase: true },
    status: { type: String, enum: FEEDBACK_STATUSES, default: 'new' },
  },
  { timestamps: true, strict: 'throw', collection: 'feedback' },
)
// Retention (README → Data model): the TTL index removes each entry after 12 months.
feedbackSchema.index({ createdAt: 1 }, { expireAfterSeconds: TWELVE_MONTHS_SECONDS })

export const FeedbackModel = model('Feedback', feedbackSchema)
