import { Container } from '../../components/layout/Container.tsx'
import { Placeholder } from '../../components/ui/Placeholder.tsx'
import { usePageTitle } from '../../lib/usePageTitle.ts'
import type { StubPage } from '../siteMap.ts'

/** Temporary page: shows the real title and which issue builds the page. */
export function PageStub({ page }: { page: StubPage }) {
  usePageTitle(page.title)
  return (
    <Container className="flex flex-col gap-6 py-12">
      <h1>{page.title}</h1>
      <Placeholder
        note={`This page is being built (issue #${page.issue}).`}
        className="max-w-2xl"
      />
    </Container>
  )
}
