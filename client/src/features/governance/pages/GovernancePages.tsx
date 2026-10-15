import { navSection } from '../../../app/siteMap.ts'
import { ButtonLink } from '../../../components/ui/Button.tsx'
import { DocumentDownload } from '../../documents/components/DocumentDownload.tsx'
import { ContentPage } from '../../pages/components/ContentPage.tsx'

const governance = () => navSection('Governance')

type Related = { label: string; to: string }

/** Links from a governance page to where its rules play out (the people, the committees). */
function RelatedLinks({ links }: { links: Related[] }) {
  return (
    <nav aria-label="Related pages" className="flex flex-wrap gap-3">
      {links.map((l) => (
        <ButtonLink key={l.to} to={l.to} variant="outline">
          {l.label}
        </ButtonLink>
      ))}
    </nav>
  )
}

/** /governance: Congress, the EC, the Senate, dissolution, representation, standing committees. */
export function GovernancePage() {
  return (
    <ContentPage
      slug="governance"
      title="How PANS is governed"
      section={governance()}
      after={
        <RelatedLinks
          links={[
            { label: 'Meet the Executive Council', to: '/leadership/executive-council' },
            { label: 'The Senate', to: '/leadership/senate' },
            { label: 'Committees for 2026/27', to: '/leadership/committees' },
          ]}
        />
      }
    />
  )
}

/** /governance/elections: eligibility, by-elections, the Electoral Committee, swearing-in. */
export function ElectionsPage() {
  return (
    <ContentPage
      slug="elections"
      title="Elections"
      section={governance()}
      after={
        <RelatedLinks
          links={[{ label: 'Who holds office this session', to: '/leadership/executive-council' }]}
        />
      }
    />
  )
}

/** /governance/finance: budgets, reporting, controls, members' right to know. */
export function FinancePage() {
  return (
    <ContentPage
      slug="finance-and-accountability"
      title="Finance & accountability"
      section={governance()}
    />
  )
}

/** /governance/meetings: notice of sittings and standing orders. */
export function MeetingsPage() {
  return (
    <ContentPage
      slug="meetings-and-procedures"
      title="Meetings & procedures"
      section={governance()}
    />
  )
}

/** /governance/constitution: the PDF (once uploaded), how it is amended, the review committee. */
export function ConstitutionPage() {
  return (
    <ContentPage
      slug="constitution"
      title="Constitution"
      section={governance()}
      before={
        <DocumentDownload
          slug="constitution"
          pendingNote="The full constitution (55 pages) will be available to download here soon. Until then, every page on this site cites the articles it comes from."
        />
      }
    />
  )
}
