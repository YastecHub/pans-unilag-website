import { Link } from 'react-router'
import { ButtonLink } from '../../../components/ui/Button.tsx'
import { HomeSection } from './HomeSection.tsx'

/** Static: points graduates to the alumni sign-up form (/connect/alumni). */
export function AlumniSection() {
  return (
    <HomeSection
      id="alumni"
      title="PANS alumni network"
      intro="Graduated from the Faculty of Pharmacy? Stay connected with PANS UNILAG and help the students coming after you: mentoring, speaking at events, sharing internships and jobs, and supporting PANS."
    >
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        <ButtonLink to="/connect/alumni">Join the alumni network</ButtonLink>
        <Link to="/leadership/committees/alumni-network" className="font-heading font-medium">
          About the Alumni Network Committee
        </Link>
      </div>
    </HomeSection>
  )
}
