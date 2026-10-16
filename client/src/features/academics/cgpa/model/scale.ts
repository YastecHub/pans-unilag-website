/**
 * The grading scale (README → CGPA calculator; Faculty of Pharmacy student handbook §3.5, p. 22).
 * The page fetches it from GET /api/grading-scale so admins can update it without code; this
 * bundled copy (the same as server/seed/grading.json) is used until it loads or if it fails.
 */
export type Grade = { letter: string; min: number; max: number; point: number }

export type GradingScale = {
  slug: string
  source: string
  /** Score ranges (inclusive), best grade first. */
  grades: Grade[]
  /** CGPA results (inclusive), Pass first. The handbook defines no classes of degree. */
  bands: { name: string; min: number; max: number }[]
  passMark: number
  /** Credit units allowed per course. */
  units: { min: number; max: number }
}

export const LOCAL_SCALE: GradingScale = {
  slug: 'faculty-of-pharmacy-5-point',
  source:
    'Faculty of Pharmacy student handbook, §3.5 (p. 22). F read as 0–39: the handbook prints "<50", to be confirmed with the Faculty.',
  grades: [
    { letter: 'A', min: 70, max: 100, point: 5 },
    { letter: 'B', min: 60, max: 69, point: 4 },
    { letter: 'C', min: 50, max: 59, point: 3 },
    { letter: 'D', min: 45, max: 49, point: 2 },
    { letter: 'E', min: 40, max: 44, point: 1 },
    { letter: 'F', min: 0, max: 39, point: 0 },
  ],
  bands: [
    { name: 'Pass', min: 2.4, max: 5 },
    { name: 'Fail', min: 0, max: 2.39 },
  ],
  passMark: 2.4,
  units: { min: 1, max: 3 },
}
