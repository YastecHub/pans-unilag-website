import { Container } from '../../components/layout/Container.tsx'

/** Shown if a page crashes while rendering. Kept simple: no header, so it can't crash too. */
export function RouteErrorPage() {
  return (
    <main id="main">
      <Container className="flex flex-col gap-4 py-16">
        <h1>Something went wrong</h1>
        <p className="max-w-2xl text-text-muted">
          Please reload the page. If it keeps happening, tell us through the feedback form.
        </p>
        <p>
          <a href="/">Go to the home page</a>
        </p>
      </Container>
    </main>
  )
}
