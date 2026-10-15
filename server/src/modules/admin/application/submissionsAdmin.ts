import type { FEEDBACK_STATUSES } from '../../submissions/infrastructure/feedback.model.js'

export type FeedbackStatus = (typeof FEEDBACK_STATUSES)[number]

export type FeedbackRecord = {
  id: string
  category: string
  message: string
  contactEmail?: string
  status: FeedbackStatus
  createdAt: string
}

export type AlumnusRecord = {
  id: string
  name: string
  graduationYear: number
  email: string
  phone?: string
  interests: string[]
  consentAt: string
  createdAt: string
  updatedAt: string
}

export type Paged<T> = { items: T[]; total: number; page: number; pageSize: number }

/** Reading and managing form submissions (admins only). */
export type SubmissionAdminStore = {
  /** Newest first. */
  listFeedback(filter: {
    status?: FeedbackStatus
    page: number
    pageSize: number
  }): Promise<Paged<FeedbackRecord>>
  setFeedbackStatus(id: string, status: FeedbackStatus): Promise<FeedbackRecord | null>
  /** Newest first. */
  listAlumni(filter: { page: number; pageSize: number }): Promise<Paged<AlumnusRecord>>
  /** For removal requests (the privacy notice promises them). */
  removeAlumnus(id: string): Promise<boolean>
}
