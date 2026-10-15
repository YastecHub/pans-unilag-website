import { z } from 'zod'

/** Who reads feedback: the Secretary General (Art. 8); welfare issues go to the Welfare Secretary. */
export const FEEDBACK_CATEGORIES = ['suggestion', 'complaint', 'welfare', 'other'] as const

/** What alumni can offer; the Alumni Network Committee follows up. */
export const ALUMNI_INTERESTS = [
  'mentoring',
  'speaking',
  'internships-and-jobs',
  'events',
  'supporting-pans',
] as const

export const FEEDBACK_MESSAGE_MAX = 2000
export const FIRST_GRADUATING_YEAR = 1960

/**
 * Hidden form field. People never see or fill it; bots that fill every field do.
 * A filled honeypot gets the normal "received" reply but nothing is stored.
 */
export const HONEYPOT_FIELD = 'website'

const honeypot = z.string().max(500).optional()

/** An optional email: an empty string counts as "not given". */
const optionalEmail = z
  .union([z.literal(''), z.email('Enter a valid email address').max(254)])
  .optional()
  .transform((value) => value || undefined)

export const feedbackInputSchema = z.strictObject({
  category: z.enum(FEEDBACK_CATEGORIES),
  message: z
    .string()
    .trim()
    .min(10, 'Please write at least 10 characters')
    .max(FEEDBACK_MESSAGE_MAX, `Please keep it under ${FEEDBACK_MESSAGE_MAX} characters`),
  /** Leave empty to stay anonymous. */
  contactEmail: optionalEmail,
  [HONEYPOT_FIELD]: honeypot,
})

export function alumniInputSchema(currentYear: number) {
  return z.strictObject({
    name: z.string().trim().min(2).max(120),
    graduationYear: z
      .number()
      .int()
      .min(FIRST_GRADUATING_YEAR)
      .max(currentYear + 1, 'Graduation year cannot be in the future'),
    email: z.email('Enter a valid email address').max(254),
    phone: z
      .string()
      .trim()
      .regex(/^\+?[\d\s()-]{7,20}$/, 'Enter a valid phone number')
      .optional()
      .or(z.literal('').transform(() => undefined)),
    interests: z.array(z.enum(ALUMNI_INTERESTS)).max(ALUMNI_INTERESTS.length).default([]),
    /** Must be true: the privacy notice explains who sees the details and how to be removed. */
    consent: z.literal(true, { error: 'Consent is required to join the alumni network' }),
    [HONEYPOT_FIELD]: honeypot,
  })
}

export type FeedbackInput = z.infer<typeof feedbackInputSchema>
export type AlumniInput = z.infer<ReturnType<typeof alumniInputSchema>>

export type NewFeedback = {
  category: FeedbackInput['category']
  message: string
  contactEmail?: string
}

export type NewAlumnus = {
  name: string
  graduationYear: number
  email: string
  phone?: string
  interests: AlumniInput['interests']
  consentAt: Date
}

/** The fields that are stored: never the honeypot. */
export function toNewFeedback({ category, message, contactEmail }: FeedbackInput): NewFeedback {
  return contactEmail ? { category, message, contactEmail } : { category, message }
}

/** The fields that are stored: the consent flag becomes the time consent was given. */
export function toNewAlumnus(input: AlumniInput, consentAt: Date): NewAlumnus {
  const { name, graduationYear, email, phone, interests } = input
  return { name, graduationYear, email, ...(phone ? { phone } : {}), interests, consentAt }
}

/** Where submissions are written. MongoDB in the app; an in-memory list in tests. */
export type SubmissionStore = {
  saveFeedback(feedback: NewFeedback): Promise<void>
  /** Adds the alumnus, or updates the details for an email already on the list. */
  saveAlumnus(alumnus: NewAlumnus): Promise<void>
}

export const isBot = (input: { [HONEYPOT_FIELD]?: string }) => !!input[HONEYPOT_FIELD]?.trim()
