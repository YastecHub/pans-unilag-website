import { usePageTitle } from '../../../lib/usePageTitle.ts'
import { GallerySection } from '../components/GallerySection.tsx'
import { HeroSection } from '../components/HeroSection.tsx'
import { LeadershipSection } from '../components/LeadershipSection.tsx'
import { ToolsSection } from '../components/ToolsSection.tsx'
import { UpcomingEventsSection } from '../components/UpcomingEventsSection.tsx'

/**
 * The home page: Hero, Upcoming Events with dates/venues/links, PANS Leadership 26/27 slider,
 * Gallery, and Student Tools.
 */
export function HomePage() {
  usePageTitle()
  return (
    <>
      <HeroSection />
      <UpcomingEventsSection />
      <LeadershipSection />
      <GallerySection />
      <ToolsSection />
    </>
  )
}
