import { describe, expect, it } from 'vitest'
import {
  cgpa,
  formatPoint,
  gpa,
  type GradedCourse,
  gradeByLetter,
  gradeForScore,
  isBelowPassMark,
  isValidUnits,
  result,
  roundedAverage,
  totals,
} from './cgpa.ts'
import { LOCAL_SCALE as scale } from './scale.ts'
import seedJson from '../../../../../../server/seed/grading.json?raw'

const letter = (score: number) => gradeForScore(score, scale)?.letter
const course = (units: number, l: string): GradedCourse => ({
  units,
  grade: gradeByLetter(l, scale)!,
})

describe('the bundled scale', () => {
  it('is the same as the seeded one the API serves', () => {
    const [seed] = JSON.parse(seedJson) as Record<string, unknown>[]
    const seeded = { ...seed }
    delete seeded.active // a database flag, not part of the scale the API returns
    expect(scale).toEqual(seeded)
  })
})

describe('score → grade (handbook §3.5)', () => {
  it.each([
    [39, 'F'],
    [40, 'E'],
    [44, 'E'],
    [45, 'D'],
    [49, 'D'],
    [50, 'C'],
    [59, 'C'],
    [60, 'B'],
    [69, 'B'],
    [70, 'A'],
  ])('%i → %s', (score, expected) => {
    expect(letter(score)).toBe(expected)
  })

  it('covers the ends of the range and rejects anything outside it', () => {
    expect(letter(0)).toBe('F')
    expect(letter(100)).toBe('A')
    expect(letter(69.5)).toBe('B') // between bands: the grade whose lower bound it reached
    expect(gradeForScore(-1, scale)).toBeNull()
    expect(gradeForScore(101, scale)).toBeNull()
    expect(gradeForScore(Number.NaN, scale)).toBeNull()
  })

  it('maps grades to points 5 to 0', () => {
    expect(scale.grades.map((g) => [g.letter, g.point])).toEqual([
      ['A', 5],
      ['B', 4],
      ['C', 3],
      ['D', 2],
      ['E', 1],
      ['F', 0],
    ])
  })
})

describe('units', () => {
  it('allows whole units from 1 to 3', () => {
    expect([0, 1, 2, 3, 4, 1.5].map((u) => isValidUnits(u, scale))).toEqual([
      false,
      true,
      true,
      true,
      false,
      false,
    ])
  })
})

describe('GPA and CGPA', () => {
  it('weights each grade point by its units', () => {
    // (3×5 + 2×4 + 1×2) ÷ 6 = 25 ÷ 6 = 4.1666… → 4.17
    const semester = [course(3, 'A'), course(2, 'B'), course(1, 'D')]
    expect(totals(semester)).toEqual({ units: 6, points: 25 })
    expect(gpa(semester)).toBe(4.17)
  })

  it('works out CGPA over all semesters together, not as an average of GPAs', () => {
    const first = [course(3, 'A')] // GPA 5.00 over 3 units
    const second = [course(1, 'F'), course(1, 'F'), course(1, 'C')] // GPA 1.00 over 3 units
    expect(gpa(first)).toBe(5)
    expect(gpa(second)).toBe(1)
    expect(cgpa([first, second])).toBe(3) // 18 ÷ 6
    expect(cgpa([[course(3, 'A')], [course(1, 'F')]])).toBe(3.75) // not (5 + 0) ÷ 2
  })

  it('has no result until something is entered', () => {
    expect(gpa([])).toBeNull()
    expect(cgpa([[], []])).toBeNull()
    expect(roundedAverage(0, 0)).toBeNull()
  })

  it('shows two decimal places', () => {
    expect(formatPoint(4)).toBe('4.00')
    expect(formatPoint(2.4)).toBe('2.40')
    expect(formatPoint(3.75)).toBe('3.75')
  })
})

describe('pass mark 2.40 (on the rounded value)', () => {
  it('fails 2.39 and passes 2.40', () => {
    expect(result(2.39, scale)).toBe('Fail')
    expect(result(2.4, scale)).toBe('Pass')
    expect(isBelowPassMark(2.39, scale)).toBe(true)
    expect(isBelowPassMark(2.4, scale)).toBe(false)
    expect(result(0, scale)).toBe('Fail')
    expect(result(5, scale)).toBe('Pass')
  })

  it('rounds 2.395 up to 2.40, so it passes, matching the number shown', () => {
    expect(roundedAverage(479, 200)).toBe(2.4) // 479 ÷ 200 = 2.395 exactly
    expect(roundedAverage(4789, 2000)).toBe(2.39) // 2.3945 stays below
  })

  it('passes a real set of courses whose exact CGPA is 2.395', () => {
    // 200 one-unit courses: 79 A (395) + 42 D (84) + 79 F (0) = 479 points ÷ 200 units.
    const courses = [
      ...Array.from({ length: 79 }, () => course(1, 'A')),
      ...Array.from({ length: 42 }, () => course(1, 'D')),
      ...Array.from({ length: 79 }, () => course(1, 'F')),
    ]
    expect(totals(courses)).toEqual({ units: 200, points: 479 })
    const value = cgpa([courses])!
    expect(formatPoint(value)).toBe('2.40')
    expect(result(value, scale)).toBe('Pass')
    expect(isBelowPassMark(value, scale)).toBe(false)
  })
})
