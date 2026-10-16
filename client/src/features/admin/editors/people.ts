import { BIO_WORDS } from './lists.ts'
import { ExecutiveFields, PatronFields, SenatorFields } from './PeopleFields.tsx'
import {
  bool,
  checkCommon,
  currentSession,
  EMAIL,
  isSession,
  placeholderBody,
  type ResourceConfig,
  SESSION_MESSAGE,
  str,
  text,
  toNumber,
  wordCount,
} from './types.ts'

const personCheck = (form: Parameters<ResourceConfig['check']>[0], roleKey: string) => {
  const errors: Record<string, string> = {}
  if (!isSession(str(form, 'session').trim())) errors.session = SESSION_MESSAGE
  if (!str(form, roleKey)) errors[roleKey] = 'Choose one.'
  if (!str(form, 'name').trim()) errors.name = 'Add their name, or “To be announced”.'
  return errors
}

const sameSeat = 'Someone already holds this for that session. Edit their entry instead.'

export const executives: ResourceConfig = {
  name: 'executives',
  singular: 'Executive',
  plural: 'Executive Council',
  group: 'People',
  intro: 'The 14 officers for each session, with bios, photos and role emails.',
  empty: () => ({
    session: currentSession(),
    office: '',
    name: '',
    level: '',
    bio: '',
    photo: '',
    roleEmail: '',
    isPlaceholder: false,
    placeholderNote: '',
  }),
  fromRecord: (r) => ({
    session: text(r.session),
    office: text(r.office),
    name: text(r.name),
    level: text(r.level),
    bio: text(r.bio),
    photo: text(r.photo),
    roleEmail: text(r.roleEmail),
    isPlaceholder: r.isPlaceholder === true,
    placeholderNote: text(r.placeholderNote),
  }),
  check: (form) => {
    const errors = personCheck(form, 'office')
    if (wordCount(str(form, 'bio')) > BIO_WORDS)
      errors.bio = `Keep the bio to ${BIO_WORDS} words or fewer (it’s ${wordCount(str(form, 'bio'))}).`
    const email = str(form, 'roleEmail').trim()
    if (email && !EMAIL.test(email)) errors.roleEmail = 'Enter an email address, e.g. pro@pans.ng.'
    return { ...errors, ...checkCommon(form, []) }
  },
  toBody: (form) => ({
    session: str(form, 'session').trim(),
    office: str(form, 'office'),
    name: str(form, 'name').trim(),
    level: str(form, 'level'),
    bio: str(form, 'bio').trim(),
    photo: str(form, 'photo'),
    roleEmail: str(form, 'roleEmail').trim(),
    ...placeholderBody(form),
  }),
  fieldFor: (path) => path,
  conflicts: { session: sameSeat, office: sameSeat },
  labels: {
    session: 'Session',
    office: 'Office',
    name: 'Name',
    bio: 'Bio',
    photo: 'Photo',
    roleEmail: 'Role email',
    placeholderNote: 'What’s missing?',
  },
  Fields: ExecutiveFields,
  rowTitle: (r) => [text(r.office), text(r.name)].filter(Boolean).join(': '),
  rowDetail: (r) => [text(r.session), text(r.level)].filter(Boolean).join(' · '),
  publicPath: () => '/leadership/executive-council',
}

export const senators: ResourceConfig = {
  name: 'senators',
  singular: 'Senator',
  plural: 'Senate',
  group: 'People',
  intro: 'The Senate’s four principal officers for each session.',
  empty: () => ({
    session: currentSession(),
    position: '',
    name: '',
    level: '',
    isPlaceholder: false,
    placeholderNote: '',
  }),
  fromRecord: (r) => ({
    session: text(r.session),
    position: text(r.position),
    name: text(r.name),
    level: text(r.level),
    isPlaceholder: r.isPlaceholder === true,
    placeholderNote: text(r.placeholderNote),
  }),
  check: (form) => ({ ...personCheck(form, 'position'), ...checkCommon(form, []) }),
  toBody: (form) => ({
    session: str(form, 'session').trim(),
    position: str(form, 'position'),
    name: str(form, 'name').trim(),
    level: str(form, 'level'),
    ...placeholderBody(form),
  }),
  fieldFor: (path) => path,
  conflicts: { session: sameSeat, position: sameSeat },
  labels: {
    session: 'Session',
    position: 'Position',
    name: 'Name',
    placeholderNote: 'What’s missing?',
  },
  Fields: SenatorFields,
  rowTitle: (r) => [text(r.position), text(r.name)].filter(Boolean).join(': '),
  rowDetail: (r) => [text(r.session), text(r.level)].filter(Boolean).join(' · '),
  publicPath: () => '/leadership/senate',
}

export const patrons: ResourceConfig = {
  name: 'patrons',
  singular: 'Patron',
  plural: 'Patrons',
  group: 'People',
  intro: 'The Dean of the Faculty and the association’s other patrons.',
  empty: () => ({
    name: '',
    title: 'Patron',
    order: '',
    isDean: false,
    isPlaceholder: false,
    placeholderNote: '',
  }),
  fromRecord: (r) => ({
    name: text(r.name),
    title: text(r.title),
    order: typeof r.order === 'number' ? String(r.order) : '',
    isDean: r.isDean === true,
    isPlaceholder: r.isPlaceholder === true,
    placeholderNote: text(r.placeholderNote),
  }),
  check: (form) => {
    const errors: Record<string, string> = {}
    if (!str(form, 'name').trim()) errors.name = 'Add their name, or “Name to be announced”.'
    if (!str(form, 'title').trim()) errors.title = 'Add their role.'
    const order = toNumber(str(form, 'order'))
    if (order === undefined || !Number.isInteger(order) || order < 1 || order > 20)
      errors.order = 'A whole number from 1 to 20.'
    return { ...errors, ...checkCommon(form, []) }
  },
  toBody: (form) => ({
    name: str(form, 'name').trim(),
    title: str(form, 'title').trim(),
    order: toNumber(str(form, 'order')),
    isDean: bool(form, 'isDean'),
    ...placeholderBody(form),
  }),
  fieldFor: (path) => path,
  conflicts: { order: 'Another patron is already in this position. Choose a different number.' },
  labels: {
    name: 'Name',
    title: 'Role',
    order: 'Position in the list',
    placeholderNote: 'What’s missing?',
  },
  Fields: PatronFields,
  rowTitle: (r) => text(r.name),
  rowDetail: (r) =>
    [text(r.title), typeof r.order === 'number' ? `#${r.order}` : ''].filter(Boolean).join(' · '),
  publicPath: () => '/leadership/patrons',
}
