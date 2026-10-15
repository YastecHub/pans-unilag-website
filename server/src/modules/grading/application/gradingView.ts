import { type PlaceholderView, placeholderView } from '../../../lib/publicView.js'

type Range = { min: number; max: number }

export type StoredGradingScale = {
  slug: string
  source: string
  grades: (Range & { letter: string; point: number })[]
  bands: (Range & { name: string })[]
  passMark: number
  units: Range
  isPlaceholder?: boolean
  placeholderNote?: string
}

export type GradingScaleView = PlaceholderView & {
  slug: string
  /** Where the scale comes from, e.g. the Faculty handbook section. Shown under the calculator. */
  source: string
  /** Score ranges (inclusive), best grade first. */
  grades: { letter: string; min: number; max: number; point: number }[]
  /** CGPA results (inclusive), Pass first. The handbook defines no classes of degree. */
  bands: { name: string; min: number; max: number }[]
  passMark: number
  /** Credit units allowed per course. */
  units: { min: number; max: number }
}

const highestFirst = <T extends Range>(ranges: T[]) => [...ranges].sort((a, b) => b.min - a.min)

export function toGradingScaleView(s: StoredGradingScale): GradingScaleView {
  return {
    slug: s.slug,
    source: s.source,
    grades: highestFirst(s.grades).map(({ letter, min, max, point }) => ({
      letter,
      min,
      max,
      point,
    })),
    bands: highestFirst(s.bands).map(({ name, min, max }) => ({ name, min, max })),
    passMark: s.passMark,
    units: { min: s.units.min, max: s.units.max },
    ...placeholderView(s),
  }
}

export type GradingScaleReader = {
  /** The one active scale, or null if none is active. */
  findActive(): Promise<StoredGradingScale | null>
}
