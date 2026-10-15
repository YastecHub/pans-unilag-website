import { model, Schema } from 'mongoose'
import { contentPlugin } from '../../../lib/contentPlugin.js'

const gradeSchema = new Schema(
  {
    letter: { type: String, required: true, match: /^[A-F]$/ },
    min: { type: Number, required: true, min: 0, max: 100 },
    max: { type: Number, required: true, min: 0, max: 100 },
    point: { type: Number, required: true, min: 0, max: 5 },
  },
  { _id: false, strict: 'throw' },
)

const bandSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    min: { type: Number, required: true, min: 0, max: 5 },
    max: { type: Number, required: true, min: 0, max: 5 },
  },
  { _id: false, strict: 'throw' },
)

type Range = { min: number; max: number }

/** True when the ranges, sorted, cover [from, to] with no gaps or overlaps at the given step. */
export function coversRange(ranges: Range[], from: number, to: number, step: number): boolean {
  const sorted = [...ranges].sort((a, b) => a.min - b.min)
  if (sorted.length === 0 || sorted[0]!.min !== from || sorted.at(-1)!.max !== to) return false
  return sorted.every(
    (r, i) => r.min <= r.max && (i === 0 || Math.abs(r.min - sorted[i - 1]!.max - step) < 1e-9),
  )
}

/** The CGPA grading scale (README → CGPA calculator). Exactly one scale is active. */
const gradingScaleSchema = new Schema({
  slug: { type: String, required: true, unique: true, match: /^[a-z0-9]+(-[a-z0-9]+)*$/ },
  active: { type: Boolean, default: false },
  source: { type: String, required: true, trim: true },
  grades: {
    type: [gradeSchema],
    validate: {
      validator: (g: Range[]) => coversRange(g, 0, 100, 1),
      message: 'grades must cover scores 0–100 with no gaps or overlaps',
    },
  },
  bands: {
    type: [bandSchema],
    validate: {
      validator: (b: Range[]) => coversRange(b, 0, 5, 0.01),
      message: 'bands must cover CGPA 0.00–5.00 with no gaps or overlaps',
    },
  },
  passMark: { type: Number, required: true, min: 0, max: 5 },
  units: {
    min: { type: Number, required: true, min: 1 },
    max: { type: Number, required: true, min: 1 },
  },
})
gradingScaleSchema.plugin(contentPlugin)
// Only one active scale at a time.
gradingScaleSchema.index({ active: 1 }, { unique: true, partialFilterExpression: { active: true } })

export const GradingScaleModel = model('GradingScale', gradingScaleSchema)
