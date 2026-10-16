import { formatDate } from '../../../lib/dates.ts'
import { lagosEnd, lagosStart, splitLagos } from './lagos.ts'
import { bool, checkCommon, placeholderBody, type ResourceConfig, str, text } from './types.ts'
import { AnnouncementFields } from './AnnouncementFields.tsx'

export const announcements: ResourceConfig = {
  name: 'announcements',
  singular: 'Announcement',
  plural: 'Announcements',
  intro: 'Short notices on the home page. Pinned ones show first; expired ones hide themselves.',
  empty: () => ({
    title: '',
    body: '',
    link: '',
    pinned: false,
    publishDate: '',
    publishTime: '',
    expiresDate: '',
    isPlaceholder: false,
    placeholderNote: '',
  }),
  fromRecord: (r) => {
    const publish = splitLagos(r.publishAt)
    return {
      title: text(r.title),
      body: text(r.body),
      link: text(r.link),
      pinned: r.pinned === true,
      publishDate: publish.date,
      publishTime: publish.time,
      expiresDate: splitLagos(r.expiresAt).date,
      isPlaceholder: r.isPlaceholder === true,
      placeholderNote: text(r.placeholderNote),
    }
  },
  check: (form) => {
    const errors: Record<string, string> = {}
    if (!str(form, 'title').trim()) errors.title = 'Add a title.'
    if (!str(form, 'body').trim()) errors.body = 'Write the message.'
    const publish = str(form, 'publishDate')
    const expires = str(form, 'expiresDate')
    if (expires && publish && expires < publish)
      errors.expiresDate = 'This is before the “Show from” date.'
    return { ...errors, ...checkCommon(form, [{ field: 'link', label: 'link' }]) }
  },
  toBody: (form, isNew) => {
    const publish = str(form, 'publishDate')
    const expires = str(form, 'expiresDate')
    return {
      title: str(form, 'title').trim(),
      body: str(form, 'body').trim(),
      link: str(form, 'link').trim(),
      pinned: bool(form, 'pinned'),
      ...(publish ? { publishAt: lagosStart(publish, str(form, 'publishTime')) } : {}),
      ...(expires ? { expiresAt: lagosEnd(expires) } : isNew ? {} : { expiresAt: null }),
      ...placeholderBody(form),
    }
  },
  fieldFor: (path) => ({ publishAt: 'publishDate', expiresAt: 'expiresDate' })[path] ?? path,
  labels: {
    title: 'Title',
    body: 'Message',
    link: '“Read more” link',
    publishDate: 'Show from',
    expiresDate: 'Hide after',
    placeholderNote: 'What’s missing?',
  },
  Fields: AnnouncementFields,
  rowTitle: (r) => text(r.title),
  rowDetail: (r) =>
    [
      r.pinned === true ? 'Pinned' : '',
      typeof r.publishAt === 'string' ? `From ${formatDate(r.publishAt)}` : '',
      typeof r.expiresAt === 'string' ? `until ${formatDate(r.expiresAt)}` : '',
    ]
      .filter(Boolean)
      .join(' · '),
  publicPath: () => '/',
}
