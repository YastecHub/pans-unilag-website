import { Container } from '../../components/layout/Container.tsx'
import { usePageTitle } from '../../lib/usePageTitle.ts'
import type { StubPage } from '../siteMap.ts'

/** Temporary page: shows the real title and which issue builds the page. */
export function PageStub({ page }: { page: StubPage }) {
  usePageTitle(page.title)
  return (
    <Container className="flex flex-col gap-6 py-12">
      <h1>{page.title}</h1>
      <div className="flex max-w-2xl flex-col gap-1 rounded-xl border-2 border-dashed border-text-muted bg-surface-alt p-6 text-text-muted">
        <p className="font-medium text-text">Coming soon</p>
        <p>This page is being built (issue #{page.issue}).</p>
      </div>
    </Container>
  )
}
