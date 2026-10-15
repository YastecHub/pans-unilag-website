import { ButtonAnchor } from '../../../components/ui/Button.tsx'
import { Card } from '../../../components/ui/Card.tsx'
import { Placeholder } from '../../../components/ui/Placeholder.tsx'
import { Skeleton } from '../../../components/ui/Skeleton.tsx'
import { ErrorState, LoadingState } from '../../../components/ui/States.tsx'
import { formatDate } from '../../../lib/dates.ts'
import { downloadLabel, useDocuments } from '../api/documents.ts'

type Props = {
  /** Slug in /api/documents, e.g. "constitution". */
  slug: string
  /** What readers are waiting for, shown until the PDF is uploaded. */
  pendingNote: string
}

/**
 * The download card for one official document. Until its PDF is uploaded it is a placeholder;
 * the admin's placeholder note is internal, so readers get `pendingNote` instead.
 */
export function DocumentDownload({ slug, pendingNote }: Props) {
  const query = useDocuments()

  if (query.isPending) {
    return (
      <LoadingState label="Loading the document">
        <Skeleton className="h-28 w-full rounded-xl" />
      </LoadingState>
    )
  }
  if (query.isError) {
    return (
      <ErrorState
        title="We couldn’t load the download link."
        error={query.error}
        onRetry={() => query.refetch()}
      />
    )
  }

  const doc = query.data.find((d) => d.slug === slug)
  if (!doc || doc.isPlaceholder || !doc.fileUrl) {
    return <Placeholder title="PDF coming soon" note={pendingNote} />
  }

  return (
    <Card as="article" className="gap-3">
      <h2 className="text-h3">{doc.title}</h2>
      <p className="text-small text-text-muted">
        Version {doc.version} · approved {formatDate(doc.approvedOn)}
        {doc.approvedBy && ` by ${doc.approvedBy}`}
      </p>
      {doc.summary && <p>{doc.summary}</p>}
      <div>
        <ButtonAnchor href={doc.fileUrl} target="_blank" rel="noopener noreferrer">
          Download the {slug === 'constitution' ? 'constitution' : 'document'} ({downloadLabel(doc)}
          ) <span className="sr-only">(opens in a new tab)</span>
        </ButtonAnchor>
      </div>
    </Card>
  )
}
