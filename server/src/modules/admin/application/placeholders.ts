import { labelFor } from '../../../seed/contentStatus.js'

/** One collection that can hold placeholders, and the page of the site where they show. */
export type PlaceholderSource = {
  collection: string
  page: string
  /** Where the placeholders appear on the public site. */
  path: string
  /** The collection's placeholder documents (isPlaceholder: true). */
  list(): Promise<Record<string, unknown>[]>
}

export type PlaceholderItem = { id: string; label: string; note: string; updatedAt: string | null }

export type PlaceholderGroup = {
  collection: string
  page: string
  path: string
  items: PlaceholderItem[]
}

/** The admin to-do list: every placeholder on the site, grouped by the page it appears on. */
export async function placeholderGroups(
  sources: PlaceholderSource[],
): Promise<{ total: number; groups: PlaceholderGroup[] }> {
  const groups = await Promise.all(
    sources.map(async ({ collection, page, path, list }) => ({
      collection,
      page,
      path,
      items: (await list()).map((doc, i) => ({
        id: String(doc.id ?? doc._id ?? ''),
        label: labelFor(doc, i),
        note: typeof doc.placeholderNote === 'string' ? doc.placeholderNote : '',
        updatedAt: doc.updatedAt ? new Date(doc.updatedAt as string).toISOString() : null,
      })),
    })),
  )
  const nonEmpty = groups.filter((g) => g.items.length > 0)
  return { total: nonEmpty.reduce((n, g) => n + g.items.length, 0), groups: nonEmpty }
}

/** Collection → the page it feeds. Order is the order of the dashboard's to-do list. */
export const PLACEHOLDER_PAGES = [
  { collection: 'pages', page: 'About & governance pages', path: '/about' },
  { collection: 'executives', page: 'Executive Council', path: '/leadership/executive-council' },
  { collection: 'senators', page: 'Senate', path: '/leadership/senate' },
  { collection: 'committees', page: 'Committees', path: '/leadership/committees' },
  { collection: 'patrons', page: 'Patrons', path: '/leadership/patrons' },
  { collection: 'events', page: 'Events', path: '/events' },
  { collection: 'albums', page: 'Gallery', path: '/gallery' },
  { collection: 'announcements', page: 'Home: announcements', path: '/' },
  { collection: 'opportunities', page: 'Opportunities', path: '/opportunities' },
  { collection: 'publications', page: 'Publications', path: '/publications' },
  { collection: 'documents', page: 'Constitution', path: '/governance/constitution' },
  { collection: 'resources', page: 'Academic resources', path: '/academics/resources' },
  { collection: 'gradingscales', page: 'CGPA calculator', path: '/academics/cgpa-calculator' },
  { collection: 'settings', page: 'Contact & footer', path: '/connect/contact' },
] as const
