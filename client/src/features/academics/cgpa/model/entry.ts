import { type GradedCourse, gradeByLetter, gradeForScore, isValidUnits } from './cgpa.ts'
import type { GradingScale } from './scale.ts'

/** One course row as typed: everything is text until it's checked. */
export type CourseEntry = { id: number; code: string; units: string; mark: string }

export type CheckedCourse =
  | { status: 'empty' }
  | { status: 'ok'; course: GradedCourse; fromScore: boolean }
  | { status: 'problem'; message: string }

/**
 * Checks a row. "Mark" is either a score (0–100) or a grade letter ("72" or "B"). Empty rows are
 * ignored; half-filled or invalid rows say what's missing and are left out of the results.
 */
export function checkCourse(entry: CourseEntry, scale: GradingScale): CheckedCourse {
  const mark = entry.mark.trim()
  if (!entry.units && !mark) return { status: 'empty' }
  if (!mark) return { status: 'problem', message: 'Add a score or a grade.' }

  const fromScore = !/^[a-z]$/i.test(mark)
  const grade = fromScore
    ? /^\d+(\.\d+)?$/.test(mark)
      ? gradeForScore(Number(mark), scale)
      : null
    : gradeByLetter(mark.toUpperCase(), scale)
  if (!grade) {
    const letters = scale.grades.map((g) => g.letter).join(', ')
    return {
      status: 'problem',
      message: fromScore
        ? 'Enter a score from 0 to 100, or a grade.'
        : `Use a grade from ${letters}.`,
    }
  }

  const units = Number(entry.units)
  if (!entry.units || !isValidUnits(units, scale)) {
    return { status: 'problem', message: 'Choose the course units.' }
  }
  return { status: 'ok', course: { units, grade }, fromScore }
}
