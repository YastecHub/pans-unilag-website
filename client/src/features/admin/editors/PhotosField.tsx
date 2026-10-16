import { useEffect, useRef, useState } from 'react'
import { cloudinaryUrl } from '../../../lib/cloudinary.ts'
import { ApiError } from '../../../lib/http.ts'
import { uploadImage } from './api.ts'
import { control } from './fields.tsx'
import { cell, type FieldsProps, type Row, rows as rowsOf, str } from './types.ts'

/** An album holds at most this many photos (README → Gallery rules). */
const MAX_PHOTOS = 40

/**
 * An album's photos: upload several at once (signed, straight to Cloudinary), then describe each
 * one, choose the cover and put them in order. Every photo needs alt text before it's published.
 */
export function PhotosField({ form, set, errors, folder }: FieldsProps & { folder: string }) {
  const photos = rowsOf(form, 'photos')
  const cover = str(form, 'cover')
  const [status, setStatus] = useState({ busy: false, message: '', failed: false })
  const [announcement, setAnnouncement] = useState('')
  const focusNext = useRef<string | null>(null)
  useEffect(() => {
    if (!focusNext.current) return
    document.getElementById(focusNext.current)?.focus()
    focusNext.current = null
  })

  const setPhotos = (next: Row[], changes: Record<string, string> = {}) =>
    set({ photos: next, ...changes })

  const onFiles = async (files: File[]) => {
    const room = MAX_PHOTOS - photos.length
    const chosen = files.slice(0, room)
    if (chosen.length === 0) return
    let added: Row[] = []
    let failed = ''
    for (const [n, file] of chosen.entries()) {
      setStatus({
        busy: true,
        message: `Uploading photo ${n + 1} of ${chosen.length}…`,
        failed: false,
      })
      try {
        const publicId = await uploadImage(file, folder)
        added = [...added, { publicId, alt: '', caption: '' }]
      } catch (e) {
        failed =
          e instanceof ApiError && e.code === 'SERVICE_UNAVAILABLE'
            ? 'Photo uploads aren’t set up on the server yet. Ask the developer to add the Cloudinary keys.'
            : `${file.name}: ${e instanceof Error ? e.message : 'the upload failed.'}`
        break
      }
    }
    if (added.length > 0) {
      focusNext.current = `photos-${photos.length}-alt`
      // The first photo of a new album becomes its cover until another is chosen.
      setPhotos([...photos, ...added], cover ? {} : { cover: cell(added[0]!, 'publicId') })
    }
    const skipped = files.length - chosen.length
    const done = `${added.length} ${added.length === 1 ? 'photo' : 'photos'} uploaded. Describe each one below, then save.`
    setStatus({
      busy: false,
      failed: !!failed || skipped > 0,
      message: [
        added.length > 0 ? done : '',
        failed,
        skipped > 0 ? `${skipped} not added: an album holds at most ${MAX_PHOTOS} photos.` : '',
      ]
        .filter(Boolean)
        .join(' '),
    })
  }

  const update = (i: number, key: string, value: string) =>
    setPhotos(photos.map((p, j) => (j === i ? { ...p, [key]: value } : p)))
  const remove = (i: number) => {
    const gone = cell(photos[i]!, 'publicId')
    const next = photos.filter((_, j) => j !== i)
    setAnnouncement(`Photo ${i + 1} removed.`)
    focusNext.current = next.length > 0 ? `photos-${Math.max(0, i - 1)}-alt` : 'photosUpload'
    setPhotos(next, gone === cover ? { cover: next[0] ? cell(next[0], 'publicId') : '' } : {})
  }
  const move = (i: number, by: -1 | 1) => {
    const j = i + by
    const next = [...photos]
    ;[next[i], next[j]] = [next[j]!, next[i]!]
    focusNext.current = `photos-${j}-alt`
    setAnnouncement(`Photo ${i + 1} moved to position ${j + 1}.`)
    setPhotos(next)
  }

  const error = errors.photos ?? errors.cover
  return (
    <fieldset
      id="photos"
      tabIndex={-1}
      aria-describedby={`photos-hint${error ? ' photos-error' : ''}`}
      className="flex flex-col gap-3"
    >
      <legend className="mb-1 font-medium">Photos</legend>
      <p id="photos-hint" className="text-small text-text-muted">
        {photos.length} of {MAX_PHOTOS}. Only upload photos the people pictured agreed to share.
        JPG, PNG or WebP, up to 10 MB each.
      </p>
      {error && (
        <p id="photos-error" className="text-small font-medium text-danger">
          <span aria-hidden>! </span>
          {error}
        </p>
      )}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="photosUpload" className="font-medium">
          Add photos
        </label>
        <input
          id="photosUpload"
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp"
          disabled={!folder || status.busy || photos.length >= MAX_PHOTOS}
          aria-describedby="photosUpload-hint"
          onChange={(e) => {
            void onFiles([...(e.target.files ?? [])])
            e.target.value = ''
          }}
          className="text-small file:mr-3 file:min-h-10 file:rounded-lg file:border-2 file:border-primary-border file:bg-surface file:px-3 file:font-heading file:font-medium file:text-text-brand"
        />
        <p id="photosUpload-hint" className="text-small text-text-muted">
          {folder
            ? 'You can choose several at once.'
            : 'Add the event’s web address first: the photos are stored under it.'}
        </p>
      </div>
      <p
        role="status"
        className={`text-small ${status.failed ? 'font-medium text-danger' : 'text-text-muted'}`}
      >
        {status.message}
      </p>

      {photos.length > 0 && (
        <ol className="grid gap-3 sm:grid-cols-2">
          {photos.map((photo, i) => {
            const id = cell(photo, 'publicId')
            const src = cloudinaryUrl(id, 320, { crop: 'fill', aspectRatio: 3 / 2 })
            const missingAlt = !!errors.photos && !cell(photo, 'alt').trim()
            return (
              <li
                key={id}
                className="flex flex-col gap-3 rounded-lg border border-border bg-surface-alt p-3"
              >
                <div className="flex items-start gap-3">
                  {src ? (
                    <img
                      src={src}
                      alt=""
                      width={120}
                      height={80}
                      className="h-20 w-30 shrink-0 rounded object-cover"
                    />
                  ) : (
                    <span className="flex h-20 w-30 shrink-0 items-center justify-center rounded bg-surface text-small text-text-muted">
                      No preview
                    </span>
                  )}
                  <div className="flex flex-col gap-1">
                    <p className="font-heading text-small font-medium">Photo {i + 1}</p>
                    <label className="flex items-center gap-2 text-small">
                      <input
                        type="radio"
                        name="cover"
                        checked={cover === id}
                        onChange={() => set({ cover: id })}
                        className="size-5 accent-primary"
                      />
                      Album cover<span className="sr-only">: photo {i + 1}</span>
                    </label>
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor={`photos-${i}-alt`} className="text-small font-medium">
                    Describe photo {i + 1}
                  </label>
                  <input
                    id={`photos-${i}-alt`}
                    className={control}
                    maxLength={200}
                    aria-invalid={missingAlt || undefined}
                    aria-describedby={missingAlt ? 'photos-error' : undefined}
                    value={cell(photo, 'alt')}
                    onChange={(e) => update(i, 'alt', e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor={`photos-${i}-caption`} className="text-small font-medium">
                    Caption for photo {i + 1}{' '}
                    <span className="font-normal text-text-muted">(optional)</span>
                  </label>
                  <input
                    id={`photos-${i}-caption`}
                    className={control}
                    maxLength={300}
                    value={cell(photo, 'caption')}
                    onChange={(e) => update(i, 'caption', e.target.value)}
                  />
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-2 text-small">
                  {i > 0 && (
                    <button
                      type="button"
                      onClick={() => move(i, -1)}
                      className="font-heading font-medium text-text-brand underline"
                    >
                      Move earlier<span className="sr-only">: photo {i + 1}</span>
                    </button>
                  )}
                  {i < photos.length - 1 && (
                    <button
                      type="button"
                      onClick={() => move(i, 1)}
                      className="font-heading font-medium text-text-brand underline"
                    >
                      Move later<span className="sr-only">: photo {i + 1}</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => remove(i)}
                    className="font-heading font-medium text-danger underline"
                  >
                    Remove<span className="sr-only">: photo {i + 1}</span>
                  </button>
                </div>
              </li>
            )
          })}
        </ol>
      )}
      <p role="status" className="sr-only">
        {announcement}
      </p>
    </fieldset>
  )
}
