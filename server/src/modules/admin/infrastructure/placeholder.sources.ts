import type { Model } from 'mongoose'
import { AlbumModel } from '../../albums/infrastructure/album.model.js'
import { AnnouncementModel } from '../../announcements/infrastructure/announcement.model.js'
import { CommitteeModel } from '../../committees/infrastructure/committee.model.js'
import { DocumentModel } from '../../documents/infrastructure/document.model.js'
import { EventModel } from '../../events/infrastructure/event.model.js'
import { ExecutiveModel } from '../../executives/infrastructure/executive.model.js'
import { GradingScaleModel } from '../../grading/infrastructure/gradingScale.model.js'
import { OpportunityModel } from '../../opportunities/infrastructure/opportunity.model.js'
import { PageModel } from '../../pages/infrastructure/page.model.js'
import { PatronModel } from '../../patrons/infrastructure/patron.model.js'
import { PublicationModel } from '../../publications/infrastructure/publication.model.js'
import { ResourceModel } from '../../resources/infrastructure/resource.model.js'
import { SenatorModel } from '../../senate/infrastructure/senator.model.js'
import { SettingsModel } from '../../settings/infrastructure/settings.model.js'
import { PLACEHOLDER_PAGES, type PlaceholderSource } from '../application/placeholders.js'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const MODELS: Record<(typeof PLACEHOLDER_PAGES)[number]['collection'], Model<any>> = {
  pages: PageModel,
  executives: ExecutiveModel,
  senators: SenatorModel,
  committees: CommitteeModel,
  patrons: PatronModel,
  events: EventModel,
  albums: AlbumModel,
  announcements: AnnouncementModel,
  opportunities: OpportunityModel,
  publications: PublicationModel,
  documents: DocumentModel,
  resources: ResourceModel,
  gradingscales: GradingScaleModel,
  settings: SettingsModel,
}

export const mongoPlaceholderSources: PlaceholderSource[] = PLACEHOLDER_PAGES.map((page) => ({
  ...page,
  list: () =>
    MODELS[page.collection]
      .find({ isPlaceholder: true })
      .sort({ order: 1, _id: 1 })
      .lean<Record<string, unknown>[]>(),
}))
