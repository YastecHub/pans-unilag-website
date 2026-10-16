import { formatDate } from '../../../lib/dates.ts'
import { daysLeft, type Opportunity } from '../api/opportunities.ts'

/** "Closes 30 Oct 2026 · 3 days left", "Closes today", or "Open: apply any time". */
export function Deadline({ opportunity: o }: { opportunity: Pick<Opportunity, 'deadline'> }) {
  if (!o.deadline) return <span>Open: apply any time</span>
  const left = daysLeft(o)
  // One span, so the spaces survive inside flex containers.
  return (
    <span>
      {left === 0 ? (
        'Closes today'
      ) : (
        <>
          Closes <time dateTime={o.deadline}>{formatDate(o.deadline)}</time>
        </>
      )}
      {left !== null && left > 0 && left <= 7 && (
        <span className="font-normal text-text-muted">
          {' '}
          · {left} {left === 1 ? 'day' : 'days'} left
        </span>
      )}
    </span>
  )
}
