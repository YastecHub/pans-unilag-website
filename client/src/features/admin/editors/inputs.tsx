import { type ReactNode, useEffect, useRef, useState } from 'react'
import { control, Field } from './fields.tsx'
import { slugify } from './lagos.ts'
import { bool, cell, type FieldsProps, type Option, type Row, str } from './types.ts'

/**
 * Inputs bound to the editor form by field id, so each editor is a list of fields rather than
 * repeated wiring. Labels, hints and errors come from Field (fields.tsx).
 */

type Bound = FieldsProps & {
  id: string
  label: string
  hint?: ReactNode
  optional?: boolean
  maxLength?: number
}

export function TextInput({
  form,
  set,
  errors,
  id,
  label,
  hint,
  optional,
  maxLength,
  type = 'text',
  inputMode,
  autoComplete = 'off',
}: Bound & {
  type?: 'text' | 'url' | 'email' | 'date' | 'month'
  inputMode?: 'numeric' | 'decimal' | 'url' | 'email'
  autoComplete?: string
}) {
  return (
    <Field id={id} label={label} hint={hint} optional={optional} error={errors[id]}>
      {(p) => (
        <input
          {...p}
          type={type}
          inputMode={inputMode ?? (type === 'url' ? 'url' : undefined)}
          autoComplete={autoComplete}
          className={control}
          maxLength={maxLength}
          value={str(form, id)}
          onChange={(e) => set({ [id]: e.target.value })}
        />
      )}
    </Field>
  )
}

export function TextArea({
  form,
  set,
  errors,
  id,
  label,
  hint,
  optional,
  maxLength,
  rows = 6,
}: Bound & { rows?: number }) {
  return (
    <Field id={id} label={label} hint={hint} optional={optional} error={errors[id]}>
      {(p) => (
        <textarea
          {...p}
          rows={rows}
          maxLength={maxLength}
          className={`${control} py-2`}
          value={str(form, id)}
          onChange={(e) => set({ [id]: e.target.value })}
        />
      )}
    </Field>
  )
}

export function Select({
  form,
  set,
  errors,
  id,
  label,
  hint,
  optional,
  options,
  placeholder,
}: Bound & { options: readonly Option[]; placeholder?: string }) {
  return (
    <Field id={id} label={label} hint={hint} optional={optional} error={errors[id]}>
      {(p) => (
        <select
          {...p}
          className={control}
          value={str(form, id)}
          onChange={(e) => set({ [id]: e.target.value })}
        >
          {placeholder !== undefined && <option value="">{placeholder}</option>}
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      )}
    </Field>
  )
}

/**
 * Title and web address. A new item's address follows its title until it's edited by hand; an
 * existing item warns that changing it breaks shared links.
 */
export function TitleAndSlug({
  titleKey = 'title',
  titleLabel = 'Title',
  titleMax = 160,
  pathPrefix,
  slugHint = 'A short name for this item: lower-case words joined by hyphens.',
  ...props
}: FieldsProps & {
  titleKey?: string
  titleLabel?: string
  titleMax?: number
  /** e.g. "/leadership/committees/". Leave out when the item has no page of its own. */
  pathPrefix?: string
  /** Hint when there's no page, e.g. "Same for every version of the document". */
  slugHint?: string
}) {
  const { form, set, errors, isNew } = props
  const slug = str(form, 'slug')
  return (
    <>
      <Field id={titleKey} label={titleLabel} error={errors[titleKey]}>
        {(p) => (
          <input
            {...p}
            className={control}
            maxLength={titleMax}
            value={str(form, titleKey)}
            onChange={(e) => {
              const title = e.target.value
              set(
                isNew && !bool(form, 'slugEdited')
                  ? { [titleKey]: title, slug: slugify(title) }
                  : { [titleKey]: title },
              )
            }}
          />
        )}
      </Field>
      <Field
        id="slug"
        label="Web address"
        hint={
          pathPrefix ? (
            <>
              The page will be at {pathPrefix}
              {slug || '…'}. {!isNew && 'Changing it breaks links people have already shared.'}
            </>
          ) : (
            slugHint
          )
        }
        error={errors.slug}
      >
        {(p) => (
          <input
            {...p}
            className={control}
            maxLength={80}
            value={slug}
            onChange={(e) => set({ slug: e.target.value, slugEdited: true })}
          />
        )}
      </Field>
    </>
  )
}

