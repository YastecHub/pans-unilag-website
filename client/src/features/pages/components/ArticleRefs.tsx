import { Link } from 'react-router'

/** "Constitution: Art. 4 S.A, Art. 15", linking to the Constitution page so readers can check. */
export function ArticleRefs({ refs }: { refs: string[] }) {
  if (refs.length === 0) return null
  return (
    <p className="text-small text-text-muted">
      <Link to="/governance/constitution" className="font-medium">
        Constitution
      </Link>
      : {refs.join(', ')}
    </p>
  )
}
