import { type PlaceholderView, placeholderView } from '../../../lib/publicView.js'
import type { SessionReader } from '../../../lib/sessions.js'

export type CommitteeOfficerView = { title: string; name: string; level: string }

export type CommitteeView = PlaceholderView & {
  slug: string
  name: string
  shortName: string
  session: string
  order: number
  /** Markdown; empty while the committee waits for its write-up. */
  description: string
  activities: string[]
  achievements: string[]
  plans: string[]
  motto: string
  officers: CommitteeOfficerView[]
  /** Cloudinary public id; empty if none. */
  coverImage: string
}

type Optional = Omit<
  CommitteeView,
  'slug' | 'name' | 'shortName' | 'session' | 'order' | 'officers'
>

export type StoredCommittee = Pick<
  CommitteeView,
  'slug' | 'name' | 'shortName' | 'session' | 'order'
> &
  Partial<Optional> & { officers?: (Omit<CommitteeOfficerView, 'level'> & { level?: string })[] }

export function toCommitteeView(c: StoredCommittee): CommitteeView {
  return {
    slug: c.slug,
    name: c.name,
    shortName: c.shortName,
    session: c.session,
    order: c.order,
    description: c.description ?? '',
    activities: c.activities ?? [],
    achievements: c.achievements ?? [],
    plans: c.plans ?? [],
    motto: c.motto ?? '',
    officers: (c.officers ?? []).map(({ title, name, level }) => ({
      title,
      name,
      level: level ?? '',
    })),
    coverImage: c.coverImage ?? '',
    ...placeholderView(c),
  }
}

export type CommitteeReader = SessionReader<CommitteeView> & {
  findBySlug(slug: string): Promise<CommitteeView | null>
}
