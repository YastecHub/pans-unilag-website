import { useMutation } from '@tanstack/react-query'
import { ApiError, api } from '../../../lib/http.ts'

/**
 * POST /api/feedback and POST /api/alumni (README → Security, privacy and data protection).
 * The rules below mirror the server's (submissionRules.ts) so mistakes are caught before sending;
 * the server checks again and its field errors are shown the same way.
 */

export const FEEDBACK_CATEGORIES = [
  { value: 'suggestion', label: 'A suggestion' },
  { value: 'complaint', label: 'A complaint' },
  { value: 'welfare', label: 'A welfare issue' },
  { value: 'other', label: 'Something else' },
] as const
export type FeedbackCategory = (typeof FEEDBACK_CATEGORIES)[number]['value']

export const ALUMNI_INTERESTS = [
  { value: 'mentoring', label: 'Mentoring students' },
  { value: 'speaking', label: 'Speaking at events' },
  { value: 'internships-and-jobs', label: 'Internships and jobs' },
  { value: 'events', label: 'Coming to events' },
  { value: 'supporting-pans', label: 'Supporting PANS' },
] as const
export type AlumniInterest = (typeof ALUMNI_INTERESTS)[number]['value']

export const MESSAGE_MIN = 10
export const MESSAGE_MAX = 2000
export const FIRST_GRADUATING_YEAR = 1960

/** Hidden spam trap: people never see it; bots that fill it are quietly ignored by the server. */
export const HONEYPOT_FIELD = 'website'

export type FeedbackInput = {
  category: FeedbackCategory
  message: string
  contactEmail?: string
  website?: string
}

export type AlumniInput = {
  name: string
  graduationYear: number
  email: string
  phone?: string
  interests: AlumniInterest[]
  consent: true
  website?: string
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE = /^\+?[\d\s()-]{7,20}$/

/** Field → message. Empty when the form is fine. */
export type FieldErrors = Record<string, string>

export function checkFeedback(f: {
  category: string
  message: string
  anonymous: boolean
  contactEmail: string
}): FieldErrors {
  const errors: FieldErrors = {}
  if (!f.category) errors.category = 'Choose what your message is about.'
  const message = f.message.trim()
  if (message.length < MESSAGE_MIN)
    errors.message = `Please write at least ${MESSAGE_MIN} characters.`
  else if (message.length > MESSAGE_MAX)
    errors.message = `Please keep it under ${MESSAGE_MAX} characters.`
  if (!f.anonymous && !EMAIL.test(f.contactEmail.trim()))
    errors.contactEmail = 'Enter a valid email address, or send anonymously.'
  return errors
}

export function checkAlumni(
  f: {
    name: string
    graduationYear: string
    email: string
    phone: string
    consent: boolean
  },
  currentYear = new Date().getFullYear(),
): FieldErrors {
  const errors: FieldErrors = {}
  const name = f.name.trim()
  if (name.length < 2) errors.name = 'Enter your name.'
  else if (name.length > 120) errors.name = 'Please keep your name under 120 characters.'
  const year = Number(f.graduationYear)
  if (!/^\d{4}$/.test(f.graduationYear.trim()) || year < FIRST_GRADUATING_YEAR)
    errors.graduationYear = `Enter the year you graduated, from ${FIRST_GRADUATING_YEAR}.`
  else if (year > currentYear + 1)
    errors.graduationYear = 'Graduation year cannot be in the future.'
  if (!EMAIL.test(f.email.trim())) errors.email = 'Enter a valid email address.'
  if (f.phone.trim() && !PHONE.test(f.phone.trim())) errors.phone = 'Enter a valid phone number.'
  if (!f.consent) errors.consent = 'Tick the box to agree, so the committee can contact you.'
  return errors
}

/** Field errors the server sent back (VALIDATION_ERROR details), keyed by field name. */
export function serverFieldErrors(error: unknown): FieldErrors {
  if (!(error instanceof ApiError) || error.code !== 'VALIDATION_ERROR') return {}
  const details = Array.isArray(error.details) ? error.details : []
  const errors: FieldErrors = {}
  for (const d of details as { path?: string; message?: string }[]) {
    const field = (d.path ?? '').split('.')[0]
    if (field && d.message && !errors[field]) errors[field] = d.message
  }
  return errors
}

/** A sentence for a failed send (not a field error). */
export function sendErrorMessage(error: unknown): string {
  if (error instanceof ApiError && error.code === 'RATE_LIMITED')
    return 'You’ve sent several messages in a short time. Please wait an hour and try again.'
  if (error instanceof ApiError) return error.message
  return 'Something went wrong. Please try again.'
}

export function useSendFeedback() {
  return useMutation({
    mutationFn: (input: FeedbackInput) => api.post<{ received: true }>('/api/feedback', input),
  })
}

export function useJoinAlumni() {
  return useMutation({
    mutationFn: (input: AlumniInput) => api.post<{ received: true }>('/api/alumni', input),
  })
}
