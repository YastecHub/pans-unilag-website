import { usePageTitle } from '../../../lib/usePageTitle.ts'
import { AnnouncementsSection } from '../components/AnnouncementsSection.tsx'
import { CommitteesSection } from '../components/CommitteesSection.tsx'
import { GallerySection } from '../components/GallerySection.tsx'
import { HeroSection } from '../components/HeroSection.tsx'
import { OpportunitiesSection } from '../components/OpportunitiesSection.tsx'
import { ToolsSection } from '../components/ToolsSection.tsx'
import { UpcomingEventsSection } from '../components/UpcomingEventsSection.tsx'

/**
 * The home page, sections in the README order (README → Home page sections).
 * Each data section loads on its own and handles its own loading, empty and error states,
 * so one slow or failing request never blanks the page.
 */
export function HomePage() {
  usePageTitle()
  return (
    <>
      <HeroSection />
      <AnnouncementsSection />
      <UpcomingEventsSection />
      <OpportunitiesSection />
      <CommitteesSection />
      <GallerySection />
      <ToolsSection />
    </>
  )
}
