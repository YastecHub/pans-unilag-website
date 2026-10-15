import { type PlaceholderView, placeholderView } from '../../../lib/publicView.js'

export type StoredAnnouncement = {
  _id?: unknown
  title: string
  body: string
  publishAt: Date | string
  expiresAt?: Date | string | null
  pinned?: boolean
  link?: string
  isPlaceholder?: boolean
  placeholderNote?: string
}

export type AnnouncementView = PlaceholderView & {
  id: string
  title: string
  /** Markdown. */
  body: string
  publishAt: string
  expiresAt: string | null
  pinned: boolean
  link: string
}

/** Shown from publishAt until (not including) expiresAt. */
export function isActive(a: StoredAnnouncement, now: Date): boolean {
  if (new Date(a.publishAt) > now) return false
  return !a.expiresAt || now < new Date(a.expiresAt)
}

/** Pinned first, then newest first. */
export function compareAnnouncements(a: AnnouncementView, b: AnnouncementView): number {
  if (a.pinned !== b.pinned) return a.pinned ? -1 : 1
  return Date.parse(b.publishAt) - Date.parse(a.publishAt)
}

export function toAnnouncementView(a: StoredAnnouncement): AnnouncementView {
  return {
    id: String(a._id ?? ''),
    title: a.title,
    body: a.body,
    publishAt: new Date(a.publishAt).toISOString(),
    expiresAt: a.expiresAt ? new Date(a.expiresAt).toISOString() : null,
    pinned: a.pinned ?? false,
    link: a.link ?? '',
    ...placeholderView(a),
  }
}

/** The announcements to show at `now`, pinned first. */
export function activeAnnouncements(stored: StoredAnnouncement[], now: Date): AnnouncementView[] {
  return stored
    .filter((a) => isActive(a, now))
    .map(toAnnouncementView)
    .sort(compareAnnouncements)
}

export type AnnouncementReader = {
  /** Announcements that may be active at `now` (the reader may pre-filter; the rule is applied again). */
  list(now: Date): Promise<StoredAnnouncement[]>
}
