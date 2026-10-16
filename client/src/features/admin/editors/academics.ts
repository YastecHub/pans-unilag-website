import { isAllowedLink, SEMESTERS } from '../../academics/resources/api.ts'
import { GradingFields, ResourceFields } from './AcademicsFields.tsx'
import {
  bool,
  cell,
  checkCommon,
  HTTPS_LINK,
  placeholderBody,
  type ResourceConfig,
  type Row,
  rows,
  SLUG,
  SLUG_MESSAGE,
  str,
  text,
  toNumber,
  toRows,
} from './types.ts'

export const resources: ResourceConfig = {
  name: 'resources',
  singular: 'Resource',
  plural: 'Academic resources',
  group: 'Academics',
  intro: 'Links checked by the Academics Committee, by level and semester. No pirated books.',
  empty: () => ({
    title: '',
    level: '',
    semester: '',
    course: '',
    description: '',
    url: '',
    verifiedBy: 'Academics Committee',
    isPlaceholder: false,
    placeholderNote: '',
  }),
  fromRecord: (r) => ({
    title: text(r.title),
    level: text(r.level),
    semester: text(r.semester),
    course: text(r.course),
    description: text(r.description),
    url: text(r.url),
    verifiedBy: text(r.verifiedBy),
    isPlaceholder: r.isPlaceholder === true,
    placeholderNote: text(r.placeholderNote),
  }),
  check: (form) => {
    const errors: Record<string, string> = {}
    if (!str(form, 'title').trim()) errors.title = 'Add a title.'
    if (!str(form, 'level')) errors.level = 'Choose the level.'
    if (!str(form, 'semester')) errors.semester = 'Choose the semester.'
    const url = str(form, 'url').trim()
    if (url && HTTPS_LINK.test(url) && !isAllowedLink(url))
      errors.url = 'This site is known for pirated books, so the site can’t link to it.'
    if (!str(form, 'verifiedBy').trim() && !bool(form, 'isPlaceholder'))
      errors.verifiedBy = 'Say who in the Academics Committee checked the link.'
    return {
      ...checkCommon(form, [{ field: 'url', label: 'link', required: true }]),
      ...errors,
    }
  },
  toBody: (form) => ({
    title: str(form, 'title').trim(),
    level: str(form, 'level'),
    semester: str(form, 'semester'),
    course: str(form, 'course').trim().toUpperCase(),
    description: str(form, 'description').trim(),
    url: str(form, 'url').trim(),
    verifiedBy: str(form, 'verifiedBy').trim(),
    ...placeholderBody(form),
  }),
  fieldFor: (path) => path,
  labels: {
    title: 'Title',
    level: 'Level',
    semester: 'Semester',
    url: 'Link',
    verifiedBy: 'Checked by',
    placeholderNote: 'What’s missing?',
  },
  Fields: ResourceFields,
  rowTitle: (r) => text(r.title),
  rowDetail: (r) =>
    [text(r.level), SEMESTERS.find((s) => s.value === r.semester)?.label ?? '', text(r.course)]
      .filter(Boolean)
      .join(' · '),
  publicPath: () => '/academics/resources',
}

type Range = { min: number; max: number }

/** True when the ranges cover [from, to] with no gaps or overlaps at `step` (as the API checks). */
export function coversRange(ranges: Range[], from: number, to: number, step: number): boolean {
  const sorted = [...ranges].sort((a, b) => a.min - b.min)
  if (sorted.length === 0 || sorted[0]!.min !== from || sorted.at(-1)!.max !== to) return false
  return sorted.every(
    (r, i) => r.min <= r.max && (i === 0 || Math.abs(r.min - sorted[i - 1]!.max - step) < 1e-9),
  )
}

const GRADE_KEYS = ['letter', 'min', 'max', 'point']
const BAND_KEYS = ['name', 'min', 'max']

/** Row values as numbers; undefined if any of `keys` isn't a number. */
function numbers(row: Row, keys: string[]): Record<string, number> | undefined {
  const out: Record<string, number> = {}
  for (const k of keys) {
    const n = toNumber(cell(row, k))
    if (n === undefined) return undefined
    out[k] = n
  }
  return out
}

