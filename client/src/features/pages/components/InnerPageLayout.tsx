import type { ReactNode } from 'react'
import type { NavSection } from '../../../app/siteMap.ts'
import { Container } from '../../../components/layout/Container.tsx'
import { PageHeader } from '../../../components/layout/PageHeader.tsx'
import { SectionNav } from '../../../components/layout/SectionNav.tsx'
import { usePageTitle } from '../../../lib/usePageTitle.ts'

type Props = {
  title: string
  /** The menu section the page belongs to: shown in the breadcrumb and as links beside the page. */
  section: NavSection
  intro?: ReactNode
  children: ReactNode
}

/** Header band, then the content with the section's other pages beside it (below it on phones). */
export function InnerPageLayout({ title, section, intro, children }: Props) {
  usePageTitle(title)
  return (
    <>
      <PageHeader
        title={title}
        intro={intro}
        breadcrumbs={section.to === '/' ? [] : [{ label: section.label, to: section.to }]}
      />
      <Container className="grid gap-10 py-10 lg:grid-cols-[minmax(0,1fr)_14rem] lg:gap-16">
        <div className="flex min-w-0 max-w-[45rem] flex-col gap-10">{children}</div>
        <aside className="lg:pt-1">
          <SectionNav section={section} />
        </aside>
      </Container>
    </>
  )
}
