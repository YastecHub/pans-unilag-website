import type { OpportunityReader, StoredOpportunity } from '../application/opportunityView.js'
import { OpportunityModel } from './opportunity.model.js'

export const mongoOpportunityReader: OpportunityReader = {
  list: ({ type }) => OpportunityModel.find(type ? { type } : {}).lean<StoredOpportunity[]>(),
  findBySlug: (slug) => OpportunityModel.findOne({ slug }).lean<StoredOpportunity>(),
}
