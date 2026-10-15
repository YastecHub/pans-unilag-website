import { type PlaceholderView, placeholderView } from '../../../lib/publicView.js'
import type { SessionReader } from '../../../lib/sessions.js'

export type SenatorView = PlaceholderView & {
  session: string
  position: string
  order: number
  name: string
  level: string
}

export type StoredSenator = Pick<SenatorView, 'session' | 'position' | 'order' | 'name'> &
  Partial<Pick<SenatorView, 'level' | 'placeholderNote'>> & { isPlaceholder?: boolean }

export function toSenatorView(s: StoredSenator): SenatorView {
  return {
    session: s.session,
    position: s.position,
    order: s.order,
    name: s.name,
    level: s.level ?? '',
    ...placeholderView(s),
  }
}

export type SenatorReader = SessionReader<SenatorView>