export type Column = {
  key: string
  label: string
  kind?: 'text' | 'url' | 'number' | 'textarea' | 'select'
  options?: readonly Option[]
  /** Shown as the first choice of a select, e.g. "Not shown". */
  placeholder?: string
  optional?: boolean
  maxLength?: number
  hint?: string
  /** Grid column span on wide screens (the row is a 6-column grid). */
  span?: 1 | 2 | 3 | 4 | 6
}

const SPAN = {
  1: 'sm:col-span-1',
  2: 'sm:col-span-2',
  3: 'sm:col-span-3',
  4: 'sm:col-span-4',
  6: 'sm:col-span-6',
}

/**
 * A list of rows (officers, page sections, grades…) that can be added, removed and reordered.
 * Each row is its own labelled group; moving or removing a row says so to screen readers and
 * keeps keyboard focus in a sensible place.
 */
export function RowsField({
  id,
  legend,
  hint,
  itemName,
  rows,
  onChange,
  columns,
  newRow,
  max,
  error,
  addLabel,
  rowTitle,
  legendHidden = false,
}: {
  /** The form field id: the error summary links here. */
  id: string
  legend: string
  /** Keep the legend for screen readers only, when a group heading above already says it. */
  legendHidden?: boolean
  hint?: ReactNode
  /** "Officer": rows are titled "Officer 1", "Officer 2"… */
  itemName: string
  rows: Row[]
  onChange: (rows: Row[]) => void
  columns: Column[]
  newRow: () => Row
  max: number
  error?: string
  addLabel?: string
  /** A row's own title, e.g. a section heading; falls back to "Officer 2". */
  rowTitle?: (row: Row, index: number) => string
}) {
  const [announcement, setAnnouncement] = useState('')
  const focusNext = useRef<string | null>(null)
  const addButton = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    if (!focusNext.current) return
    const target = focusNext.current
    focusNext.current = null
    if (target === 'add') addButton.current?.focus()
    else document.getElementById(target)?.focus()
  })

  const titleOf = (row: Row, i: number) => rowTitle?.(row, i) || `${itemName} ${i + 1}`
  const lower = itemName.toLowerCase()

  const update = (i: number, key: string, value: string) =>
    onChange(rows.map((row, j) => (j === i ? { ...row, [key]: value } : row)))
  const add = () => {
    focusNext.current = `${id}-${rows.length}-${columns[0]!.key}`
    setAnnouncement(`${itemName} ${rows.length + 1} added.`)
    onChange([...rows, newRow()])
  }
  const remove = (i: number) => {
    setAnnouncement(`${titleOf(rows[i]!, i)} removed.`)
    focusNext.current = rows.length > 1 ? `${id}-row-${Math.max(0, i - 1)}` : 'add'
    onChange(rows.filter((_, j) => j !== i))
  }
  const move = (i: number, by: -1 | 1) => {
    const j = i + by
    const next = [...rows]
    ;[next[i], next[j]] = [next[j]!, next[i]!]
    focusNext.current = `${id}-${j}-${by < 0 ? 'up' : 'down'}`
    if (j === 0 || j === rows.length - 1) focusNext.current = `${id}-row-${j}`
    setAnnouncement(`${titleOf(rows[i]!, i)} moved to position ${j + 1}.`)
    onChange(next)
  }

  const describedBy = [hint ? `${id}-hint` : '', error ? `${id}-error` : '']
    .filter(Boolean)
    .join(' ')

  return (
    <fieldset
      id={id}
      tabIndex={-1}
      aria-describedby={describedBy || undefined}
      aria-invalid={error ? true : undefined}
      className="flex flex-col gap-3"
    >
      <legend className={legendHidden ? 'sr-only' : 'mb-1 font-medium'}>{legend}</legend>
      {hint && (
        <p id={`${id}-hint`} className="text-small text-text-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="text-small font-medium text-danger">
          <span aria-hidden>! </span>
          {error}
        </p>
      )}
      {rows.length > 0 && (
        <ol className="flex flex-col gap-3">
          {rows.map((row, i) => (
            <li key={i}>
              <fieldset
                id={`${id}-row-${i}`}
                tabIndex={-1}
                className="flex flex-col gap-3 rounded-lg border border-border bg-surface-alt p-3"
              >
                <legend className="sr-only">{titleOf(row, i)}</legend>
                <p aria-hidden className="font-heading text-small font-medium">
                  {titleOf(row, i)}
                </p>
                <div className="grid gap-3 sm:grid-cols-6">
                  {columns.map((col) => {
                    const cid = `${id}-${i}-${col.key}`
                    return (
                      <div key={col.key} className={SPAN[col.span ?? 3]}>
                        <Field id={cid} label={col.label} optional={col.optional} hint={col.hint}>
                          {(p) =>
                            col.kind === 'select' ? (
                              <select
                                {...p}
                                className={control}
                                value={cell(row, col.key)}
                                onChange={(e) => update(i, col.key, e.target.value)}
                              >
                                {col.placeholder !== undefined && (
                                  <option value="">{col.placeholder}</option>
                                )}
                                {col.options?.map((o) => (
                                  <option key={o.value} value={o.value}>
                                    {o.label}
                                  </option>
                                ))}
                              </select>
                            ) : col.kind === 'textarea' ? (
                              <textarea
                                {...p}
                                rows={6}
                                maxLength={col.maxLength}
                                className={`${control} py-2`}
                                value={cell(row, col.key)}
                                onChange={(e) => update(i, col.key, e.target.value)}
                              />
                            ) : (
                              <input
                                {...p}
                                type={col.kind === 'url' ? 'url' : 'text'}
                                inputMode={
                                  col.kind === 'number'
                                    ? 'decimal'
                                    : col.kind === 'url'
                                      ? 'url'
                                      : undefined
                                }
                                autoComplete="off"
                                maxLength={col.maxLength}
                                className={control}
                                value={cell(row, col.key)}
                                onChange={(e) => update(i, col.key, e.target.value)}
                              />
                            )
                          }
                        </Field>
                      </div>
                    )
                  })}
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-2 text-small">
                  {i > 0 && (
                    <button
                      id={`${id}-${i}-up`}
                      type="button"
                      onClick={() => move(i, -1)}
                      className="font-heading font-medium text-text-brand underline"
                    >
                      Move up<span className="sr-only">: {titleOf(row, i)}</span>
                    </button>
                  )}
                  {i < rows.length - 1 && (
                    <button
                      id={`${id}-${i}-down`}
                      type="button"
                      onClick={() => move(i, 1)}
                      className="font-heading font-medium text-text-brand underline"
                    >
                      Move down<span className="sr-only">: {titleOf(row, i)}</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => remove(i)}
                    className="font-heading font-medium text-danger underline"
                  >
                    Remove<span className="sr-only">: {titleOf(row, i)}</span>
                  </button>
                </div>
              </fieldset>
            </li>
          ))}
        </ol>
      )}
      <div>
        <button
          ref={addButton}
          type="button"
          onClick={add}
          disabled={rows.length >= max}
          className="min-h-11 rounded-lg border-2 border-primary-border px-4 font-heading font-medium text-text-brand disabled:opacity-50"
        >
          {addLabel ?? `Add ${lower}`}
        </button>
        {rows.length >= max && (
          <span className="ml-3 text-small text-text-muted">That’s the most allowed ({max}).</span>
        )}
      </div>
      <p role="status" className="sr-only">
        {announcement}
      </p>
    </fieldset>
  )
}
