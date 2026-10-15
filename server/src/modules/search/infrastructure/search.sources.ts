import type { Model } from 'mongoose'
import { startOfLagosDay } from '../../../lib/lagosTime.js'
import { CommitteeModel } from '../../committees/infrastructure/committee.model.js'
import { EventModel } from '../../events/infrastructure/event.model.js'
import { OpportunityModel } from '../../opportunities/infrastructure/opportunity.model.js'
import { PublicationModel } from '../../publications/infrastructure/publication.model.js'
import { ResourceModel } from '../../resources/infrastructure/resource.model.js'
import { toHit } from '../application/hits.js'
import type { SearchSource, SearchType } from '../application/search.js'

type Doc = Record<string, unknown> & { score: number }

/** A MongoDB $text search on one collection, best matches first, placeholders excluded. */
function mongoSource(
  type: SearchType,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  model: Model<any>,
  extraFilter: (now: Date) => Record<string, unknown> = () => ({}),
): SearchSource {
  return {
    type,
    async search(terms, limit, now) {
      const docs = await model
        .find(
          { $text: { $search: terms }, isPlaceholder: { $ne: true }, ...extraFilter(now) },
          { score: { $meta: 'textScore' } },
        )
        .sort({ score: { $meta: 'textScore' } })
        .limit(limit)
        .lean<Doc[]>()
      return docs.map((d) => toHit[type](d, d.score))
    },
  }
}

export const mongoSearchSources: SearchSource[] = [
  mongoSource('event', EventModel),
  // Same rule as the Opportunities page: open until the end of the deadline day in Lagos.
  mongoSource('opportunity', OpportunityModel, (now) => ({
    $or: [{ deadline: null }, { deadline: { $gte: startOfLagosDay(now) } }],
  })),
  mongoSource('publication', PublicationModel),
  mongoSource('resource', ResourceModel),
  mongoSource('committee', CommitteeModel),
]
