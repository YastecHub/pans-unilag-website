import type { ReactNode } from 'react'
import type { AdminRecord, ResourceName } from './api.ts'

/** What the editor form holds: text boxes, checkboxes and choices, all as plain values. */
export type Form = Record<string, string | boolean>

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
  /** "Events": the admin tab and list heading. */
  plural: string
  /** One line under the list heading. */
  intro: string
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

export const text = (value: unknown) => (typeof value === 'string' ? value : '')
export const str = (form: Form, key: string) => (typeof form[key] === 'string' ? form[key] : '')
export const bool = (form: Form, key: string) => form[key] === true

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

/** How exact an event's dates are (README → Upcoming events). */
export type Precision = 'day' | 'month' | 'unknown'
export const precision = (form: Form) => (str(form, 'datePrecision') || 'day') as Precision
