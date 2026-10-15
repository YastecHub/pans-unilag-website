import type { ReactNode } from 'react'

/** Responsive grid of PersonCards: four across on desktop, one on a 375 px phone. */
export function PeopleGrid({ children }: { children: ReactNode }) {
  return <ul className="grid grid-cols-[repeat(auto-fill,minmax(15rem,1fr))] gap-4">{children}</ul>
}
