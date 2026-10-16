import { formatDate, lagosDay } from '../../../lib/dates.ts'
import { OPPORTUNITY_TYPE_LABELS } from '../../opportunities/api/opportunities.ts'
import { lagosEnd, lagosStart, splitLagos } from './lagos.ts'
import { checkCommon, placeholderBody, type ResourceConfig, str, text, SLUG } from './types.ts'
import { OpportunityFields } from './OpportunityFields.tsx'

export const opportunities: ResourceConfig = {
  name: 'opportunities',
  singular: 'Opportunity',
  plural: 'Opportunities',
  intro:
    'The Opportunities hub, run by CPD & CBC. Listings disappear from the site the day after their deadline.',
  empty: () => ({
    title: '',
    slug: '',
    slugEdited: false,
    type: '',
    organisation: '',
    applyUrl: '',
    deadline: '',
    eligibility: '',
    description: '',
    // New listings are checked today by whoever adds them.
    lastChecked: lagosDay(new Date()),
    isPlaceholder: false,
    placeholderNote: '',
  }),
  fromRecord: (r) => ({
    title: text(r.title),
    slug: text(r.slug),
    slugEdited: true,
    type: text(r.type),
    organisation: text(r.organisation),
    applyUrl: text(r.applyUrl),
    deadline: splitLagos(r.deadline).date,
    eligibility: text(r.eligibility),
    description: text(r.description),
    lastChecked: splitLagos(r.lastCheckedAt).date,
    isPlaceholder: r.isPlaceholder === true,
    placeholderNote: text(r.placeholderNote),
  }),
  check: (form) => {
    const errors: Record<string, string> = {}
    if (!str(form, 'title').trim()) errors.title = 'Add a title.'
    if (!SLUG.test(str(form, 'slug')))
      errors.slug =
        'Use lower-case letters and numbers joined by hyphens, e.g. emzor-internship-2026.'
    if (!str(form, 'type')) errors.type = 'Choose a type.'
    return {
      ...errors,
      ...checkCommon(form, [{ field: 'applyUrl', label: 'apply link', required: true }]),
    }
  },
  toBody: (form, isNew) => {
    const deadline = str(form, 'deadline')
    const checked = str(form, 'lastChecked')
    return {
      slug: str(form, 'slug'),
      title: str(form, 'title').trim(),
      type: str(form, 'type'),
      organisation: str(form, 'organisation').trim(),
      applyUrl: str(form, 'applyUrl').trim(),
      ...(deadline ? { deadline: lagosEnd(deadline) } : isNew ? {} : { deadline: null }),
      eligibility: str(form, 'eligibility').trim(),
      description: str(form, 'description').trim(),
      ...(checked ? { lastCheckedAt: lagosStart(checked) } : isNew ? {} : { lastCheckedAt: null }),
      ...placeholderBody(form),
    }
  },
  fieldFor: (path) => ({ lastCheckedAt: 'lastChecked' })[path] ?? path,
  labels: {
    title: 'Title',
    slug: 'Web address',
    type: 'Type',
    applyUrl: 'Apply link',
    deadline: 'Deadline',
    lastChecked: 'Details checked on',
    placeholderNote: 'What’s missing?',
  },
  Fields: OpportunityFields,
  rowTitle: (r) => text(r.title),
  rowDetail: (r) =>
    [
      OPPORTUNITY_TYPE_LABELS[text(r.type) as keyof typeof OPPORTUNITY_TYPE_LABELS] ?? '',
      text(r.organisation),
      typeof r.deadline === 'string' ? `Closes ${formatDate(r.deadline)}` : 'Rolling',
    ]
      .filter(Boolean)
      .join(' · '),
  publicPath: (r) => `/opportunities/${text(r.slug)}`,
}
