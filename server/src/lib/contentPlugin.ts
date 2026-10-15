import type { Schema } from 'mongoose'

/** Fields every content collection shares (README → Data model). */
export type ContentFields = {
  /** True while the real content is missing; shown as a placeholder and listed for admins. */
  isPlaceholder: boolean
  /** What is missing, e.g. "Photo after the October photoshoot". Required when isPlaceholder is true. */
  placeholderNote: string
  createdAt: Date
  updatedAt: Date
}

export const PLACEHOLDER_NOTE_MAX_LENGTH = 300

/**
 * Apply to every content schema: `schema.plugin(contentPlugin)`.
 * - adds isPlaceholder (indexed, for the admin Placeholders list and search) and placeholderNote
 * - adds createdAt / updatedAt
 * - rejects unknown fields instead of silently dropping them (catches typos in seed files)
 * - JSON output uses `id` instead of `_id` and drops `__v`
 */
export function contentPlugin(schema: Schema): void {
  schema.add({
    isPlaceholder: { type: Boolean, default: false, index: true },
    placeholderNote: {
      type: String,
      trim: true,
      default: '',
      maxlength: PLACEHOLDER_NOTE_MAX_LENGTH,
      validate: {
        validator(this: { isPlaceholder?: boolean }, note: string) {
          return !this.isPlaceholder || note.trim().length > 0
        },
        message: 'placeholderNote is required when isPlaceholder is true: say what is missing',
      },
    },
  })
  schema.set('timestamps', true)
  schema.set('strict', 'throw')
  schema.set('toJSON', {
    virtuals: true,
    versionKey: false,
    transform: (_doc, ret: Record<string, unknown>) => {
      delete ret._id
      return ret
    },
  })
}
