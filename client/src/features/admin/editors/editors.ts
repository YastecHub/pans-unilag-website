import { FEATURES } from '../../../lib/features.ts'
import { gradingScales, resources } from './academics.ts'
import { announcements } from './announcements.ts'
import { committees } from './committees.ts'
import { documents, publications } from './documents.ts'
import { events } from './events.ts'
import { opportunities } from './opportunities.ts'
import { pages } from './pages.ts'
import { executives, patrons, senators } from './people.ts'
import { albums, settings } from './site.ts'
import type { ResourceConfig } from './types.ts'

/**
 * Every editor in the dashboard, in the order the Content page lists them within each group.
 * Together they cover every collection on the Placeholders list.
 */
export const EDITORS: ResourceConfig[] = [
  events,
  announcements,
  opportunities,
  albums,
  executives,
  senators,
  committees,
  patrons,
  pages,
  documents,
  publications,
  ...(FEATURES.academicResources ? [resources] : []),
  gradingScales,
  settings,
]
