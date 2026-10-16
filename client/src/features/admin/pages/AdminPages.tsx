import { Link, useSearchParams } from 'react-router'
import { Badge } from '../../../components/ui/Badge.tsx'
import { EmptyState } from '../../../components/ui/States.tsx'
import { formatDate } from '../../../lib/dates.ts'
import { usePageTitle } from '../../../lib/usePageTitle.ts'
import {
  FEEDBACK_STATUSES,
  type FeedbackStatus,
  PAGE_SIZE,
  useAlumni,
  useFeedback,
  useMe,
  usePlaceholders,
} from '../api.ts'
import { AdminQuery, Pager } from '../components/AdminQuery.tsx'

const pageNumber = (value: string | null) => Math.max(1, Number.parseInt(value ?? '1', 10) || 1)

const CATEGORY_LABELS = {
  suggestion: 'Suggestion',
  complaint: 'Complaint',
  welfare: 'Welfare',
  other: 'Other',
} as const

const INTEREST_LABELS: Record<string, string> = {
  mentoring: 'Mentoring',
  speaking: 'Speaking',
  'internships-and-jobs': 'Internships & jobs',
  events: 'Events',
  'supporting-pans': 'Supporting PANS',
}

/** /admin: what needs attention. */
export function OverviewPage() {
  usePageTitle('Admin')
  const me = useMe()
  const placeholders = usePlaceholders()
  const newFeedback = useFeedback({ status: 'new', page: 1 })
  const alumni = useAlumni(1)
  const count = (n: number | undefined) => (n === undefined ? '…' : String(n))

  return (
    <>
      <h1 className="text-h2">Welcome{me.data ? `, ${me.data.name.split(' ')[0]}` : ''}</h1>
      <ul className="grid gap-4 sm:grid-cols-3">
        {[
          {
            to: '/admin/placeholders',
            value: count(placeholders.data?.total),
            label: 'placeholders to fill',
          },
          {
            to: '/admin/feedback?status=new',
            value: count(newFeedback.data?.total),
            label: 'new feedback messages',
          },
          { to: '/admin/alumni', value: count(alumni.data?.total), label: 'alumni signed up' },
        ].map((card) => (
          <li key={card.to}>
            <Link
              to={card.to}
              aria-label={`${card.value} ${card.label}`}
              className="flex h-full flex-col gap-1 rounded-xl border border-border p-5 text-text no-underline hover:border-border-strong"
            >
              <span className="font-heading text-h2 font-semibold text-text-brand">
                {card.value}
              </span>
              <span>{card.label}</span>
            </Link>
          </li>
        ))}
      </ul>
      <p className="text-small text-text-muted">
        Editors for announcements, events and opportunities are coming next. Until then, this is
        where to see what’s missing and what students and alumni have sent.
      </p>
    </>
  )
}

