import { type PlaceholderView, placeholderView } from '../../../lib/publicView.js'
import type { SessionReader } from '../../../lib/sessions.js'

export type ExecutiveView = PlaceholderView & {
  session: string
  office: string
  order: number
  name: string
  level: string
  bio: string
  /** Cloudinary public id; empty until the official photo exists. */
  photo: string
  roleEmail: string
}

/** A stored executive (lean document or seed entry). Optional fields default to empty. */
export type StoredExecutive = Pick<ExecutiveView, 'session' | 'office' | 'order' | 'name'> &
  Partial<Pick<ExecutiveView, 'level' | 'bio' | 'photo' | 'roleEmail' | 'placeholderNote'>> & {
    isPlaceholder?: boolean
  }

export function toExecutiveView(e: StoredExecutive): ExecutiveView {
  return {
    session: e.session,
    office: e.office,
    order: e.order,
    name: e.name,
    level: e.level ?? '',
    bio: e.bio ?? '',
    photo: e.photo ?? '',
    roleEmail: e.roleEmail ?? '',
    ...placeholderView(e),
  }
}

export type ExecutiveReader = SessionReader<ExecutiveView>
