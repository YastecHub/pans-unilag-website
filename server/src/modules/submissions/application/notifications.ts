import type { Logger } from '../../../lib/logger.js'
import type { NewAlumnus, NewFeedback } from './submissionRules.js'

/** One email: plain text only, so nothing a visitor types can become a link or markup. */
export type SubmissionEmail = {
  subject: string
  text: string
  /** Replying goes to the person who wrote in, when they left an email. */
  replyTo?: string
}

/**
 * Tells PANS about a new submission (the official inbox, by email). Sent after the entry is
 * saved; the dashboard stays the record. Without email settings nothing is sent.
 */
export type SubmissionNotifier = {
  feedback(feedback: NewFeedback): Promise<void>
  alumnus(alumnus: NewAlumnus): Promise<void>
}

export const noNotifier: SubmissionNotifier = {
  feedback: async () => undefined,
  alumnus: async () => undefined,
}

const CATEGORY_LABELS: Record<NewFeedback['category'], string> = {
  suggestion: 'Suggestion',
  complaint: 'Complaint',
  welfare: 'Welfare concern',
  other: 'Other',
}

const INTEREST_LABELS: Record<NewAlumnus['interests'][number], string> = {
  mentoring: 'Mentoring students',
  speaking: 'Speaking at events',
  'internships-and-jobs': 'Internships and jobs',
  events: 'Coming to events',
  'supporting-pans': 'Supporting PANS',
}

/** Subjects are one line, however the visitor typed their name. */
const oneLine = (text: string) => text.replace(/\s+/g, ' ').trim()

const FOOTER =
  'Sent automatically by the PANS UNILAG website. This is personal information: keep it within ' +
  'the executive team, and delete this email once it has been dealt with.'

export function feedbackEmail(feedback: NewFeedback, siteUrl: string): SubmissionEmail {
  const category = CATEGORY_LABELS[feedback.category]
  return {
    subject: `New feedback on the PANS website: ${category}`,
    text: [
      `Category: ${category}`,
      `From: ${feedback.contactEmail ?? 'Anonymous (no email left)'}`,
      '',
      feedback.message,
      '',
      feedback.contactEmail
        ? 'Reply to this email to answer them from the PANS inbox.'
        : 'They chose to stay anonymous, so there is no one to reply to.',
      `Mark it read or resolved in the dashboard: ${siteUrl}/admin/feedback`,
      '',
      FOOTER,
    ].join('\n'),
    ...(feedback.contactEmail ? { replyTo: feedback.contactEmail } : {}),
  }
}

export function alumnusEmail(alumnus: NewAlumnus, siteUrl: string): SubmissionEmail {
  const interests = alumnus.interests.map((i) => INTEREST_LABELS[i]).join(', ')
  return {
    subject: oneLine(`New alumni sign-up: ${alumnus.name} (graduated ${alumnus.graduationYear})`),
    text: [
      `Name: ${alumnus.name}`,
      `Graduated: ${alumnus.graduationYear}`,
      `Email: ${alumnus.email}`,
      `Phone: ${alumnus.phone ?? 'Not given'}`,
      `How they'd like to help: ${interests || 'Not said'}`,
      `Consent given: ${alumnus.consentAt.toISOString()}`,
      '',
      'If this email is already on the list, they updated their details.',
      'For the Alumni Network Committee: reply to this email to write to them.',
      `Everyone who has signed up: ${siteUrl}/admin/alumni`,
      '',
      FOOTER,
    ].join('\n'),
    replyTo: alumnus.email,
  }
}

/**
 * Sends each email through `send`, but never lets email trouble reach the visitor: the entry is
 * already saved, so a failure is logged and the form still says "received".
 */
export function emailNotifier(
  send: (email: SubmissionEmail) => Promise<void>,
  siteUrl: string,
  logger: Logger,
): SubmissionNotifier {
  const safely = async (kind: string, email: SubmissionEmail) => {
    try {
      await send(email)
    } catch (error) {
      logger.warn(`Could not email the PANS inbox about new ${kind}`, {
        error: error instanceof Error ? error.message : String(error),
      })
    }
  }
  const base = siteUrl.replace(/\/+$/, '')
  return {
    feedback: (feedback) => safely('feedback', feedbackEmail(feedback, base)),
    alumnus: (alumnus) => safely('alumni sign-up', alumnusEmail(alumnus, base)),
  }
}
