import { AlbumFields, SettingsFields } from './SiteFields.tsx'
import {
  bool,
  cell,
  checkCommon,
  EMAIL,
  HTTPS_LINK,
  placeholderBody,
  type ResourceConfig,
  rows,
  SLUG,
  SLUG_MESSAGE,
  str,
  text,
  toRows,
} from './types.ts'

/** Quick links may point inside the site ("/academics/cgpa-calculator") or to an https page. */
const QUICK_LINK = /^(\/\S*|https:\/\/\S+)$/

export const settings: ResourceConfig = {
  name: 'settings',
  singular: 'Settings',
  plural: 'Contact & footer',
  group: 'Site',
  intro: 'Address, official email, social media, footer links and the home page banner.',
  canCreate: false,
  canDelete: false,
  singleton: true,
  empty: () => ({}),
  fromRecord: (r) => {
    const banner = (r.homeBanner ?? {}) as Record<string, unknown>
    return {
      postalAddress: text(r.postalAddress),
      location: text(r.location),
      contactEmail: text(r.contactEmail),
      socialLinks: toRows(r.socialLinks, ['platform', 'url']),
      quickLinks: toRows(r.quickLinks, ['label', 'url']),
      bannerText: text(banner.text),
      bannerUrl: text(banner.url),
      isPlaceholder: r.isPlaceholder === true,
      placeholderNote: text(r.placeholderNote),
    }
  },
  check: (form) => {
    const errors: Record<string, string> = {}
    if (!str(form, 'postalAddress').trim()) errors.postalAddress = 'Add the postal address.'
    const email = str(form, 'contactEmail').trim()
    if (email && !EMAIL.test(email))
      errors.contactEmail = 'Enter an email address, e.g. secretary@pans.ng.'
    const social = rows(form, 'socialLinks')
    social.some((s, i) => {
      if (!cell(s, 'platform')) errors.socialLinks = `Link ${i + 1}: choose the platform.`
      else if (!HTTPS_LINK.test(cell(s, 'url').trim()))
        errors.socialLinks = `Link ${i + 1}: the address must start with https://.`
      else if (social.findIndex((o) => cell(o, 'platform') === cell(s, 'platform')) !== i)
        errors.socialLinks = `${cell(s, 'platform')} is listed twice.`
      return !!errors.socialLinks
    })
    rows(form, 'quickLinks').some((q, i) => {
      if (!cell(q, 'label').trim()) errors.quickLinks = `Link ${i + 1} needs a label.`
      else if (!QUICK_LINK.test(cell(q, 'url').trim()))
        errors.quickLinks = `Link ${i + 1}: use a page on this site (starting with /) or an https:// address.`
      return !!errors.quickLinks
    })
    const bannerUrl = str(form, 'bannerUrl').trim()
    if (bannerUrl && !QUICK_LINK.test(bannerUrl))
      errors.bannerUrl = 'Use a page on this site (starting with /) or an https:// address.'
    else if (bannerUrl && !str(form, 'bannerText').trim())
      errors.bannerText = 'Add the banner text, or clear the link.'
    return { ...errors, ...checkCommon(form, []) }
  },
  toBody: (form) => ({
    postalAddress: str(form, 'postalAddress').trim(),
    location: str(form, 'location').trim(),
    contactEmail: str(form, 'contactEmail').trim(),
    socialLinks: rows(form, 'socialLinks').map((s) => ({
      platform: cell(s, 'platform'),
      url: cell(s, 'url').trim(),
    })),
    quickLinks: rows(form, 'quickLinks').map((q) => ({
      label: cell(q, 'label').trim(),
      url: cell(q, 'url').trim(),
    })),
    homeBanner: { text: str(form, 'bannerText').trim(), url: str(form, 'bannerUrl').trim() },
    ...placeholderBody(form),
  }),
  fieldFor: (path) => ({ homeBanner: 'bannerText' })[path] ?? path,
  labels: {
    postalAddress: 'Postal address',
    location: 'Where to find us',
    contactEmail: 'Official email',
    socialLinks: 'Social media',
    quickLinks: 'Footer links',
    bannerText: 'Banner text',
    bannerUrl: 'Banner link',
    placeholderNote: 'What’s missing?',
  },
  Fields: SettingsFields,
  rowTitle: () => 'Contact & footer',
  rowDetail: (r) => text(r.contactEmail) || 'No official email yet',
  publicPath: () => '/connect/contact',
}

