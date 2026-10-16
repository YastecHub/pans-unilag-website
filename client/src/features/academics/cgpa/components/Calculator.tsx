import { useEffect, useRef, useState } from 'react'
import { Button } from '../../../../components/ui/Button.tsx'
import {
  cgpa,
  formatPoint,
  gpa,
  type GradedCourse,
  isBelowPassMark,
  result,
  totals,
} from '../model/cgpa.ts'
import { type CheckedCourse, checkCourse, type CourseEntry } from '../model/entry.ts'
import type { GradingScale } from '../model/scale.ts'

type Semester = { id: number; courses: CourseEntry[] }

let lastId = 0
const newCourse = (): CourseEntry => ({ id: ++lastId, code: '', units: '', mark: '' })
const newSemester = (courses = 4): Semester => ({
  id: ++lastId,
  courses: Array.from({ length: courses }, newCourse),
})

const field =
  'min-h-12 w-full rounded-lg border-2 border-border-strong bg-surface px-3 text-base text-text'

/**
 * The calculator. Everything stays in this component's memory: nothing is saved in the browser
 * or sent anywhere, and it all goes when the page is closed.
 */
export function Calculator({ scale }: { scale: GradingScale }) {
  const [semesters, setSemesters] = useState<Semester[]>(() => [newSemester()])
  // After adding or removing, focus moves to where the student will type next (once rendered).
  const focusNext = useRef<string | null>(null)
  const setFocusTarget = (id: string) => {
    focusNext.current = id
  }
  useEffect(() => {
    if (!focusNext.current) return
    document.getElementById(focusNext.current)?.focus()
    focusNext.current = null
  })

  const updateCourse = (semesterId: number, courseId: number, change: Partial<CourseEntry>) =>
    setSemesters((list) =>
      list.map((s) =>
        s.id !== semesterId
          ? s
          : { ...s, courses: s.courses.map((c) => (c.id === courseId ? { ...c, ...change } : c)) },
      ),
    )

  const addCourse = (semesterId: number) => {
    const course = newCourse()
    setSemesters((list) =>
      list.map((s) => (s.id === semesterId ? { ...s, courses: [...s.courses, course] } : s)),
    )
    setFocusTarget(`course-${course.id}-code`)
  }

  const removeCourse = (semester: Semester, courseId: number) => {
    const index = semester.courses.findIndex((c) => c.id === courseId)
    const remaining = semester.courses.filter((c) => c.id !== courseId)
    setSemesters((list) =>
      list.map((s) => (s.id === semester.id ? { ...s, courses: remaining } : s)),
    )
    const next = remaining[Math.min(index, remaining.length - 1)]
    setFocusTarget(next ? `course-${next.id}-code` : `add-course-${semester.id}`)
  }

  const addSemester = () => {
    const semester = newSemester(1)
    setSemesters((list) => [...list, semester])
    setFocusTarget(`course-${semester.courses[0]!.id}-code`)
  }

  const removeSemester = (semesterId: number) => {
    setSemesters((list) => list.filter((s) => s.id !== semesterId))
    setFocusTarget('add-semester')
  }

  const checked = semesters.map((s) => s.courses.map((c) => checkCourse(c, scale)))
  const graded = checked.map((list) => list.flatMap((c) => (c.status === 'ok' ? [c.course] : [])))

  return (
    <div className="flex flex-col gap-8">
      {semesters.map((semester, si) => (
        <SemesterBlock
          key={semester.id}
          number={si + 1}
          semester={semester}
          checked={checked[si]!}
          canRemove={semesters.length > 1}
          scale={scale}
          onChange={(courseId, change) => updateCourse(semester.id, courseId, change)}
          onAddCourse={() => addCourse(semester.id)}
          onRemoveCourse={(courseId) => removeCourse(semester, courseId)}
          onRemove={() => removeSemester(semester.id)}
          semesterGpa={gpa(graded[si]!)}
          semesterUnits={totals(graded[si]!).units}
        />
      ))}
      <div>
        <Button id="add-semester" variant="outline" onClick={addSemester}>
          Add a semester
        </Button>
      </div>
      <Results semesters={graded} scale={scale} />
    </div>
  )
}

type SemesterProps = {
  number: number
  semester: Semester
  checked: CheckedCourse[]
  canRemove: boolean
  scale: GradingScale
  onChange: (courseId: number, change: Partial<CourseEntry>) => void
  onAddCourse: () => void
  onRemoveCourse: (courseId: number) => void
  onRemove: () => void
  semesterGpa: number | null
  semesterUnits: number
}

