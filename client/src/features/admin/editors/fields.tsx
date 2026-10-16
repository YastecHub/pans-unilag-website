import { type ReactNode, useId, useState } from 'react'
import { cloudinaryUrl } from '../../../lib/cloudinary.ts'
import { ApiError } from '../../../lib/http.ts'
import { uploadImage } from './api.ts'

/**
 * Form fields for the editors. Every field has a visible label, an optional hint, and an error
 * (from the form or from the API) linked with aria-describedby and marked aria-invalid.
 */

export const control =
  'min-h-12 w-full rounded-lg border-2 border-border-strong bg-surface px-3 text-base text-text aria-[invalid=true]:border-danger'

type ControlProps = {
  id: string
  'aria-invalid'?: boolean
  'aria-describedby'?: string
}

type FieldProps = {
  id: string
  label: string
  hint?: ReactNode
  error?: string
  optional?: boolean
  children: (props: ControlProps) => ReactNode
}

export function Field({ id, label, hint, error, optional, children }: FieldProps) {
  const describedBy = [hint ? `${id}-hint` : '', error ? `${id}-error` : '']
    .filter(Boolean)
    .join(' ')
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="font-medium">
        {label}
        {optional && <span className="font-normal text-text-muted"> (optional)</span>}
      </label>
      {hint && (
        <p id={`${id}-hint`} className="text-small text-text-muted">
          {hint}
        </p>
      )}
      {children({
        id,
        'aria-invalid': error ? true : undefined,
        'aria-describedby': describedBy || undefined,
      })}
      {error && (
        <p id={`${id}-error`} className="text-small font-medium text-danger">
          <span aria-hidden>! </span>
          {error}
        </p>
      )}
    </div>
  )
}

/** A part of the form with its own heading. */
export function Group({ title, children }: { title: string; children: ReactNode }) {
  const id = useId()
  return (
    <section
      aria-labelledby={id}
      className="flex flex-col gap-4 rounded-xl border border-border p-4 sm:p-5"
    >
      <h2 id={id} className="text-[1.25rem]">
        {title}
      </h2>
      {children}
    </section>
  )
}

export function Checkbox({
  id,
  label,
  hint,
  checked,
  onChange,
  error,
}: {
  id: string
  label: string
  hint?: ReactNode
  checked: boolean
  onChange: (checked: boolean) => void
  error?: string
}) {
  const describedBy = [hint ? `${id}-hint` : '', error ? `${id}-error` : '']
    .filter(Boolean)
    .join(' ')
  return (
    <div className="flex flex-col gap-1">
      <label className="flex items-start gap-3">
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          aria-describedby={describedBy || undefined}
          aria-invalid={error ? true : undefined}
          className="mt-1 size-5 shrink-0 accent-primary"
        />
        <span className="font-medium">{label}</span>
      </label>
      {hint && (
        <p id={`${id}-hint`} className="pl-8 text-small text-text-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="pl-8 text-small font-medium text-danger">
          <span aria-hidden>! </span>
          {error}
        </p>
      )}
    </div>
  )
}

type UploadStatus = { busy: boolean; message: string; failed: boolean }

/**
 * A photo: signed upload straight to Cloudinary, preview, remove, and (when the site doesn't
 * describe it another way) the alt text that must go with it. Disabled until the item has the
 * details that name its folder.
 */
export function ImageField({
  id = 'coverImage',
  label = 'Cover photo',
  folder,
  waitingHint = 'Add a title first: the photo is stored under the event’s web address.',
  value,
  alt,
  onChange,
  onAltChange,
  error,
  altError,
  altId = 'coverImageAlt',
  aspectRatio = 3 / 2,
}: {
  id?: string
  label?: string
  /** e.g. "events/freshers-week-2026"; empty until the item has a web address. */
  folder: string
  /** Why the upload is disabled while there's no folder yet. */
  waitingHint?: string
  value: string
  alt?: string
  onChange: (publicId: string) => void
  /** Leave out when the site writes the alt text itself (e.g. "Cover of Recipharm 2026"). */
  onAltChange?: (alt: string) => void
  error?: string
  altError?: string
  altId?: string
  aspectRatio?: number
}) {
  const [status, setStatus] = useState<UploadStatus>({ busy: false, message: '', failed: false })
  const preview = value ? cloudinaryUrl(value, 480, { crop: 'fill', aspectRatio }) : null

  const onFile = async (file: File | undefined) => {
    if (!file) return
    setStatus({ busy: true, message: 'Uploading the photo…', failed: false })
    try {
      onChange(await uploadImage(file, folder))
      setStatus({
        busy: false,
        message: onAltChange
          ? 'Photo uploaded. Describe it below, then save.'
          : 'Photo uploaded. Save to put it on the site.',
        failed: false,
      })
    } catch (e) {
      const message =
        e instanceof ApiError && e.code === 'SERVICE_UNAVAILABLE'
          ? 'Photo uploads aren’t set up on the server yet. Ask the developer to add the Cloudinary keys.'
          : e instanceof Error
            ? e.message
            : 'The upload failed. Please try again.'
      setStatus({ busy: false, message, failed: true })
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <Field
        id={id}
        label={label}
        optional
        hint={
          folder
            ? `JPG, PNG or WebP, up to 10 MB.${aspectRatio > 1 ? ' Landscape photos work best.' : ''}`
            : waitingHint
        }
        error={error}
      >
        {(props) => (
          <input
            {...props}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            disabled={!folder || status.busy}
            onChange={(e) => {
              void onFile(e.target.files?.[0])
              e.target.value = ''
            }}
            className="text-small file:mr-3 file:min-h-10 file:rounded-lg file:border-2 file:border-primary-border file:bg-surface file:px-3 file:font-heading file:font-medium file:text-text-brand"
          />
        )}
      </Field>
      <p
        role="status"
        className={`text-small ${status.failed ? 'font-medium text-danger' : 'text-text-muted'}`}
      >
        {status.message}
      </p>
      {value && (
        <>
          <div className="flex flex-wrap items-start gap-4">
            {preview ? (
              <img
                src={preview}
                alt=""
                width={240}
                height={Math.round(240 / aspectRatio)}
                className="h-auto w-60 rounded-lg"
              />
            ) : (
              <p className="text-small text-text-muted">Saved photo: {value}</p>
            )}
            <button
              type="button"
              onClick={() => {
                onChange('')
                onAltChange?.('')
                setStatus({
                  busy: false,
                  message: 'Photo removed. Save to update the site.',
                  failed: false,
                })
              }}
              className="font-heading text-small font-medium text-danger underline"
            >
              Remove photo
            </button>
          </div>
          {onAltChange && (
            <Field
              id={altId}
              label="Describe the photo"
              hint="For people who can’t see it, e.g. “Students at the Day 3 medical outreach”."
              error={altError}
            >
              {(props) => (
                <input
                  {...props}
                  className={control}
                  value={alt ?? ''}
                  maxLength={200}
                  onChange={(e) => onAltChange(e.target.value)}
                />
              )}
            </Field>
          )}
        </>
      )}
    </div>
  )
}
