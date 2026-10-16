import { announcements } from './announcements.ts'
import { events } from './events.ts'
import { opportunities } from './opportunities.ts'
import type { ResourceConfig } from './types.ts'

/** The content editors in the dashboard, in tab order. Issue #39 adds the rest. */
export const EDITORS: ResourceConfig[] = [events, announcements, opportunities]