function SemesterBlock(p: SemesterProps) {
  const title = `Semester ${p.number}`
  const unitOptions = Array.from(
    { length: p.scale.units.max - p.scale.units.min + 1 },
    (_, i) => p.scale.units.min + i,
  )
  return (
    <section
      aria-labelledby={`semester-${p.semester.id}-title`}
      className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-4 sm:p-5"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id={`semester-${p.semester.id}-title`} className="text-h3">
          {title}
        </h2>
        {p.canRemove && (
          <Button variant="ghost" size="sm" onClick={p.onRemove}>
            Remove {title.toLowerCase()}
          </Button>
        )}
      </div>

      <ol className="flex flex-col gap-4 [&>li:not(:last-child)]:border-b [&>li:not(:last-child)]:border-border [&>li:not(:last-child)]:pb-4">
        {p.semester.courses.map((course, ci) => {
          const check = p.checked[ci]!
          const base = `course-${course.id}`
          const problem = check.status === 'problem' ? check.message : null
          return (
            <li key={course.id}>
              <fieldset className="grid grid-cols-2 items-start gap-x-3 gap-y-2 sm:grid-cols-[minmax(0,1fr)_7rem_minmax(0,1fr)_auto]">
                <legend className="sr-only">
                  {title}, course {ci + 1}
                </legend>
                <label className="col-span-2 flex flex-col gap-1 text-small font-medium sm:col-span-1">
                  Course code <span className="sr-only">(optional)</span>
                  <input
                    id={`${base}-code`}
                    className={field}
                    value={course.code}
                    onChange={(e) => p.onChange(course.id, { code: e.target.value })}
                    placeholder="e.g. PHA 301 (optional)"
                    autoComplete="off"
                  />
                </label>
                <label className="flex flex-col gap-1 text-small font-medium">
                  Units
                  <select
                    id={`${base}-units`}
                    className={field}
                    value={course.units}
                    onChange={(e) => p.onChange(course.id, { units: e.target.value })}
                    aria-invalid={problem === 'Choose the course units.' || undefined}
                  >
                    <option value="">Choose</option>
                    {unitOptions.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex flex-col gap-1 text-small font-medium">
                  Score or grade
                  <input
                    id={`${base}-mark`}
                    className={field}
                    value={course.mark}
                    onChange={(e) => p.onChange(course.id, { mark: e.target.value })}
                    placeholder="e.g. 72 or B"
                    inputMode="text"
                    autoComplete="off"
                    aria-describedby={`${base}-status`}
                    aria-invalid={
                      (problem !== null && problem !== 'Choose the course units.') || undefined
                    }
                  />
                </label>
                <div className="order-last col-span-2 flex justify-end sm:order-none sm:col-span-1 sm:h-full sm:items-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => p.onRemoveCourse(course.id)}
                    aria-label={`Remove ${title.toLowerCase()}, course ${ci + 1}${course.code ? ` (${course.code})` : ''}`}
                  >
                    Remove
                  </Button>
                </div>
                <p
                  id={`${base}-status`}
                  className={`col-span-2 text-small sm:col-span-4 ${problem ? 'text-danger' : 'text-text-muted'}`}
                >
                  {check.status === 'ok'
                    ? `Grade ${check.course.grade.letter} · ${check.course.grade.point} ${check.course.grade.point === 1 ? 'point' : 'points'} × ${check.course.units} ${check.course.units === 1 ? 'unit' : 'units'}`
                    : problem}
                </p>
              </fieldset>
            </li>
          )
        })}
      </ol>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
        <Button
          id={`add-course-${p.semester.id}`}
          variant="outline"
          size="sm"
          onClick={p.onAddCourse}
        >
          Add a course
        </Button>
        <p className="font-heading font-medium">
          GPA{' '}
          {p.semesterGpa === null ? (
            <span className="text-text-muted">: enter a course to see it</span>
          ) : (
            <>
              <span className="text-text-brand">{formatPoint(p.semesterGpa)}</span>
              <span className="text-small font-normal text-text-muted">
                {' '}
                over {p.semesterUnits} {p.semesterUnits === 1 ? 'unit' : 'units'}
              </span>
            </>
          )}
        </p>
      </div>
    </section>
  )
}

/** CGPA, Pass/Fail, and the calm note below the pass mark. Announced as it changes. */
function Results({ semesters, scale }: { semesters: GradedCourse[][]; scale: GradingScale }) {
  const value = cgpa(semesters)
  const entered = semesters.map((list, i) => ({ number: i + 1, gpa: gpa(list) }))
  const latest = [...entered].reverse().find((s) => s.gpa !== null)
  const pass = formatPoint(scale.passMark)
  const below =
    value !== null &&
    (isBelowPassMark(value, scale) || (latest?.gpa != null && isBelowPassMark(latest.gpa, scale)))

  return (
    <section
      aria-labelledby="results-title"
      className="flex flex-col gap-4 rounded-xl bg-surface-alt p-5"
    >
      <h2 id="results-title" className="text-h3">
        Your results
      </h2>
      <div aria-live="polite" className="flex flex-col gap-3">
        {value === null ? (
          <p>Enter units and a score or grade for at least one course to see your CGPA.</p>
        ) : (
          <>
            <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span className="font-heading font-medium">CGPA</span>
              <span className="font-heading text-h2 font-semibold text-text-brand">
                {formatPoint(value)}
              </span>
              <span className="text-small text-text-muted">
                out of 5.00 · {result(value, scale)}
              </span>
            </p>
            {entered.length > 1 && (
              <ul className="flex flex-wrap gap-x-6 gap-y-1 text-small">
                {entered.map((s) => (
                  <li key={s.number}>
                    Semester {s.number}: {s.gpa === null ? 'no courses yet' : formatPoint(s.gpa)}
                  </li>
                ))}
              </ul>
            )}
            {below && (
              <p className="rounded-lg border-l-4 border-accent bg-surface p-3 text-small">
                Below the {pass} pass mark. Check the academic standing rules and speak to your
                level adviser.
              </p>
            )}
          </>
        )}
      </div>
    </section>
  )
}
