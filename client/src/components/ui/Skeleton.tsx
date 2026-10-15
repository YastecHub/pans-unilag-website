/** A grey shape that stands in for content while it loads. Size it with className (h-4 w-1/2). */
export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={`block animate-pulse rounded-md bg-surface-alt motion-reduce:animate-none ${className}`}
    />
  )
}

/** A card-shaped skeleton matching the event and album cards. */
export function SkeletonCard() {
  return (
    <div aria-hidden className="flex flex-col overflow-hidden rounded-xl border border-border">
      <Skeleton className="aspect-video rounded-none" />
      <div className="flex flex-col gap-2.5 p-4">
        <Skeleton className="h-3 w-1/3" />
        <Skeleton className="h-5 w-5/6" />
        <Skeleton className="h-5 w-3/5" />
      </div>
    </div>
  )
}
