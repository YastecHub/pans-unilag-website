import { type ReactNode, useEffect, useRef } from 'react'
import { describedBy, inputClass } from './formFields.ts'

/**
 * Accessible form building blocks: every field has a visible label, an optional hint and an
 * error linked with aria-describedby, and is marked aria-invalid when wrong.
 */

export function FieldHint({ id, children }: { id: string; children?: ReactNode }) {
  if (!children) return null
  return (
    <p id={`${id}-hint`} className="text-small text-text-muted">
      {children}
    </p>
  )
}

export function FieldError({ id, error }: { id: string; error?: string }) {
  if (!error) return null
  return (
    <p id={`${id}-error`} className="text-small font-medium text-danger">
      <span aria-hidden>! </span>
      {error}
    </p>
  )
}

type TextFieldProps = {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  error?: string
  hint?: ReactNode
  optional?: boolean
  type?: 'text' | 'email' | 'tel'
  inputMode?: 'numeric' | 'text' | 'email' | 'tel'
  autoComplete?: string
  multiline?: boolean
  maxLength?: number
}

export function TextField(p: TextFieldProps) {
  const common = {
    id: p.id,
    name: p.id,
    value: p.value,
    'aria-invalid': p.error ? true : undefined,
    'aria-describedby': describedBy(p.id, p.hint, p.error),
    className: inputClass,
  }
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={p.id} className="font-medium">
        {p.label}
        {p.optional && <span className="font-normal text-text-muted"> (optional)</span>}
      </label>
      <FieldHint id={p.id}>{p.hint}</FieldHint>
      {p.multiline ? (
        <textarea
          {...common}
          rows={7}
          maxLength={p.maxLength}
          onChange={(e) => p.onChange(e.target.value)}
          className={`${inputClass} py-2`}
        />
      ) : (
        <input
          {...common}
          type={p.type ?? 'text'}
          inputMode={p.inputMode}
          autoComplete={p.autoComplete}
          onChange={(e) => p.onChange(e.target.value)}
        />
      )}
      <FieldError id={p.id} error={p.error} />
    </div>
  )
}

/**
 * The error summary at the top of a form (GOV.UK pattern): focused when it appears, each problem
 * links to its field.
 */
export function ErrorSummary({
  errors,
  labels,
  message,
  attempt,
}: {
  errors: Record<string, string>
  labels: Record<string, string>
  /** A problem that isn't about one field, e.g. "Please wait an hour". */
  message?: string
  /** Bumped on every submit, so the summary takes focus again even if the errors are the same. */
  attempt: number
}) {
  const box = useRef<HTMLDivElement>(null)
  const fields = Object.keys(errors)
  const show = fields.length > 0 || !!message
  useEffect(() => {
    if (show) box.current?.focus()
  }, [show, attempt])
  if (!show) return null
  return (
    <div
      ref={box}
      tabIndex={-1}
      role="alert"
      aria-labelledby="error-summary-title"
      className="flex flex-col gap-2 rounded-xl border-2 border-danger p-4"
    >
      <h2 id="error-summary-title" className="text-[1.125rem]">
        {fields.length > 0 ? 'Please check the form' : 'Your message wasn’t sent'}
      </h2>
      {message && <p>{message}</p>}
      {fields.length > 0 && (
        <ul className="list-disc pl-5">
          {fields.map((f) => (
            <li key={f}>
              <a href={`#${f}`}>
                {labels[f] ? `${labels[f]}: ` : ''}
                {errors[f]}
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

/** Shown in place of the form once it's sent; takes focus so it is announced. */
export function SuccessPanel({
  title,
  children,
  onAgain,
  againLabel,
}: {
  title: string
  children: ReactNode
  onAgain: () => void
  againLabel: string
}) {
  const heading = useRef<HTMLHeadingElement>(null)
  useEffect(() => heading.current?.focus(), [])
  return (
    <div role="status" className="flex flex-col items-start gap-3 rounded-xl bg-surface-alt p-5">
      <h2 ref={heading} tabIndex={-1} className="text-h3">
        <span aria-hidden className="mr-2 text-text-brand">
          ✓
        </span>
        {title}
      </h2>
      {children}
      <button
        type="button"
        onClick={onAgain}
        className="font-heading font-medium text-text-brand underline"
      >
        {againLabel}
      </button>
    </div>
  )
}

/** The spam trap: off-screen, out of the tab order and hidden from screen readers. */
export function Honeypot({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div aria-hidden className="absolute -left-[9999px] h-px w-px overflow-hidden">
      <label htmlFor="website">Leave this empty</label>
      <input
        id="website"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  )
}
