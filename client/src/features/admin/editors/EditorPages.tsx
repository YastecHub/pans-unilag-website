import { type FormEvent, useEffect, useRef, useState } from 'react'
import { Link, Navigate, useLocation, useNavigate, useParams, useSearchParams } from 'react-router'
import { Badge } from '../../../components/ui/Badge.tsx'
import { Button, ButtonLink } from '../../../components/ui/Button.tsx'
import { EmptyState } from '../../../components/ui/States.tsx'
import { formatDate } from '../../../lib/dates.ts'
import { ApiError } from '../../../lib/http.ts'
import { usePageTitle } from '../../../lib/usePageTitle.ts'
import { ErrorSummary } from '../../connect/components/FormParts.tsx'
import { isUnauthorized } from '../api.ts'
import { AdminQuery, Pager } from '../components/AdminQuery.tsx'
import {
  type AdminRecord,
  apiFieldErrors,
  LIST_PAGE_SIZE,
  useAdminItem,
  useAdminList,
  useDeleteItem,
  useSaveItem,
} from './api.ts'
import type { Form, ResourceConfig } from './types.ts'

/** Messages carried from one admin page to the next (after creating or deleting). */
type Flash = { saved?: string; deleted?: string }

/** /admin/<resource>?page=2: everything of one kind, most recently changed first. */
export function ListPage({ config }: { config: ResourceConfig }) {
  usePageTitle(`${config.plural} · Admin`)
  const [params] = useSearchParams()
  const page = Math.max(1, Number.parseInt(params.get('page') ?? '1', 10) || 1)
  const query = useAdminList(config.name, page)
  const flash = (useLocation().state ?? {}) as Flash

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="text-h2">{config.plural}</h1>
          <p className="text-text-muted">{config.intro}</p>
        </div>
        {config.canCreate !== false && (
          <ButtonLink to={`/admin/${config.name}/new`}>
            New {config.singular.toLowerCase()}
          </ButtonLink>
        )}
      </div>
      {flash.deleted && (
        <p role="status" className="rounded-lg bg-surface-alt p-3">
          Deleted “{flash.deleted}”. It’s no longer on the site.
        </p>
      )}
      <AdminQuery query={query} label={config.plural.toLowerCase()}>
        {(data) =>
          config.singleton && data.items[0] ? (
            <Navigate to={`/admin/${config.name}/${data.items[0].id}`} replace />
          ) : data.items.length === 0 ? (
            <EmptyState
              title={`No ${config.plural.toLowerCase()} yet.`}
              action={
                config.canCreate !== false ? (
                  <Link to={`/admin/${config.name}/new`}>
                    Add the first {config.singular.toLowerCase()}
                  </Link>
                ) : undefined
              }
            />
          ) : (
            <>
              <ul className="flex flex-col divide-y divide-border rounded-xl border border-border">
                {data.items.map((item) => (
                  <li key={item.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 p-4">
                    <div className="flex min-w-0 flex-1 flex-col gap-1">
                      <Link
                        to={`/admin/${config.name}/${item.id}`}
                        className="font-heading font-medium"
                      >
                        {config.rowTitle(item) || '(untitled)'}
                      </Link>
                      <span className="text-small text-text-muted">{config.rowDetail(item)}</span>
                    </div>
                    {item.isPlaceholder === true && <Badge tone="neutral">Placeholder</Badge>}
                    {typeof item.updatedAt === 'string' && (
                      <span className="text-small text-text-muted">
                        Changed {formatDate(item.updatedAt)}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
              <Pager
                page={data.page}
                total={data.total}
                pageSize={LIST_PAGE_SIZE}
                hrefFor={(p) =>
                  p > 1 ? `/admin/${config.name}?page=${p}` : `/admin/${config.name}`
                }
              />
            </>
          )
        }
      </AdminQuery>
    </>
  )
}

/** /admin/<resource>/new and /admin/<resource>/:id. */
export function EditPage({ config }: { config: ResourceConfig }) {
  const { id } = useParams()
  const item = useAdminItem(config.name, id)
  if (!id)
    return config.canCreate === false ? (
      <Navigate to={`/admin/${config.name}`} replace />
    ) : (
      <EditorForm config={config} initial={config.empty()} />
    )
  return (
    <AdminQuery query={item} label={config.singular.toLowerCase()}>
      {(record) => (
        <EditorForm
          key={record.id}
          config={config}
          initial={config.fromRecord(record)}
          record={record}
        />
      )}
    </AdminQuery>
  )
}

function EditorForm({
  config,
  initial,
  record,
}: {
  config: ResourceConfig
  initial: Form
  record?: AdminRecord
}) {
  const isNew = !record
  const navigate = useNavigate()
  const location = useLocation()
  const [form, setForm] = useState<Form>(initial)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [general, setGeneral] = useState<string>()
  const [attempt, setAttempt] = useState(0)
  const [saved, setSaved] = useState<AdminRecord | null>(
    (location.state as Flash | null)?.saved ? (record ?? null) : null,
  )
  const save = useSaveItem(config.name, record?.id)
  const title = isNew
    ? `New ${config.singular.toLowerCase()}`
    : `Edit ${config.singular.toLowerCase()}`
  usePageTitle(`${title} · Admin`)

  const set = (changes: Form) => {
    setForm((current) => ({ ...current, ...changes }))
    setSaved(null)
  }

  const onSubmit = (event: FormEvent) => {
    event.preventDefault()
    setAttempt((n) => n + 1)
    setGeneral(undefined)
    const found = config.check(form)
    setErrors(found)
    if (Object.keys(found).length > 0) return
    save.mutate(config.toBody(form, isNew), {
      onSuccess: (item) => {
        if (isNew) {
          navigate(`/admin/${config.name}/${item.id}`, { replace: true, state: { saved: item.id } })
        } else {
          setSaved(item)
        }
      },
      onError: (error) => {
        if (isUnauthorized(error)) {
          setGeneral('Your session has ended. Sign in again in a new tab, then save here again.')
          return
        }
        const fromApi: Record<string, string> = {}
        const conflict = error instanceof ApiError && error.code === 'CONFLICT'
        for (const [path, message] of Object.entries(apiFieldErrors(error)))
          fromApi[config.fieldFor(path, form)] = (conflict && config.conflicts?.[path]) || message
        setErrors(fromApi)
        if (Object.keys(fromApi).length === 0)
          setGeneral(
            error instanceof ApiError ? error.message : 'Something went wrong. Please try again.',
          )
      },
    })
  }

  const publicPath = saved ? config.publicPath(saved) : null

  return (
    <>
      <p>
        {config.singleton ? (
          <Link to="/admin/content">← All content</Link>
        ) : (
          <Link to={`/admin/${config.name}`}>← {config.plural}</Link>
        )}
      </p>
      <h1 className="text-h2">
        {title}
        {!isNew && <span className="block text-h3 text-text-muted">{config.rowTitle(record)}</span>}
      </h1>

      {saved && <SavedNotice publicPath={publicPath} placeholder={saved.isPlaceholder === true} />}

      <form noValidate onSubmit={onSubmit} className="flex max-w-3xl flex-col gap-6">
        <ErrorSummary errors={errors} labels={config.labels} message={general} attempt={attempt} />
        <config.Fields form={form} set={set} errors={errors} isNew={isNew} />
        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" loading={save.isPending}>
            {isNew ? `Publish ${config.singular.toLowerCase()}` : 'Save changes'}
          </Button>
          <Link to={config.singleton ? '/admin/content' : `/admin/${config.name}`}>Cancel</Link>
        </div>
      </form>

      {record && config.canDelete !== false && <DeleteSection config={config} record={record} />}
    </>
  )
}

/** "Saved. It's on the site now." Takes focus so the result is announced. */
function SavedNotice({
  publicPath,
  placeholder,
}: {
  publicPath: string | null
  placeholder: boolean
}) {
  const box = useRef<HTMLDivElement>(null)
  useEffect(() => box.current?.focus(), [])
  return (
    <div
      ref={box}
      tabIndex={-1}
      role="status"
      className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-xl border-2 border-primary-border bg-surface-alt p-4"
    >
      <p className="font-medium">
        <span aria-hidden className="mr-1 text-text-brand">
          ✓
        </span>
        Saved.{' '}
        {placeholder
          ? 'It’s still marked as a placeholder (“Coming soon”).'
          : 'It’s on the site now.'}
      </p>
      {publicPath && (
        <a href={publicPath} target="_blank" rel="noopener">
          View on the site<span className="sr-only"> (opens in a new tab)</span>
        </a>
      )}
    </div>
  )
}

/** Deleting asks once more, inline (no pop-up), and can't be undone. */
function DeleteSection({ config, record }: { config: ResourceConfig; record: AdminRecord }) {
  const [confirming, setConfirming] = useState(false)
  const remove = useDeleteItem(config.name)
  const navigate = useNavigate()
  const name = config.rowTitle(record)
  // Focus the real choice, so keyboard users land on it.
  useEffect(() => {
    if (confirming) document.getElementById('confirm-delete')?.focus()
  }, [confirming])

  return (
    <section
      aria-labelledby="delete-title"
      className="flex max-w-3xl flex-col gap-3 border-t border-border pt-6"
    >
      <h2 id="delete-title" className="text-[1.25rem]">
        Delete
      </h2>
      {!confirming ? (
        <div>
          <Button variant="danger" onClick={() => setConfirming(true)}>
            Delete this {config.singular.toLowerCase()}
          </Button>
        </div>
      ) : (
        <div
          role="group"
          aria-labelledby="delete-question"
          className="flex flex-col gap-3 rounded-xl border-2 border-danger p-4"
        >
          <p id="delete-question">
            Delete “{name}”? It disappears from the site straight away and can’t be undone.
          </p>
          {remove.isError && (
            <p role="alert" className="text-small font-medium text-danger">
              {remove.error instanceof ApiError
                ? remove.error.message
                : 'It couldn’t be deleted. Please try again.'}
            </p>
          )}
          <div className="flex flex-wrap gap-3">
            <Button
              id="confirm-delete"
              variant="secondary"
              loading={remove.isPending}
              onClick={() =>
                remove.mutate(record.id, {
                  onSuccess: () =>
                    navigate(`/admin/${config.name}`, { replace: true, state: { deleted: name } }),
                })
              }
            >
              Yes, delete it
            </Button>
            <Button variant="ghost" onClick={() => setConfirming(false)}>
              Keep it
            </Button>
          </div>
        </div>
      )}
    </section>
  )
}
