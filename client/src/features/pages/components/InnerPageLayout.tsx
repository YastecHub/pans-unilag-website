import type { ReactNode } from 'react'
import type { NavSection } from '../../../app/siteMap.ts'
import { Container } from '../../../components/layout/Container.tsx'
import { type Crumb, PageHeader } from '../../../components/layout/PageHeader.tsx'
import { SectionNav } from '../../../components/layout/SectionNav.tsx'
import { usePageTitle } from '../../../lib/usePageTitle.ts'

type Props = {
  title: string
  /** The menu section the page belongs to: shown in the breadcrumb and as links beside the page. */
  section: NavSection
  intro?: ReactNode
  eyebrow?: string
  /** Extra breadcrumb steps between the section and this page, e.g. Committees on a committee page. */
  trail?: Crumb[]
  /** Replaces the section links beside the content (e.g. a committee's officers). */
  aside?: ReactNode
  /** Let the content use the full width (card grids); text pages keep a readable line length. */
  wide?: boolean
  children: ReactNode
}

/** Header band, then the content with the section's other pages beside it (below it on phones). */
export function InnerPageLayout({
  title,
  section,
  intro,
  eyebrow,
  trail = [],
  aside,
  wide = false,
  children,
}: Props) {
  usePageTitle(title)
  return (
    <>
      <PageHeader
        title={title}
        intro={intro}
        eyebrow={eyebrow}
        breadcrumbs={[{ label: section.label, to: section.to }, ...trail]}
      />
      <Container
        className={`grid gap-10 py-10 lg:gap-16 ${aside ? 'lg:grid-cols-[minmax(0,1fr)_20rem]' : 'lg:grid-cols-[minmax(0,1fr)_14rem]'}`}
      >
        <div className={`flex min-w-0 flex-col gap-10 ${aside || wide ? '' : 'max-w-[45rem]'}`}>
          {children}
        </div>
        <aside className="flex flex-col gap-8 lg:pt-1">
          {aside ?? <SectionNav section={section} />}
        </aside>
      </Container>
    </>
  )
}
