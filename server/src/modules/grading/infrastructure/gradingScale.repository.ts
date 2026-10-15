import type { GradingScaleReader, StoredGradingScale } from '../application/gradingView.js'
import { GradingScaleModel } from './gradingScale.model.js'

export const mongoGradingScaleReader: GradingScaleReader = {
  findActive: () => GradingScaleModel.findOne({ active: true }).lean<StoredGradingScale>(),
}
