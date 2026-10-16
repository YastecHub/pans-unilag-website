import { Link } from 'react-router'
import { navSection } from '../../../app/siteMap.ts'
import { ButtonAnchor } from '../../../components/ui/Button.tsx'
import { Img } from '../../../components/ui/Img.tsx'
import { Placeholder, PlaceholderImage } from '../../../components/ui/Placeholder.tsx'
import { SkeletonCard } from '../../../components/ui/Skeleton.tsx'
import { ErrorState, LoadingState } from '../../../components/ui/States.tsx'
import { formatMonthRange } from '../../../lib/dates.ts'
import { InnerPageLayout } from '../../pages/components/InnerPageLayout.tsx'
import {
  bySeries,
  comingSoonText,
  type Publication,
  type PublicationSeries,
  usePublications,
} from '../api/publications.ts'

const grid = 'grid grid-cols-[repeat(auto-fill,minmax(14rem,1fr))] gap-4'

/**
 * /publications: Recipharm, the newspaper and Substack. Each series shows its published editions,
 * or a clearly marked placeholder until the Editor-in-Chief supplies them.
 */
export function PublicationsPage() {
  const query = usePublications()

  return (
    <InnerPageLayout
      title="Publications"
      section={navSection('Publications')}
      intro="Recipharm, our newspaper and our Substack: the writing of PANS UNILAG students."
      aside={<PublicationsAside />}
      wide
    >
      {query.isPending ? (
        <LoadingState label="Loading publications">
          <div className={grid}>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        </LoadingState>
      ) : query.isError ? (
        <ErrorState
          title="We couldn’t load publications."
          error={query.error}
          onRetry={() => query.refetch()}
        />
      ) : (
        bySeries(query.data).map((group) => (
          <section
            key={group.series}
            id={group.series}
            aria-labelledby={`${group.series}-title`}
            className="flex scroll-mt-24 flex-col gap-4"
          >
            <div className="flex flex-col gap-1">
              <h2 id={`${group.series}-title`} className="text-h3">
                {group.label}
              </h2>
              <p className="text-text-muted">{group.about}</p>
            </div>
            {group.published.length === 0 ? (
              // Nothing out yet: one placeholder for the series (README → Placeholder rules).
              <Placeholder note={comingSoonText(group.series)} />
            ) : (
              <ul className={grid}>
                {group.published.map((p) => (
                  <li key={p.slug}>
                    <EditionCard publication={p} />
                  </li>
                ))}
                {/* Editions we know are coming, e.g. "Recipharm 2026 edition coming soon". */}
                {group.pending
                  .filter((p) => p.edition)
                  .map((p) => (
                    <li key={p.slug}>
                      <ComingSoonCard series={group.series} edition={p.edition} />
                    </li>
                  ))}
              </ul>
            )}
          </section>
        ))
      )}
    </InnerPageLayout>
  )
}

const card = 'flex h-full flex-col gap-3 rounded-xl border border-border bg-surface p-4'

const readLabel = (p: Publication) => (p.series === 'substack' ? 'Read on Substack' : 'Read online')

/** A published edition: cover, title, date, summary, and the PDF or the link. */
function EditionCard({ publication: p }: { publication: Publication }) {
  const heading = p.edition ? `${p.title} ${p.edition}` : p.title
  return (
    <article className={card}>
      {p.cover ? (
        <Img
          publicId={p.cover}
          alt={`Cover of ${heading}`}
          width={300}
          height={400}
          className="w-full rounded-lg"
        />
      ) : p.series !== 'substack' ? (
        // Magazines and newspapers have covers; a Substack link doesn't, so it gets no image.
        <PlaceholderImage kind="badge" aspectRatio="3 / 4" />
      ) : null}
      <div className="flex flex-col gap-1">
        <h3 className="text-[1.125rem]">{heading}</h3>
        {p.publishedOn && (
          <time dateTime={p.publishedOn} className="text-small text-text-muted">
            {formatMonthRange(p.publishedOn, p.publishedOn)}
          </time>
        )}
      </div>
      {p.summary && <p className="text-small">{p.summary}</p>}
      <div className="mt-auto pt-1">
        {p.fileUrl ? (
          <ButtonAnchor
            href={p.fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            size="sm"
            aria-label={`Read the PDF of ${heading} (opens in a new tab)`}
          >
            Read the PDF
          </ButtonAnchor>
        ) : p.link ? (
          <ButtonAnchor
            href={p.link}
            target="_blank"
            rel="noopener noreferrer"
            size="sm"
            aria-label={`${readLabel(p)}: ${heading} (opens in a new tab)`}
          >
            {readLabel(p)}
          </ButtonAnchor>
        ) : null}
      </div>
    </article>
  )
}

/** A known edition still to come: the standard cover placeholder and what will appear. */
function ComingSoonCard({ series, edition }: { series: PublicationSeries; edition: string }) {
  return (
    <div className={card}>
      <PlaceholderImage kind="badge" aspectRatio="3 / 4" />
      <p className="text-small font-medium text-text-muted">{comingSoonText(series, edition)}</p>
    </div>
  )
}

function PublicationsAside() {
  return (
    <section aria-labelledby="publications-about-title" className="flex flex-col gap-2">
      <h2 id="publications-about-title" className="text-[1.25rem]">
        About our publications
      </h2>
      <p className="text-small">
        The Editorial Board, chaired by the Editor-in-Chief, publishes Recipharm every year.
      </p>
      <p className="text-small">
        Want to write for us? <Link to="/connect/feedback">Get in touch</Link>.
      </p>
    </section>
  )
}
