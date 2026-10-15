import { type PlaceholderView, placeholderView } from '../../../lib/publicView.js'

export type PatronView = PlaceholderView & {
  order: number
  name: string
  title: string
  /** The Dean of the Faculty of Pharmacy is a patron by office (Art. 4 S.C). */
  isDean: boolean
}

export type StoredPatron = Pick<PatronView, 'order' | 'name' | 'title'> &
  Partial<Pick<PatronView, 'isDean' | 'placeholderNote'>> & { isPlaceholder?: boolean }

export function toPatronView(p: StoredPatron): PatronView {
  return {
    order: p.order,
    name: p.name,
    title: p.title,
    isDean: p.isDean ?? false,
    ...placeholderView(p),
  }
}

export type PatronReader = {
  /** All patrons, Dean first (by `order`). */
  list(): Promise<PatronView[]>
}
