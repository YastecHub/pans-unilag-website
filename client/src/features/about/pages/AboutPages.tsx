import { navSection } from '../../../app/siteMap.ts'
import { ButtonLink } from '../../../components/ui/Button.tsx'
import { Placeholder } from '../../../components/ui/Placeholder.tsx'
import { ContentPage } from '../../pages/components/ContentPage.tsx'
import { InnerPageLayout } from '../../pages/components/InnerPageLayout.tsx'

const about = () => navSection('About')

/** /about: name, motto, preamble, objectives (pages.json "who-we-are"). */
export function WhoWeArePage() {
  return <ContentPage slug="who-we-are" title="Who we are" section={about()} />
}

/** /about/membership: members, patrons, rights, discipline. */
export function MembershipPage() {
  return <ContentPage slug="membership-and-rights" title="Membership & rights" section={about()} />
}

/**
 * /about/history: a placeholder until the milestones are verified (README → Content table).
 * Never invent dates: the timeline appears only once each one is confirmed.
 */
export function HistoryPage() {
  return (
    <InnerPageLayout title="History & milestones" section={about()}>
      <Placeholder
        title="Our history is being written up"
        note="A timeline of PANS UNILAG milestones, such as the first Pharmalympics and the first Pharmathon, will appear here once each date is verified."
      />
      <div className="flex flex-wrap gap-3">
        <ButtonLink to="/events/past" variant="outline">
          See past events
        </ButtonLink>
        <ButtonLink to="/gallery" variant="outline">
          Open the gallery
        </ButtonLink>
      </div>
    </InnerPageLayout>
  )
}

/** /about/impact: a placeholder until the figures are confirmed. */
export function ImpactPage() {
  return (
    <InnerPageLayout title="Impact" section={about()}>
      <Placeholder
        title="Our impact figures are being gathered"
        note="Numbers from our outreaches, campaigns and programmes will appear here once they are confirmed by the committees that ran them."
      />
      <div className="flex flex-wrap gap-3">
        <ButtonLink to="/leadership/committees" variant="outline">
          See what our committees do
        </ButtonLink>
      </div>
    </InnerPageLayout>
  )
}