export const albums: ResourceConfig = {
  name: 'albums',
  singular: 'Album',
  plural: 'Gallery',
  group: 'News & events',
  intro: 'Photo albums for events. Only photos the people pictured agreed to share.',
  empty: () => ({
    title: '',
    slug: '',
    slugEdited: false,
    event: '',
    series: '',
    photos: [],
    cover: '',
    sourceFolderUrl: '',
    consentConfirmed: false,
    isPlaceholder: false,
    placeholderNote: '',
  }),
  fromRecord: (r) => ({
    title: text(r.title),
    slug: text(r.slug),
    slugEdited: true,
    event: text(r.event),
    series: text(r.series),
    photos: toRows(r.photos, ['publicId', 'alt', 'caption']),
    cover: text(r.cover),
    sourceFolderUrl: text(r.sourceFolderUrl),
    consentConfirmed: r.consentConfirmed === true,
    isPlaceholder: r.isPlaceholder === true,
    placeholderNote: text(r.placeholderNote),
  }),
  check: (form) => {
    const errors: Record<string, string> = {}
    if (!str(form, 'title').trim()) errors.title = 'Add a title.'
    if (!SLUG.test(str(form, 'slug'))) errors.slug = `${SLUG_MESSAGE}health-week-2026-day-1.`
    if (!SLUG.test(str(form, 'event'))) errors.event = 'Choose the event the photos are from.'
    const photos = rows(form, 'photos')
    if (photos.length === 0 && !bool(form, 'isPlaceholder'))
      errors.photos = 'Add at least one photo, or tick “Still waiting for some details”.'
    const noAlt = photos.findIndex((p) => !cell(p, 'alt').trim())
    if (noAlt >= 0)
      errors.photos = `Describe photo ${noAlt + 1} for people who can’t see it${photos.filter((p) => !cell(p, 'alt').trim()).length > 1 ? ' (and the others marked)' : ''}.`
    if (photos.length > 0 && !bool(form, 'consentConfirmed'))
      errors.consentConfirmed = 'Confirm the people pictured agreed, or remove the photos.'
    const url = str(form, 'sourceFolderUrl').trim()
    if (url && !HTTPS_LINK.test(url)) errors.sourceFolderUrl = 'The link must start with https://.'
    return { ...errors, ...checkCommon(form, []) }
  },
  toBody: (form) => {
    const photos = rows(form, 'photos').map((p) => ({
      publicId: cell(p, 'publicId'),
      alt: cell(p, 'alt').trim(),
      caption: cell(p, 'caption').trim(),
    }))
    const cover = str(form, 'cover')
    return {
      title: str(form, 'title').trim(),
      slug: str(form, 'slug'),
      event: str(form, 'event'),
      series: str(form, 'series').trim(),
      photos,
      cover: photos.some((p) => p.publicId === cover) ? cover : (photos[0]?.publicId ?? ''),
      sourceFolderUrl: str(form, 'sourceFolderUrl').trim(),
      consentConfirmed: bool(form, 'consentConfirmed'),
      ...placeholderBody(form),
    }
  },
  fieldFor: (path) => path,
  labels: {
    title: 'Title',
    slug: 'Web address',
    event: 'Event',
    photos: 'Photos',
    cover: 'Album cover',
    consentConfirmed: 'Consent',
    sourceFolderUrl: 'Full photo folder',
    placeholderNote: 'What’s missing?',
  },
  Fields: AlbumFields,
  rowTitle: (r) => text(r.title),
  rowDetail: (r) =>
    [Array.isArray(r.photos) ? `${r.photos.length} photos` : '', text(r.series)]
      .filter(Boolean)
      .join(' · '),
  publicPath: (r) => `/gallery/${text(r.slug)}`,
}
