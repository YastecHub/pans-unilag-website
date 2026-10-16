import { navSection } from '../../../app/siteMap.ts'
import { ButtonLink } from '../../../components/ui/Button.tsx'
import { ContentPage } from '../../pages/components/ContentPage.tsx'

/**
 * /academics/student-support: who to turn to for academic or welfare help (pages.json
 * "student-support": the Welfare Secretary, the Academic and Welfare Committees, complaints).
 */
export function StudentSupportPage() {
  return (
    <ContentPage
      slug="student-support"
      title="Student support"
      section={navSection('Academics')}
      after={
        <section aria-labelledby="support-next-title" className="flex flex-col gap-3">
          <h2 id="support-next-title" className="text-h3">
            Get help now
          </h2>
          <nav aria-labelledby="support-next-title" className="flex flex-wrap gap-3">
            <ButtonLink to="/connect/feedback">Send feedback or a complaint</ButtonLink>
            <ButtonLink to="/leadership/executive-council" variant="outline">
              Find the Welfare Secretary
            </ButtonLink>
            <ButtonLink to="/leadership/committees/academics" variant="outline">
              Academics Committee
            </ButtonLink>
            <ButtonLink to="/academics/cgpa-calculator" variant="outline">
              CGPA calculator
            </ButtonLink>
          </nav>
        </section>
      }
    />
  )
}