/** /admin/placeholders: every missing piece of content, grouped by the page it shows on. */
export function PlaceholdersPage() {
  usePageTitle('Placeholders · Admin')
  const query = usePlaceholders()
  return (
    <>
      <div className="flex flex-col gap-1">
        <h1 className="text-h2">Placeholders</h1>
        <p className="text-text-muted">
          Content the site is still waiting for. Each item shows as “Coming soon” until it’s filled.
        </p>
      </div>
      <AdminQuery query={query} label="placeholders">
        {(data) =>
          data.total === 0 ? (
            <EmptyState title="Nothing missing: every placeholder has been filled." />
          ) : (
            <>
              <p role="status">
                {data.total} {data.total === 1 ? 'item' : 'items'} to fill across{' '}
                {data.groups.filter((g) => g.items.length > 0).length} pages.
              </p>
              {data.groups
                .filter((g) => g.items.length > 0)
                .map((group) => (
                  <section
                    key={group.collection}
                    aria-labelledby={`ph-${group.collection}`}
                    className="flex flex-col gap-3"
                  >
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <h2 id={`ph-${group.collection}`} className="text-h3">
                        {group.page}{' '}
                        <span className="text-small font-normal text-text-muted">
                          ({group.items.length})
                        </span>
                      </h2>
                      <Link to={group.path} target="_blank" rel="noopener">
                        View the page
                        <span className="sr-only">: {group.page} (opens in a new tab)</span>
                      </Link>
                    </div>
                    <ul className="flex flex-col divide-y divide-border rounded-xl border border-border">
                      {group.items.map((item) => (
                        <li key={item.id} className="flex flex-col gap-1 p-4">
                          <span className="font-medium">{item.label}</span>
                          <span className="text-small">{item.note}</span>
                          {item.updatedAt && (
                            <span className="text-small text-text-muted">
                              Last changed {formatDate(item.updatedAt)}
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </section>
                ))}
            </>
          )
        }
      </AdminQuery>
    </>
  )
}

/** /admin/feedback?status=new&page=2: messages from the feedback form, newest first (read-only). */
export function FeedbackPage() {
  usePageTitle('Feedback · Admin')
  const [params] = useSearchParams()
  const requested = params.get('status')
  const status = FEEDBACK_STATUSES.includes(requested as FeedbackStatus)
    ? (requested as FeedbackStatus)
    : undefined
  const page = pageNumber(params.get('page'))
  const query = useFeedback({ status, page })
  const href = (p: number, s = status) =>
    `/admin/feedback?${new URLSearchParams({ ...(s ? { status: s } : {}), ...(p > 1 ? { page: String(p) } : {}) })}`

  return (
    <>
      <div className="flex flex-col gap-1">
        <h1 className="text-h2">Feedback</h1>
        <p className="text-text-muted">
          From the feedback form. Anonymous unless the sender left an email. Messages are deleted
          after 12 months.
        </p>
      </div>
      <nav aria-label="Filter by status">
        <ul className="flex flex-wrap gap-2">
          {[undefined, ...FEEDBACK_STATUSES].map((s) => (
            <li key={s ?? 'all'}>
              <Link
                to={href(1, s)}
                aria-current={status === s ? 'page' : undefined}
                className={`inline-flex min-h-10 items-center rounded-full border-2 px-4 text-small font-medium capitalize no-underline ${
                  status === s
                    ? 'border-primary-border bg-primary text-on-primary'
                    : 'border-border text-text-brand'
                }`}
              >
                {s ?? 'All'}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <AdminQuery query={query} label="feedback">
        {(data) =>
          data.items.length === 0 ? (
            <EmptyState title={status ? `No ${status} messages.` : 'No feedback yet.'} />
          ) : (
            <>
              <ol className="flex flex-col gap-3">
                {data.items.map((f) => (
                  <li key={f.id}>
                    <article className="flex flex-col gap-2 rounded-xl border border-border p-4">
                      <div className="flex flex-wrap items-center gap-2 text-small">
                        <Badge tone={f.category === 'welfare' ? 'accent' : 'brand'}>
                          {CATEGORY_LABELS[f.category] ?? f.category}
                        </Badge>
                        <Badge tone="neutral">{f.status}</Badge>
                        <time dateTime={f.createdAt} className="text-text-muted">
                          {formatDate(f.createdAt)}
                        </time>
                      </div>
                      <p className="whitespace-pre-line">{f.message}</p>
                      <p className="text-small text-text-muted">
                        {f.contactEmail ? (
                          <>
                            Reply to <a href={`mailto:${f.contactEmail}`}>{f.contactEmail}</a>
                          </>
                        ) : (
                          'Anonymous'
                        )}
                        {f.category === 'welfare' && ' · For the Welfare Secretary'}
                      </p>
                    </article>
                  </li>
                ))}
              </ol>
              <Pager
                page={data.page}
                total={data.total}
                pageSize={PAGE_SIZE}
                hrefFor={(p) => href(p)}
              />
            </>
          )
        }
      </AdminQuery>
    </>
  )
}

/** /admin/alumni?page=2: the alumni network sign-ups (read-only; never published). */
export function AlumniPage() {
  usePageTitle('Alumni · Admin')
  const [params] = useSearchParams()
  const page = pageNumber(params.get('page'))
  const query = useAlumni(page)

  return (
    <>
      <div className="flex flex-col gap-1">
        <h1 className="text-h2">Alumni network</h1>
        <p className="text-text-muted">
          Sign-ups from the alumni form, for the Alumni Network Committee. Personal details: don’t
          share them outside the committee.
        </p>
      </div>
      <AdminQuery query={query} label="alumni">
        {(data) =>
          data.items.length === 0 ? (
            <EmptyState title="No alumni have signed up yet." />
          ) : (
            <>
              <p role="status">
                {data.total} {data.total === 1 ? 'person' : 'people'}
              </p>
              <div className="overflow-x-auto rounded-xl border border-border">
                <table className="w-full min-w-[44rem] border-collapse text-left text-small">
                  <caption className="sr-only">Alumni network sign-ups</caption>
                  <thead className="bg-surface-alt">
                    <tr>
                      {[
                        'Name',
                        'Graduated',
                        'Email',
                        'Phone',
                        'Interested in',
                        'Consent given',
                      ].map((h) => (
                        <th key={h} scope="col" className="p-3 font-heading font-medium">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.items.map((a) => (
                      <tr key={a.id} className="border-t border-border align-top">
                        <th scope="row" className="p-3 font-medium">
                          {a.name}
                        </th>
                        <td className="p-3">{a.graduationYear}</td>
                        <td className="p-3">
                          <a href={`mailto:${a.email}`}>{a.email}</a>
                        </td>
                        <td className="p-3">{a.phone || '—'}</td>
                        <td className="p-3">
                          {a.interests.map((i) => INTEREST_LABELS[i] ?? i).join(', ') || '—'}
                        </td>
                        <td className="p-3">
                          <time dateTime={a.consentAt}>{formatDate(a.consentAt)}</time>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pager
                page={data.page}
                total={data.total}
                pageSize={PAGE_SIZE}
                hrefFor={(p) => (p > 1 ? `/admin/alumni?page=${p}` : '/admin/alumni')}
              />
            </>
          )
        }
      </AdminQuery>
    </>
  )
}

export function AdminNotFoundPage() {
  usePageTitle('Not found · Admin')
  return (
    <>
      <h1 className="text-h2">Page not found</h1>
      <p>
        <Link to="/admin">Back to the overview</Link>
      </p>
    </>
  )
}
