import type { ReactNode } from 'react'
import type { AdminRecord, ResourceName } from './api.ts'

/** One row of a repeatable group (an officer, a page section, a grade), as plain values. */
export type Row = Record<string, string | boolean>

/** What the editor form holds: text boxes, checkboxes and choices as plain values, and row lists. */
export type Form = Record<string, string | boolean | Row[]>

export type FieldsProps = {
  form: Form
  set: (changes: Form) => void
  /** Field id → message, from the form check or the API. */
  errors: Record<string, string>
  isNew: boolean
}

/**
 * Everything the shared list and edit pages need to manage one kind of content. Each resource
 * owns its form layout and how the form converts to and from the API's fields.
 */
export type ResourceConfig = {
  name: ResourceName
  /** "Event": for headings and buttons. */
  singular: string
  /** "Events": the list heading and its link on the Content page. */
  plural: string
  /** One line under the list heading. */
  intro: string
  /** Heading it's listed under on the Content page. */
  group: ContentGroup
  /** false for content the site has a fixed set of (pages, settings): no New button. */
  canCreate?: boolean
  /** false: no Delete section. */
  canDelete?: boolean
  /** One item only (site settings): the list opens it straight away. */
  singleton?: boolean
  /** API field → message when the API says the value is already taken (409). */
  conflicts?: Record<string, string>
  empty: () => Form
  fromRecord: (record: AdminRecord) => Form
  /** Problems the form can spot before sending (field id → message). */
  check: (form: Form) => Record<string, string>
  toBody: (form: Form, isNew: boolean) => Record<string, unknown>
  /** API field ("startsAt") → form field id ("startDate"), for the API's validation messages. */
  fieldFor: (apiPath: string, form: Form) => string
  /** Field id → label, for the error summary. */
  labels: Record<string, string>
  Fields: (props: FieldsProps) => ReactNode
  /** For the list. */
  rowTitle: (record: AdminRecord) => string
  rowDetail: (record: AdminRecord) => string
  /** Where the item shows on the public site, or null if it doesn't have its own page. */
  publicPath: (record: AdminRecord) => string | null
}

export const CONTENT_GROUPS = [
  'News & events',
  'People',
  'Pages & documents',
  'Academics',
  'Site',
] as const
export type ContentGroup = (typeof CONTENT_GROUPS)[number]

export const text = (value: unknown) => (typeof value === 'string' ? value : '')
export const str = (form: Form, key: string) => (typeof form[key] === 'string' ? form[key] : '')
export const bool = (form: Form, key: string) => form[key] === true
export const rows = (form: Form, key: string): Row[] => {
  const value = form[key]
  return Array.isArray(value) ? value : []
}
/** A row's text value. */
export const cell = (row: Row, key: string) => (typeof row[key] === 'string' ? row[key] : '')

/** API list of records → form rows of strings (numbers become text so they can be edited). */
export function toRows(value: unknown, keys: string[]): Row[] {
  if (!Array.isArray(value)) return []
  return value.map((item: Record<string, unknown>) =>
    Object.fromEntries(
      keys.map((k) => [k, typeof item?.[k] === 'number' ? String(item[k]) : text(item?.[k])]),
    ),
  )
}

/** "One per line" text box ↔ a list of strings. */
export const linesToList = (value: string) =>
  value
    .split('\n')
    .map((line) => line.replace(/^\s*[-*•]\s*/, '').trim())
    .filter(Boolean)
export const listToLines = (value: unknown) =>
  Array.isArray(value) ? value.filter((v) => typeof v === 'string').join('\n') : ''

/** A number typed in a text box, or undefined when it isn't one. */
export function toNumber(value: string): number | undefined {
  const t = value.trim()
  if (!t || !/^-?\d+(\.\d+)?$/.test(t)) return undefined
  return Number(t)
}

const HTTPS = /^https:\/\/\S+$/

/** Checks shared by every resource: an https link and a placeholder note when kept as one. */
export function checkCommon(
  form: Form,
  links: { field: string; required?: boolean; label: string }[],
): Record<string, string> {
  const errors: Record<string, string> = {}
  for (const link of links) {
    const value = str(form, link.field).trim()
    if (!value && link.required && !bool(form, 'isPlaceholder'))
      errors[link.field] = `Add the ${link.label} (it must start with https://).`
    else if (value && !HTTPS.test(value))
      errors[link.field] = `The ${link.label} must start with https://.`
  }
  if (bool(form, 'isPlaceholder') && !str(form, 'placeholderNote').trim())
    errors.placeholderNote = 'Say what’s still missing, e.g. “Venue to be confirmed”.'
  return errors
}

/** The placeholder fields for the API: kept only when the editor ticks the box. */
export function placeholderBody(form: Form): Record<string, unknown> {
  return bool(form, 'isPlaceholder')
    ? { isPlaceholder: true, placeholderNote: str(form, 'placeholderNote').trim() }
    : {}
}

/** A web address name the API accepts: lower-case words joined by hyphens. */
export const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/

export const SLUG_MESSAGE = 'Use lower-case letters and numbers joined by hyphens, e.g. '

/** Title and web address checks most resources share. */
export function checkTitleSlug(
  form: Form,
  example: string,
  titleKey = 'title',
): Record<string, string> {
  const errors: Record<string, string> = {}
  if (!str(form, titleKey).trim()) errors[titleKey] = 'Add a title.'
  if (!SLUG.test(str(form, 'slug'))) errors.slug = `${SLUG_MESSAGE}${example}.`
  return errors
}

export const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
export const HTTPS_LINK = /^https:\/\/\S+$/

/** "2026/2027": the second year follows the first. */
export function isSession(value: string): boolean {
  const match = /^(\d{4})\/(\d{4})$/.exec(value)
  return !!match && Number(match[2]) === Number(match[1]) + 1
}

export { LEVELS } from '../../academics/resources/api.ts'

/** The session running now: a new one starts in September (Lagos time). */
export function currentSession(now = new Date()): string {
  const lagos = new Date(now.getTime() + 60 * 60 * 1000)
  const year = lagos.getUTCFullYear()
  const start = lagos.getUTCMonth() >= 8 ? year : year - 1
  return `${start}/${start + 1}`
}

/** "2026/2027" → "2026-2027", as in the Cloudinary folders. */
export const sessionFolder = (session: string) => session.replace('/', '-')

export const SESSION_MESSAGE = 'Write the session as two years, e.g. 2026/2027.'

/** Words in a text, for bio limits. */
export const wordCount = (value: string) => (value.trim() ? value.trim().split(/\s+/).length : 0)

export type Option = { value: string; label: string }
export const options = (values: readonly string[]): Option[] =>
  values.map((v) => ({ value: v, label: v }))

/** How exact an event's dates are (README → Upcoming events). */
export type Precision = 'day' | 'month' | 'unknown'
export const precision = (form: Form) => (str(form, 'datePrecision') || 'day') as Precision
