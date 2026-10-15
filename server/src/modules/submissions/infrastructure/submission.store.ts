import type { SubmissionStore } from '../application/submissionRules.js'
import { AlumnusModel } from './alumnus.model.js'
import { FeedbackModel } from './feedback.model.js'

export const mongoSubmissionStore: SubmissionStore = {
  async saveFeedback(feedback) {
    await FeedbackModel.create(feedback)
  },
  async saveAlumnus({ email, ...details }) {
    // One entry per email: signing up again updates the details (and the consent time).
    // Fields left out this time (e.g. phone) are removed rather than kept from before.
    await AlumnusModel.updateOne(
      { email: email.toLowerCase() },
      {
        $set: { ...details, email: email.toLowerCase() },
        ...(details.phone === undefined ? { $unset: { phone: 1 } } : {}),
      },
      { upsert: true, runValidators: true },
    )
  },
}
