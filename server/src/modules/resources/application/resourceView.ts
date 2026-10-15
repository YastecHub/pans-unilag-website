import { type PlaceholderView, placeholderView } from '../../../lib/publicView.js'
import { LEVELS } from '../../../lib/validators.js'
import { SEMESTERS } from '../infrastructure/resource.model.js'

export type Level = (typeof LEVELS)[number]
export type Semester = (typeof SEMESTERS)[number]

export type StoredResource = {
  _id?: unknown
  title: string
  level: Level
  semester: Semester
  course?: string
  description?: string
  url?: string
  verifiedBy?: string
  isPlaceholder?: boolean
  placeholderNote?: string
}

export type ResourceView = PlaceholderView & {
  id: string
  title: string
  level: Level
  semester: Semester
  course: string
  description: string
  url: string
  verifiedBy: string
}

export function toResourceView(r: StoredResource): ResourceView {
  return {
    id: String(r._id ?? ''),
    title: r.title,
    level: r.level,
    semester: r.semester,
    course: r.course ?? '',
    description: r.description ?? '',
    url: r.url ?? '',
    verifiedBy: r.verifiedBy ?? '',
    ...placeholderView(r),
  }
}

/** By level (100L first), semester (first, second), course code, then title. */
export function compareResources(a: ResourceView, b: ResourceView): number {
  return (
    LEVELS.indexOf(a.level) - LEVELS.indexOf(b.level) ||
    SEMESTERS.indexOf(a.semester) - SEMESTERS.indexOf(b.semester) ||
    a.course.localeCompare(b.course, undefined, { numeric: true }) ||
    a.title.localeCompare(b.title)
  )
}

export type ResourceReader = {
  list(filter: { level?: Level; semester?: Semester }): Promise<StoredResource[]>
}
