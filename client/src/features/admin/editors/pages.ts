import {
  cell,
  checkCommon,
  placeholderBody,
  type ResourceConfig,
  rows,
  str,
  text,
} from './types.ts'
import { PageFields } from './DocumentFields.tsx'

/** Where each constitution-derived page shows on the site (client/src/app/routes.tsx). */
export const PAGE_PATHS: Record<string, string> = {
  'who-we-are': '/about',
  'membership-and-rights': '/about/membership',
  governance: '/governance',
  'executive-council': '/leadership/executive-council',
  senate: '/leadership/senate',
  elections: '/governance/elections',
  'finance-and-accountability': '/governance/finance',
  'meetings-and-procedures': '/governance/meetings',
  'student-support': '/academics/student-support',
  constitution: '/governance/constitution',
  contact: '/connect/contact',
}

/** "Art. 19", "Art. 4 S.B", "Art. 8 S.C Ss(ix)" or "Preamble" (same rule as the API). */
export const ARTICLE_REF = /^(Preamble|Art\. \d+( S\.[A-Z](-[A-Z])?)?( Ss\([ivx]+\))?)$/

const refsOf = (value: string) =>
  value
    .split(',')
    .map((r) => r.trim())
    .filter(Boolean)

export const pages: ResourceConfig = {
  name: 'pages',
  singular: 'Page',
  plural: 'Pages',
  group: 'Pages & documents',
  intro: 'About, governance and other pages based on the constitution.',
  canCreate: false,
  canDelete: false,
  empty: () => ({ title: '', sections: [], isPlaceholder: false, placeholderNote: '' }),
  fromRecord: (r) => ({
    title: text(r.title),
    sections: Array.isArray(r.sections)
      ? r.sections.map((s: Record<string, unknown>) => ({
          heading: text(s.heading),
          bodyMarkdown: text(s.bodyMarkdown),
          articleRefs: Array.isArray(s.articleRefs) ? s.articleRefs.join(', ') : '',
        }))
      : [],
    isPlaceholder: r.isPlaceholder === true,
    placeholderNote: text(r.placeholderNote),
  }),
  check: (form) => {
    const errors: Record<string, string> = {}
    if (!str(form, 'title').trim()) errors.title = 'Add a title.'
    const sections = rows(form, 'sections')
    if (sections.length === 0) errors.sections = 'A page needs at least one section.'
    sections.some((s, i) => {
      const n = i + 1
      if (!cell(s, 'heading').trim()) errors.sections = `Section ${n} needs a heading.`
      else if (!cell(s, 'bodyMarkdown').trim()) errors.sections = `Section ${n} needs some text.`
      else {
        const bad = refsOf(cell(s, 'articleRefs')).find((r) => !ARTICLE_REF.test(r))
        if (bad)
          errors.sections = `Section ${n}: “${bad}” isn’t an article reference. Write it like “Art. 19” or “Art. 4 S.B”.`
      }
      return !!errors.sections
    })
    return { ...errors, ...checkCommon(form, []) }
  },
  toBody: (form) => ({
    title: str(form, 'title').trim(),
    sections: rows(form, 'sections').map((s) => ({
      heading: cell(s, 'heading').trim(),
      bodyMarkdown: cell(s, 'bodyMarkdown').trim(),
      articleRefs: refsOf(cell(s, 'articleRefs')),
    })),
    ...placeholderBody(form),
  }),
  fieldFor: (path) => path,
  labels: { title: 'Title', sections: 'Sections', placeholderNote: 'What’s missing?' },
  Fields: PageFields,
  rowTitle: (r) => text(r.title),
  rowDetail: (r) =>
    [
      PAGE_PATHS[text(r.slug)] ?? '',
      Array.isArray(r.sections) ? `${r.sections.length} sections` : '',
    ]
      .filter(Boolean)
      .join(' · '),
  publicPath: (r) => PAGE_PATHS[text(r.slug)] ?? null,
}
