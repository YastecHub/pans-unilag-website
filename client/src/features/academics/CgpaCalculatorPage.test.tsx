import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { apiError, jsonResponse, mockApi } from '../../test/mockApi.ts'
import { renderRoute } from '../../test/renderRoute.tsx'
import { LOCAL_SCALE } from './cgpa/model/scale.ts'

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

const PATH = '/academics/cgpa-calculator'
const main = () => document.getElementById('main')!
const semester = (n: number) =>
  within(main())
    .getByRole('heading', { level: 2, name: `Semester ${n}` })
    .closest('section')!
const course = (s: number, n: number) =>
  within(semester(s)).getByRole('group', { name: `Semester ${s}, course ${n}` })
const results = () =>
  within(main()).getByRole('heading', { level: 2, name: 'Your results' }).closest('section')!

async function fill(s: number, n: number, units: string, mark: string) {
  const row = course(s, n)
  if (units) await userEvent.selectOptions(within(row).getByLabelText('Units'), units)
  if (mark) await userEvent.type(within(row).getByLabelText('Score or grade'), mark)
}

describe('CGPA calculator', () => {
  it('works out GPA and CGPA from scores and grades, to 2 decimal places', async () => {
    mockApi({ '/api/grading-scale': LOCAL_SCALE })
    renderRoute(PATH)
    await screen.findByRole('heading', { level: 1, name: 'CGPA calculator' })
    expect(within(semester(1)).getAllByRole('group')).toHaveLength(4)
    expect(within(results()).getByText(/Enter units and a score or grade/)).toBeTruthy()

    await fill(1, 1, '3', '72')
    expect(within(course(1, 1)).getByText('Grade A · 5 points × 3 units')).toBeTruthy()
    await fill(1, 2, '2', 'b')
    await fill(1, 3, '1', '46')
    // (3×5 + 2×4 + 1×2) ÷ 6 = 4.1666… → 4.17
    expect(within(semester(1)).getByText('4.17')).toBeTruthy()
    expect(within(semester(1)).getByText(/over 6 units/)).toBeTruthy()
    expect(within(results()).getByText('4.17')).toBeTruthy()
    expect(within(results()).getByText(/out of 5\.00 · Pass/)).toBeTruthy()
    expect(within(results()).queryByText(/Below the 2\.40 pass mark/)).toBeNull()
  })

  it('says what is wrong with a row and leaves it out of the results', async () => {
    mockApi({ '/api/grading-scale': LOCAL_SCALE })
    renderRoute(PATH)
    await screen.findByRole('heading', { level: 2, name: 'Semester 1' })

    await fill(1, 1, '', '65')
    expect(within(course(1, 1)).getByText('Choose the course units.')).toBeTruthy()
    expect(within(course(1, 1)).getByLabelText('Units').getAttribute('aria-invalid')).toBe('true')

    await fill(1, 2, '2', 'x')
    expect(within(course(1, 2)).getByText('Use a grade from A, B, C, D, E, F.')).toBeTruthy()
    await fill(1, 3, '2', '101')
    expect(within(course(1, 3)).getByText('Enter a score from 0 to 100, or a grade.')).toBeTruthy()
    const mark = within(course(1, 3)).getByLabelText('Score or grade')
    expect(mark.getAttribute('aria-invalid')).toBe('true')
    expect(mark.getAttribute('aria-describedby')).toMatch(/-status$/)

    expect(within(results()).getByText(/Enter units and a score or grade/)).toBeTruthy()
    await fill(1, 4, '3', '55')
    expect(within(results()).getByText('3.00')).toBeTruthy()
  })

  it('shows the calm note below 2.40, for the CGPA or the latest semester', async () => {
    mockApi({ '/api/grading-scale': LOCAL_SCALE })
    renderRoute(PATH)
    await screen.findByRole('heading', { level: 2, name: 'Semester 1' })

    await fill(1, 1, '3', 'C') // 9
    await fill(1, 2, '2', '42') // E: 2 → 11 ÷ 5 = 2.20
    expect(within(results()).getByText(/out of 5\.00 · Fail/)).toBeTruthy()
    const note =
      'Below the 2.40 pass mark. Check the academic standing rules and speak to your level adviser.'
    expect(within(results()).getByText(note)).toBeTruthy()
    expect(main().textContent).not.toMatch(/you are on probation/i)

    // Lift the CGPA above 2.40 with a strong first semester… the note goes.
    await fill(1, 3, '3', 'A') // 26 ÷ 8 = 3.25
    expect(within(results()).queryByText(note)).toBeNull()
    // …a weak latest semester brings it back, even with the CGPA above the pass mark.
    await userEvent.click(within(main()).getByRole('button', { name: 'Add a semester' }))
    await fill(2, 1, '1', 'F') // CGPA 26 ÷ 9 = 2.89, semester 2 GPA 0.00
    expect(within(results()).getByText('2.89')).toBeTruthy()
    expect(within(results()).getByText('Semester 2: 0.00')).toBeTruthy()
    expect(within(results()).getByText(note)).toBeTruthy()
  })

  it('can be used with the keyboard alone, with focus following each change', async () => {
    mockApi({ '/api/grading-scale': LOCAL_SCALE })
    const user = userEvent.setup()
    renderRoute(PATH)
    await screen.findByRole('heading', { level: 2, name: 'Semester 1' })

    // Course 1: type a code, choose units with the arrow keys, type a score.
    within(course(1, 1))
      .getByLabelText(/Course code/)
      .focus()
    await user.keyboard('PHA 301')
    await user.tab()
    expect(document.activeElement).toBe(within(course(1, 1)).getByLabelText('Units'))
    // A native <select>: browsers change it with the arrow keys; jsdom can't, so pick directly.
    await user.selectOptions(document.activeElement as HTMLSelectElement, '3')
    await user.tab()
    await user.keyboard('68')
    expect(within(course(1, 1)).getByText('Grade B · 4 points × 3 units')).toBeTruthy()

    // Add a course: focus lands in its code box.
    within(semester(1)).getByRole('button', { name: 'Add a course' }).focus()
    await user.keyboard('{Enter}')
    expect(within(semester(1)).getAllByRole('group')).toHaveLength(5)
    expect(document.activeElement).toBe(within(course(1, 5)).getByLabelText(/Course code/))

    // Remove course 1 (named by its code): focus moves to the course that took its place.
    within(course(1, 1))
      .getByRole('button', { name: 'Remove semester 1, course 1 (PHA 301)' })
      .focus()
    await user.keyboard('{Enter}')
    expect(within(semester(1)).getAllByRole('group')).toHaveLength(4)
    expect(document.activeElement).toBe(within(course(1, 1)).getByLabelText(/Course code/))

    // Add a semester, then remove it: focus goes into it, then back to "Add a semester".
    within(main()).getByRole('button', { name: 'Add a semester' }).focus()
    await user.keyboard('{Enter}')
    expect(document.activeElement).toBe(within(course(2, 1)).getByLabelText(/Course code/))
    within(semester(2)).getByRole('button', { name: 'Remove semester 2' }).focus()
    await user.keyboard('{Enter}')
    expect(within(main()).queryByRole('heading', { name: 'Semester 2' })).toBeNull()
    expect(document.activeElement).toBe(
      within(main()).getByRole('button', { name: 'Add a semester' }),
    )
  })

  it('stores and sends nothing: the only request is for the grading scale', async () => {
    const fetchMock = mockApi({ '/api/grading-scale': LOCAL_SCALE })
    const setItem = vi.spyOn(Storage.prototype, 'setItem')
    renderRoute(PATH)
    await screen.findByRole('heading', { level: 2, name: 'Semester 1' })
    await fill(1, 1, '3', '72')
    await fill(1, 2, '2', 'B')
    await userEvent.click(within(main()).getByRole('button', { name: 'Add a semester' }))
    await fill(2, 1, '1', '50')

    const urls = fetchMock.mock.calls.map(([input]) => new URL(String(input), 'http://x').pathname)
    expect(new Set(urls)).toEqual(new Set(['/api/grading-scale']))
    expect(setItem.mock.calls.filter(([key]) => key !== 'pans-theme')).toEqual([])
    expect(main().querySelector('form')).toBeNull()
  })

  it('uses the scale from the API, and the bundled copy if the API fails', async () => {
    // A changed scale (A from 75) proves the API's scale is the one used.
    mockApi({
      '/api/grading-scale': {
        ...LOCAL_SCALE,
        grades: LOCAL_SCALE.grades.map((g) =>
          g.letter === 'A' ? { ...g, min: 75 } : g.letter === 'B' ? { ...g, max: 74 } : g,
        ),
      },
    })
    renderRoute(PATH)
    await within(main()).findByText('75–100')
    await fill(1, 1, '3', '72')
    expect(within(course(1, 1)).getByText(/Grade B/)).toBeTruthy()
  })

  it('keeps working with the bundled scale when the API is down', async () => {
    mockApi({
      '/api/grading-scale': () => jsonResponse(500, apiError('INTERNAL', 'Something went wrong')),
    })
    renderRoute(PATH)
    await screen.findByRole('heading', { level: 2, name: 'Semester 1' })
    await fill(1, 1, '3', '72')
    expect(within(course(1, 1)).getByText(/Grade A/)).toBeTruthy()
    expect(within(main()).getByText('70–100')).toBeTruthy()
    expect(
      within(main()).getByText(
        /Calculated with the Faculty of Pharmacy grading scale \(student handbook §3\.5\)\. Your official result is the one issued by the University\./,
      ),
    ).toBeTruthy()
  })
})
