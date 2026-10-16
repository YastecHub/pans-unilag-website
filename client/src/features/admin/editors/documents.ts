import { DocumentFields, PublicationFields } from './DocumentFields.tsx'
import { PUBLICATION_SERIES } from './lists.ts'
import { lagosStart, splitLagos } from './lagos.ts'
import {
  checkCommon,
  checkTitleSlug,
  HTTPS_LINK,
  placeholderBody,
  type ResourceConfig,
  str,
  text,
  toNumber,
} from './types.ts'

const MB = 1024 * 1024

export const publications: ResourceConfig = {
  name: 'publications',
  singular: 'Publication',
  plural: 'Publications',
  group: 'Pages & documents',
  intro: 'Recipharm editions, the newspaper and the Substack, from the Editorial Board.',
  empty: () => ({
    title: '',
    slug: '',
    slugEdited: false,
    series: '',
    edition: '',
    publishedOn: '',
    summary: '',
    cover: '',
    fileUrl: '',
    link: '',
    isPlaceholder: false,
    placeholderNote: '',
  }),
  fromRecord: (r) => ({
    title: text(r.title),
    slug: text(r.slug),
    slugEdited: true,
    series: text(r.series),
    edition: text(r.edition),
    publishedOn: splitLagos(r.publishedOn).date,
    summary: text(r.summary),
    cover: text(r.cover),
    fileUrl: text(r.fileUrl),
    link: text(r.link),
    isPlaceholder: r.isPlaceholder === true,
    placeholderNote: text(r.placeholderNote),
  }),
  check: (form) => {
    const errors = checkTitleSlug(form, 'recipharm-2026')
    if (!str(form, 'series')) errors.series = 'Choose the series.'
    if (!str(form, 'fileUrl').trim() && !str(form, 'link').trim() && !form.isPlaceholder)
      errors.fileUrl =
        'Add the PDF link or the page link, or tick “Still waiting for some details”.'
    return {
      ...errors,
      ...checkCommon(form, [
        { field: 'fileUrl', label: 'PDF link' },
        { field: 'link', label: 'page link' },
      ]),
    }
  },
  toBody: (form, isNew) => {
    const published = str(form, 'publishedOn')
    return {
      title: str(form, 'title').trim(),
      slug: str(form, 'slug'),
      series: str(form, 'series'),
      edition: str(form, 'edition').trim(),
      ...(published ? { publishedOn: lagosStart(published) } : isNew ? {} : { publishedOn: null }),
      summary: str(form, 'summary').trim(),
      cover: str(form, 'cover'),
      fileUrl: str(form, 'fileUrl').trim(),
      link: str(form, 'link').trim(),
      ...placeholderBody(form),
    }
  },
  fieldFor: (path) => path,
  labels: {
    title: 'Title',
    slug: 'Web address',
    series: 'Series',
    publishedOn: 'Published on',
    fileUrl: 'PDF link',
    link: 'Page link',
    placeholderNote: 'What’s missing?',
  },
  Fields: PublicationFields,
  rowTitle: (r) => text(r.title),
  rowDetail: (r) =>
    [
      PUBLICATION_SERIES.find((s) => s.value === r.series)?.label.replace(/ \(.*\)$/, '') ?? '',
      text(r.edition),
    ]
      .filter(Boolean)
      .join(' · '),
  publicPath: () => '/publications',
}

export const documents: ResourceConfig = {
  name: 'documents',
  singular: 'Document',
  plural: 'Documents',
  group: 'Pages & documents',
  intro: 'The constitution and other approved documents. Add each new version as a new document.',
  empty: () => ({
    title: '',
    slug: '',
    slugEdited: false,
    version: '',
    approvedOn: '',
    approvedBy: '',
    summary: '',
    fileUrl: '',
    fileSizeMb: '',
    pageCount: '',
    isPlaceholder: false,
    placeholderNote: '',
  }),
  fromRecord: (r) => ({
    title: text(r.title),
    slug: text(r.slug),
    slugEdited: true,
    version: text(r.version),
    approvedOn: splitLagos(r.approvedOn).date,
    approvedBy: text(r.approvedBy),
    summary: text(r.summary),
    fileUrl: text(r.fileUrl),
    fileSizeMb:
      typeof r.fileSizeBytes === 'number'
        ? String(Math.round((r.fileSizeBytes / MB) * 10) / 10)
        : '',
    pageCount: typeof r.pageCount === 'number' ? String(r.pageCount) : '',
    isPlaceholder: r.isPlaceholder === true,
    placeholderNote: text(r.placeholderNote),
  }),
  check: (form) => {
    const errors = checkTitleSlug(form, 'constitution')
    if (!str(form, 'version').trim())
      errors.version = 'Add the version, e.g. the year it was adopted.'
    if (!str(form, 'approvedOn')) errors.approvedOn = 'Choose the day it was approved.'
    const size = str(form, 'fileSizeMb').trim()
    if (size && (toNumber(size) === undefined || toNumber(size)! <= 0))
      errors.fileSizeMb = 'A number of megabytes, e.g. 7.1.'
    const pages = str(form, 'pageCount').trim()
    if (pages && !(Number.isInteger(toNumber(pages)) && toNumber(pages)! >= 1))
      errors.pageCount = 'A whole number of pages, e.g. 55.'
    const file = str(form, 'fileUrl').trim()
    if (file && !HTTPS_LINK.test(file)) errors.fileUrl = 'The PDF link must start with https://.'
    else if (!file && !form.isPlaceholder)
      errors.fileUrl = 'Add the PDF link, or tick “Still waiting for some details”.'
    return { ...errors, ...checkCommon(form, []) }
  },
  toBody: (form) => {
    const size = toNumber(str(form, 'fileSizeMb'))
    const pages = toNumber(str(form, 'pageCount'))
    return {
      title: str(form, 'title').trim(),
      slug: str(form, 'slug'),
      version: str(form, 'version').trim(),
      approvedOn: lagosStart(str(form, 'approvedOn')),
      approvedBy: str(form, 'approvedBy').trim(),
      summary: str(form, 'summary').trim(),
      fileUrl: str(form, 'fileUrl').trim(),
      fileSizeBytes: size === undefined ? null : Math.round(size * MB),
      pageCount: pages === undefined ? null : pages,
      ...placeholderBody(form),
    }
  },
  fieldFor: (path) => ({ fileSizeBytes: 'fileSizeMb' })[path] ?? path,
  conflicts: {
    slug: 'This document already has a version with that name. Use a new version.',
    version: 'This document already has a version with that name. Use a new version.',
  },
  labels: {
    title: 'Title',
    slug: 'Web address',
    version: 'Version',
    approvedOn: 'Approved on',
    fileUrl: 'PDF link',
    fileSizeMb: 'File size',
    pageCount: 'Pages',
    placeholderNote: 'What’s missing?',
  },
  Fields: DocumentFields,
  rowTitle: (r) => text(r.title),
  rowDetail: (r) => [`Version ${text(r.version)}`, text(r.approvedBy)].filter(Boolean).join(' · '),
  publicPath: (r) => (text(r.slug) === 'constitution' ? '/governance/constitution' : null),
}
