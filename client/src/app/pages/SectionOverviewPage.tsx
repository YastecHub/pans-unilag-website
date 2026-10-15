import { Link } from 'react-router'
import { Container } from '../../components/layout/Container.tsx'
import { usePageTitle } from '../../lib/usePageTitle.ts'
import type { NavSection } from '../siteMap.ts'

/** Landing page for a menu section (e.g. /leadership): links to each of its pages. */
export function SectionOverviewPage({ section }: { section: NavSection }) {
  usePageTitle(section.label)
  return (
    <Container className="flex flex-col gap-8 py-12">
      <h1>{section.label}</h1>
      <ul className="grid grid-cols-[repeat(auto-fill,minmax(16rem,1fr))] gap-4">
        {section.children?.map((child) => (
          <li key={child.to}>
            <Link
              to={child.to}
              className="flex h-full flex-col gap-1 rounded-xl border border-border p-5 text-text no-underline hover:border-border-strong hover:bg-surface-alt"
            >
              <span className="font-heading text-h3 font-medium text-text-brand">
                {child.label}
              </span>
              <span className="text-text-muted">{child.description}</span>
            </Link>
          </li>
        ))}
      </ul>
    </Container>
  )
}
