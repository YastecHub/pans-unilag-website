/** Shared field rules for content models. */
import { isSession } from './sessions.js'

/** Academic session, e.g. "2026/2027" (the second year must follow the first). */
export const sessionField = {
  type: String,
  required: true,
  validate: {
    validator: isSession,
    message: 'session must look like "2026/2027"',
  },
} as const

/** A student's level. */
export const LEVELS = ['100L', '200L', '300L', '400L', '500L'] as const

/** Cloudinary public id, e.g. "pans-unilag/executives/2026-2027/president". Empty until a photo exists. */
export const photoField = {
  type: String,
  default: '',
  trim: true,
  match: [/^$|^[\w-]+(\/[\w.-]+)*$/, 'photo must be a Cloudinary public id, not a URL'] as [
    RegExp,
    string,
  ],
}

export function maxWords(limit: number) {
  return {
    validator: (text: string) => text.trim() === '' || text.trim().split(/\s+/).length <= limit,
    message: `must be ${limit} words or fewer`,
  }
}
