import { navSection } from '../../../app/siteMap.ts'
import { InnerPageLayout } from '../../pages/components/InnerPageLayout.tsx'
import { useGradingScale } from '../cgpa/api.ts'
import { Calculator } from '../cgpa/components/Calculator.tsx'
import { formatPoint } from '../cgpa/model/cgpa.ts'
import type { GradingScale } from '../cgpa/model/scale.ts'

/** /academics/cgpa-calculator: the calculator, the scale it uses, and the standing rules. */
export function CgpaCalculatorPage() {
  const { scale } = useGradingScale()
  const pass = formatPoint(scale.passMark)

  return (
    <InnerPageLayout
      title="CGPA calculator"
      section={navSection('Academics')}
      intro={`Work out your GPA and CGPA on the Faculty of Pharmacy ${scale.grades[0]!.point}-point scale. Everything stays on your device: nothing is saved or sent.`}
      wide
    >
      <p className="text-small text-text-muted">
        For each course, choose its units ({scale.units.min} to {scale.units.max}) and type your
        score (0 to 100) or your grade ({scale.grades.map((g) => g.letter).join(', ')}). Leave a row
        empty to skip it.
      </p>

      <Calculator scale={scale} />

      <p className="text-small text-text-muted">
        Calculated with the Faculty of Pharmacy grading scale (student handbook §3.5). Your official
        result is the one issued by the University.
      </p>

      <ScaleTable scale={scale} />

      <section aria-labelledby="how-title" className="flex flex-col gap-3">
        <h2 id="how-title" className="text-h3">
          How it’s worked out
        </h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>Each course: units × grade point.</li>
          <li>GPA for a semester: the total of those, divided by the semester’s total units.</li>
          <li>CGPA: the same over every semester you enter.</li>
          <li>
            Results are shown to 2 decimal places, and Pass or Fail uses that rounded number: a CGPA
            from {pass} to 5.00 is a Pass, below {pass} is a Fail.
          </li>
          <li>The handbook doesn’t define classes of degree, so none are shown.</li>
        </ul>
      </section>

      <StandingExplainer pass={pass} />
    </InnerPageLayout>
  )
}

function ScaleTable({ scale }: { scale: GradingScale }) {
  return (
    <section aria-labelledby="scale-title" className="flex flex-col gap-3">
      <h2 id="scale-title" className="text-h3">
        The grading scale
      </h2>
      <div className="overflow-x-auto">
        <table className="w-full max-w-md border-collapse text-left">
          <caption className="sr-only">Scores, grades and grade points</caption>
          <thead>
            <tr className="border-b-2 border-border-strong">
              <th scope="col" className="py-2 pr-4">
                Score (%)
              </th>
              <th scope="col" className="py-2 pr-4">
                Grade
              </th>
              <th scope="col" className="py-2">
                Grade point
              </th>
            </tr>
          </thead>
          <tbody>
            {scale.grades.map((g) => (
              <tr key={g.letter} className="border-b border-border">
                <td className="py-2 pr-4">
                  {g.min}–{g.max}
                </td>
                <th scope="row" className="py-2 pr-4 font-medium">
                  {g.letter}
                </th>
                <td className="py-2">{g.point}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-small text-text-muted">
        Each course carries {scale.units.min} to {scale.units.max} credit units. The handbook prints
        F as “&lt;50”, which overlaps C, D and E; we read it as 0–39, to be confirmed with the
        Faculty.
      </p>
    </section>
  )
}

/** Handbook §3.7 (p. 23), as guidance only: the calculator never decides anyone's standing. */
function StandingExplainer({ pass }: { pass: string }) {
  return (
    <section aria-labelledby="standing-title" className="flex flex-col gap-3">
      <h2 id="standing-title" className="text-h3">
        Academic standing
      </h2>
      <p>
        A summary of the student handbook (§3.7). It’s guidance only: your level adviser and the
        Faculty decide your standing. The pass mark for every rule is {pass}.
      </p>
      <dl className="flex flex-col gap-3">
        {[
          ['Good standing', `Your CGPA and your semester GPA are both ${pass} or above.`],
          [
            'Warning',
            `You were in good standing and your CGPA is at least ${pass}, but your semester GPA is below ${pass}. This doesn’t apply to first-year students.`,
          ],
          [
            'Probation',
            `For example, on Warning and your semester GPA is below ${pass} again, or both your CGPA and GPA fall below ${pass}.`,
          ],
          [
            'Withdrawal',
            `For example, on Probation and your semester GPA is below ${pass} again; your CGPA below ${pass} for a third time after two probations; or absence for three semesters in a row.`,
          ],
          [
            'New students',
            `In your first year (100L, or 200L and 300L direct entry), a first-semester GPA below ${pass} means Probation, and below ${pass} again means Withdrawal.`,
          ],
        ].map(([term, detail]) => (
          <div key={term} className="rounded-lg border border-border p-3">
            <dt className="font-heading font-medium">{term}</dt>
            <dd className="text-small">{detail}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
