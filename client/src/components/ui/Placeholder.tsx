import badgeUrl from '../../assets/pans-badge.png'

/*
 * Placeholders mark content we are WAITING FOR (README → Placeholder rules). They all share one look:
 * a dashed border in text-muted, a surface-alt background, an icon and "Coming soon".
 * Never use them for empty lists: that is EmptyState.
 */

const frame = 'border-2 border-dashed border-text-muted bg-surface-alt text-text-muted'

type PlaceholderProps = {
  /** What will appear here, e.g. "Recipharm 2026 edition coming soon". */
  note?: string
  /** Defaults to "Coming soon". */
  title?: string
  className?: string
}

/** A block standing in for missing content (a write-up, a list of names, a document). */
export function Placeholder({ note, title = 'Coming soon', className = '' }: PlaceholderProps) {
  return (
    <div
      className={`flex flex-col items-center gap-2 rounded-xl px-6 py-8 text-center ${frame} ${className}`}
    >
      <svg
        className="size-9"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </svg>
      <p className="font-medium text-text">{title}</p>
      {note && <p className="text-small">{note}</p>}
    </div>
  )
}

type PlaceholderImageProps = {
  /** "person": a silhouette (officers). "badge": the PANS badge (events, albums, publications). */
  kind: 'person' | 'badge'
  /** CSS aspect ratio, e.g. "4 / 3". Defaults to 4 / 3 for people and 3 / 2 for badges. */
  aspectRatio?: string
  label?: string
  className?: string
}

/** Stands in for a photo we don't have yet. Announced to screen readers as "Photo coming soon". */
export function PlaceholderImage({
  kind,
  aspectRatio = kind === 'person' ? '4 / 3' : '3 / 2',
  label = 'Photo coming soon',
  className = '',
}: PlaceholderImageProps) {
  return (
    <div
      role="img"
      aria-label={label}
      style={{ aspectRatio }}
      className={`flex flex-col items-center justify-center gap-2 rounded-xl ${frame} ${className}`}
    >
      {kind === 'person' ? (
        <svg
          className="size-14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <circle cx="12" cy="8" r="4" />
          <path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" />
        </svg>
      ) : (
        <img src={badgeUrl} alt="" width={72} height={72} className="size-18 opacity-60" />
      )}
      <span aria-hidden className="text-small font-medium">
        {label}
      </span>
    </div>
  )
}

/** Inline stand-in for a missing detail: "Name to be announced", "Date to be announced". */
export function PlaceholderText({
  children,
  className = '',
}: {
  children: string
  className?: string
}) {
  return (
    <span
      className={`inline-flex items-center self-start rounded-full border border-dashed border-text-muted px-2.5 py-0.5 text-small text-text-muted ${className}`}
    >
      {children}
    </span>
  )
}
