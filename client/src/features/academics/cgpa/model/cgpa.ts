import type { Grade, GradingScale } from './scale.ts'

/**
 * The CGPA rules as pure functions (README → CGPA calculator):
 * - grade point for a course = units × grade point
 * - GPA (one semester) = Σ(units × grade point) ÷ Σ(units); CGPA = the same over every semester
 * - results to 2 decimal places; Pass/Fail and the 2.40 checks use the rounded value, so the
 *   label always matches the number on screen
 */

/** The grade for a score from 0 to 100, or null if the score is outside that range. */
export function gradeForScore(score: number, scale: GradingScale): Grade | null {
  if (!Number.isFinite(score) || score < 0 || score > 100) return null
  // Best grade whose lower bound the score reaches: 69 → B, 69.5 → B, 70 → A.
  return scale.grades.reduce<Grade | null>(
    (best, g) => (score >= g.min && (!best || g.min > best.min) ? g : best),
    null,
  )
}

export function gradeByLetter(letter: string, scale: GradingScale): Grade | null {
  return scale.grades.find((g) => g.letter === letter) ?? null
}

/** A course ready to count: whole units within the scale's range, and its grade. */
export type GradedCourse = { units: number; grade: Grade }

export function isValidUnits(units: number, scale: GradingScale): boolean {
  return Number.isInteger(units) && units >= scale.units.min && units <= scale.units.max
}

/** Units and Σ(units × grade point) over the courses. Both are whole numbers. */
export function totals(courses: GradedCourse[]): { units: number; points: number } {
  return courses.reduce(
    (t, c) => ({ units: t.units + c.units, points: t.points + c.units * c.grade.point }),
    { units: 0, points: 0 },
  )
}

/**
 * points ÷ units to 2 decimal places, rounding halves up; null with no units. Points and units
 * are whole numbers, so 100 × points ÷ units is exact for the halves that matter (2.395 → 2.40).
 */
export function roundedAverage(points: number, units: number): number | null {
  if (units <= 0) return null
  return Math.round((100 * points) / units) / 100
}

/** GPA for one semester's courses, to 2 decimal places; null when nothing is entered. */
export function gpa(courses: GradedCourse[]): number | null {
  const t = totals(courses)
  return roundedAverage(t.points, t.units)
}

/** CGPA over every semester's courses, to 2 decimal places; null when nothing is entered. */
export function cgpa(semesters: GradedCourse[][]): number | null {
  return gpa(semesters.flat())
}

/** "Pass" or "Fail" for a rounded GPA/CGPA, from the scale's bands. */
export function result(value: number, scale: GradingScale): string {
  const band = scale.bands.find((b) => value >= b.min && value <= b.max)
  return band?.name ?? (value >= scale.passMark ? 'Pass' : 'Fail')
}

export function isBelowPassMark(value: number, scale: GradingScale): boolean {
  return value < scale.passMark
}

/** "2.40": always two decimal places. */
export function formatPoint(value: number): string {
  return value.toFixed(2)
}
