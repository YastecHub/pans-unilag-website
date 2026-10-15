import { Link } from 'react-router'
import { Container } from '../../components/layout/Container.tsx'
import { usePageTitle } from '../../lib/usePageTitle.ts'

export function NotFoundPage() {
  usePageTitle('Page not found')
  return (
    <Container className="flex flex-col gap-4 py-16">
      <p className="text-small font-medium tracking-widest text-text-brand uppercase">Error 404</p>
      <h1>Page not found</h1>
      <p className="max-w-2xl text-text-muted">
        We couldn’t find that page. It may have moved, or the link may be wrong.
      </p>
      <ul className="flex flex-wrap gap-x-6 gap-y-2">
        <li>
          <Link to="/">Go to the home page</Link>
        </li>
        <li>
          <Link to="/events">See events</Link>
        </li>
        <li>
          <Link to="/search">Search the site</Link>
        </li>
      </ul>
    </Container>
  )
}