export const gradingScales: ResourceConfig = {
  name: 'gradingscales',
  singular: 'Grading scale',
  plural: 'Grading scale',
  group: 'Academics',
  intro: 'The scores, grade points and pass mark the CGPA calculator uses.',
  empty: () => ({
    slug: '',
    active: false,
    source: '',
    grades: [],
    bands: [],
    passMark: '',
    unitsMin: '1',
    unitsMax: '',
    isPlaceholder: false,
    placeholderNote: '',
  }),
  fromRecord: (r) => {
    const units = (r.units ?? {}) as Partial<Range>
    return {
      slug: text(r.slug),
      active: r.active === true,
      source: text(r.source),
      grades: toRows(r.grades, GRADE_KEYS),
      bands: toRows(r.bands, BAND_KEYS),
      passMark: typeof r.passMark === 'number' ? String(r.passMark) : '',
      unitsMin: typeof units.min === 'number' ? String(units.min) : '',
      unitsMax: typeof units.max === 'number' ? String(units.max) : '',
      isPlaceholder: r.isPlaceholder === true,
      placeholderNote: text(r.placeholderNote),
    }
  },
  check: (form) => {
    const errors: Record<string, string> = {}
    if (!SLUG.test(str(form, 'slug'))) errors.slug = `${SLUG_MESSAGE}faculty-of-pharmacy-5-point.`
    if (!str(form, 'source').trim())
      errors.source = 'Say where the scale comes from, e.g. the handbook section and page.'

    const grades = rows(form, 'grades')
    const badGrade = grades.findIndex(
      (g) => !/^[A-F]$/.test(cell(g, 'letter').trim()) || !numbers(g, ['min', 'max', 'point']),
    )
    if (grades.length === 0) errors.grades = 'Add the grades.'
    else if (badGrade >= 0)
      errors.grades = `Grade ${badGrade + 1} needs a letter from A to F and numbers for its scores and point.`
    else if (
      !coversRange(
        grades.map((g) => numbers(g, ['min', 'max'])! as Range),
        0,
        100,
        1,
      )
    )
      errors.grades =
        'The grades must cover every score from 0 to 100 with no gaps or overlaps, e.g. A 70–100, B 60–69.'
    else if (grades.some((g) => toNumber(cell(g, 'point'))! > 5 || toNumber(cell(g, 'point'))! < 0))
      errors.grades = 'Grade points go from 0 to 5.'

    const bands = rows(form, 'bands')
    const badBand = bands.findIndex((b) => !cell(b, 'name').trim() || !numbers(b, ['min', 'max']))
    if (bands.length === 0) errors.bands = 'Add the results, e.g. Pass and Fail.'
    else if (badBand >= 0) errors.bands = `Result ${badBand + 1} needs a name and two numbers.`
    else if (
      !coversRange(
        bands.map((b) => numbers(b, ['min', 'max'])! as Range),
        0,
        5,
        0.01,
      )
    )
      errors.bands =
        'The results must cover every CGPA from 0.00 to 5.00 with no gaps or overlaps, e.g. Pass 2.40–5.00, Fail 0.00–2.39.'

    const pass = toNumber(str(form, 'passMark'))
    if (pass === undefined || pass < 0 || pass > 5)
      errors.passMark = 'A CGPA from 0 to 5, e.g. 2.4.'
    const min = toNumber(str(form, 'unitsMin'))
    const max = toNumber(str(form, 'unitsMax'))
    if (min === undefined || !Number.isInteger(min) || min < 1)
      errors.unitsMin = 'A whole number, at least 1.'
    if (max === undefined || !Number.isInteger(max) || (min !== undefined && max < min))
      errors.unitsMax = 'A whole number, no less than the fewest units.'
    return { ...errors, ...checkCommon(form, []) }
  },
  toBody: (form) => ({
    slug: str(form, 'slug'),
    active: bool(form, 'active'),
    source: str(form, 'source').trim(),
    grades: rows(form, 'grades').map((g) => ({
      letter: cell(g, 'letter').trim().toUpperCase(),
      ...numbers(g, ['min', 'max', 'point']),
    })),
    bands: rows(form, 'bands').map((b) => ({
      name: cell(b, 'name').trim(),
      ...numbers(b, ['min', 'max']),
    })),
    passMark: toNumber(str(form, 'passMark')),
    units: { min: toNumber(str(form, 'unitsMin')), max: toNumber(str(form, 'unitsMax')) },
    ...placeholderBody(form),
  }),
  fieldFor: (path) => ({ units: 'unitsMin' })[path] ?? path,
  conflicts: {
    active:
      'Another scale is already in use. Open it and untick “Use this scale on the calculator” first.',
  },
  labels: {
    slug: 'Web address',
    source: 'Source',
    grades: 'Grades',
    bands: 'Results',
    passMark: 'Pass mark',
    unitsMin: 'Fewest units',
    unitsMax: 'Most units',
    active: 'Use this scale',
    placeholderNote: 'What’s missing?',
  },
  Fields: GradingFields,
  rowTitle: (r) => text(r.slug),
  rowDetail: (r) => (r.active === true ? 'In use on the calculator' : 'Not in use'),
  publicPath: () => '/academics/cgpa-calculator',
}
