import { CommitteeFields } from './CommitteeFields.tsx'
import {
  cell,
  checkCommon,
  currentSession,
  isSession,
  linesToList,
  listToLines,
  placeholderBody,
  type ResourceConfig,
  rows,
  SESSION_MESSAGE,
  SLUG,
  SLUG_MESSAGE,
  str,
  text,
  toNumber,
  toRows,
} from './types.ts'

export const OFFICER_KEYS = ['title', 'name', 'level']

export const committees: ResourceConfig = {
  name: 'committees',
  singular: 'Committee',
  plural: 'Committees',
  group: 'People',
  intro: 'Each committee’s page: what it does, its officers, activities and plans.',
  empty: () => ({
    name: '',
    shortName: '',
    slug: '',
    slugEdited: false,
    session: currentSession(),
    order: '',
    motto: '',
    description: '',
    activities: '',
    achievements: '',
    plans: '',
    officers: [
      { title: 'Lead', name: '', level: '' },
      { title: 'Assistant', name: '', level: '' },
    ],
    coverImage: '',
    isPlaceholder: false,
    placeholderNote: '',
  }),
  fromRecord: (r) => ({
    name: text(r.name),
    shortName: text(r.shortName),
    slug: text(r.slug),
    slugEdited: true,
    session: text(r.session),
    order: typeof r.order === 'number' ? String(r.order) : '',
    motto: text(r.motto),
    description: text(r.description),
    activities: listToLines(r.activities),
    achievements: listToLines(r.achievements),
    plans: listToLines(r.plans),
    officers: toRows(r.officers, OFFICER_KEYS),
    coverImage: text(r.coverImage),
    isPlaceholder: r.isPlaceholder === true,
    placeholderNote: text(r.placeholderNote),
  }),
  check: (form) => {
    const errors: Record<string, string> = {}
    if (!str(form, 'name').trim()) errors.name = 'Add the committee’s full name.'
    if (!str(form, 'shortName').trim())
      errors.shortName = 'Add a short name for menus and cards, e.g. ADMAP.'
    if (!SLUG.test(str(form, 'slug'))) errors.slug = `${SLUG_MESSAGE}admap.`
    if (!isSession(str(form, 'session').trim())) errors.session = SESSION_MESSAGE
    const order = toNumber(str(form, 'order'))
    if (order === undefined || !Number.isInteger(order) || order < 1 || order > 100)
      errors.order = 'A whole number from 1 to 100.'
    if (!str(form, 'description').trim() && !form.isPlaceholder)
      errors.description = 'Add the description, or tick “Still waiting for some details”.'
    const missing = rows(form, 'officers').findIndex(
      (o) => !cell(o, 'title').trim() || !cell(o, 'name').trim(),
    )
    if (missing >= 0) errors.officers = `Officer ${missing + 1} needs a title and a name.`
    return { ...errors, ...checkCommon(form, []) }
  },
  toBody: (form) => ({
    name: str(form, 'name').trim(),
    shortName: str(form, 'shortName').trim(),
    slug: str(form, 'slug'),
    session: str(form, 'session').trim(),
    order: toNumber(str(form, 'order')),
    motto: str(form, 'motto').trim(),
    description: str(form, 'description').trim(),
    activities: linesToList(str(form, 'activities')),
    achievements: linesToList(str(form, 'achievements')),
    plans: linesToList(str(form, 'plans')),
    officers: rows(form, 'officers').map((o) => ({
      title: cell(o, 'title').trim(),
      name: cell(o, 'name').trim(),
      level: cell(o, 'level'),
    })),
    coverImage: str(form, 'coverImage'),
    ...placeholderBody(form),
  }),
  fieldFor: (path) => path,
  labels: {
    name: 'Name',
    shortName: 'Short name',
    slug: 'Web address',
    session: 'Session',
    order: 'Position in the list',
    description: 'Description',
    activities: 'Activities',
    achievements: 'Achievements',
    plans: 'Plans',
    officers: 'Officers',
    coverImage: 'Cover photo',
    placeholderNote: 'What’s missing?',
  },
  Fields: CommitteeFields,
  rowTitle: (r) => text(r.name),
  rowDetail: (r) =>
    [
      text(r.session),
      Array.isArray(r.officers) ? `${r.officers.length} officers` : '',
      typeof r.order === 'number' ? `#${r.order}` : '',
    ]
      .filter(Boolean)
      .join(' · '),
  publicPath: (r) => `/leadership/committees/${text(r.slug)}`,
}
