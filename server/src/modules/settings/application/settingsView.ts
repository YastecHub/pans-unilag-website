import { type PlaceholderView, placeholderView } from '../../../lib/publicView.js'

export type StoredSettings = {
  postalAddress: string
  location?: string
  contactEmail?: string
  socialLinks?: { platform: string; url: string }[]
  quickLinks?: { label: string; url: string }[]
  homeBanner?: { text?: string; url?: string } | null
  isPlaceholder?: boolean
  placeholderNote?: string
}

export type SettingsView = PlaceholderView & {
  postalAddress: string
  location: string
  /** Official role email; empty until supplied. */
  contactEmail: string
  socialLinks: { platform: string; url: string }[]
  quickLinks: { label: string; url: string }[]
  /** Site-wide notice above the header; null when there is none. */
  homeBanner: { text: string; url: string } | null
}

export function toSettingsView(s: StoredSettings): SettingsView {
  const bannerText = s.homeBanner?.text?.trim() ?? ''
  return {
    postalAddress: s.postalAddress,
    location: s.location ?? '',
    contactEmail: s.contactEmail ?? '',
    socialLinks: (s.socialLinks ?? []).map(({ platform, url }) => ({ platform, url })),
    quickLinks: (s.quickLinks ?? []).map(({ label, url }) => ({ label, url })),
    homeBanner: bannerText ? { text: bannerText, url: s.homeBanner?.url ?? '' } : null,
    ...placeholderView(s),
  }
}

export type SettingsReader = {
  /** The single site settings document, or null before seeding. */
  find(): Promise<StoredSettings | null>
}
