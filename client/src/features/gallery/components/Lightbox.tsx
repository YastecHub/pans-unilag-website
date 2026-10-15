import { type KeyboardEvent, type PointerEvent, useEffect, useRef } from 'react'
import { CloseIcon } from '../../../components/ui/icons.tsx'
import type { AlbumPhoto } from '../api/albums.ts'
import { Photo } from './Photo.tsx'

type Props = {
  photos: AlbumPhoto[]
  /** The photo shown; null when the lightbox is closed. */
  index: number | null
  onChange: (index: number) => void
  onClose: () => void
}

/** Swipes shorter than this (px) are taps, not page turns. */
const SWIPE = 50

// At the first or last photo, Previous/Next stay focusable (aria-disabled) so focus never drops.

/**
 * A full-screen photo viewer built on the native <dialog>: the page behind is inert, focus stays
 * inside, and Escape closes it. ← and → (or Previous and Next, or a swipe) move between photos;
 * Home and End jump to the first and last. Each change is announced ("Photo 4 of 24") with the
 * photo's description. Closing returns focus to the thumbnail that opened it (the caller's job).
 */
export function Lightbox({ photos, index, onChange, onClose }: Props) {
  const dialog = useRef<HTMLDialogElement>(null)
  const closeButton = useRef<HTMLButtonElement>(null)
  const swipeStart = useRef<number | null>(null)
  const open = index !== null

  useEffect(() => {
    const el = dialog.current
    if (!el) return
    if (open && !el.open) {
      // showModal makes the rest of the page inert; older test environments lack it.
      if (typeof el.showModal === 'function') el.showModal()
      else el.setAttribute('open', '')
      closeButton.current?.focus()
    }
    if (!open && el.open) {
      if (typeof el.close === 'function') el.close()
      else el.removeAttribute('open')
    }
  }, [open])

  const photo = index !== null ? photos[index] : undefined
  const last = photos.length - 1
  const go = (next: number) => {
    if (next >= 0 && next <= last) onChange(next)
  }

  const onKeyDown = (event: KeyboardEvent<HTMLDialogElement>) => {
    if (index === null) return
    const keys: Record<string, () => void> = {
      ArrowLeft: () => go(index - 1),
      ArrowRight: () => go(index + 1),
      Home: () => go(0),
      End: () => go(last),
      Escape: onClose,
    }
    const action = keys[event.key]
    if (action) {
      event.preventDefault()
      action()
    }
  }

  const onPointerDown = (event: PointerEvent) => {
    swipeStart.current = event.clientX
  }
  const onPointerUp = (event: PointerEvent) => {
    if (swipeStart.current === null || index === null) return
    const dx = event.clientX - swipeStart.current
    swipeStart.current = null
    if (Math.abs(dx) >= SWIPE) go(dx < 0 ? index + 1 : index - 1)
  }

  const control =
    'inline-flex min-h-12 min-w-12 items-center justify-center rounded-full bg-black/60 px-4 font-heading font-medium text-white hover:bg-black/80 aria-disabled:opacity-40'

  return (
    <dialog
      ref={dialog}
      aria-labelledby="lightbox-title"
      aria-describedby={photo ? 'lightbox-description' : undefined}
      onKeyDown={onKeyDown}
      onCancel={(event) => {
        // Escape: let React state drive the close so focus can return to the thumbnail.
        event.preventDefault()
        onClose()
      }}
      className="m-0 h-dvh max-h-none w-screen max-w-none bg-black p-0 text-white backdrop:bg-black/90"
    >
      {photo && index !== null && (
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between gap-3 p-3">
            <h2
              id="lightbox-title"
              aria-live="polite"
              className="text-small font-medium text-white"
            >
              Photo {index + 1} of {photos.length}
            </h2>
            <button ref={closeButton} type="button" onClick={onClose} className={control}>
              <CloseIcon />
              <span className="sr-only">Close</span>
            </button>
          </div>

          <div
            className="relative flex min-h-0 flex-1 touch-pan-y items-center justify-center px-2"
            onPointerDown={onPointerDown}
            onPointerUp={onPointerUp}
          >
            <Photo
              key={photo.publicId}
              publicId={photo.publicId}
              alt={photo.alt}
              widths={[800, 1200, 1600]}
              sizes="100vw"
              crop={{ crop: 'limit' }}
              lazy={false}
              className="max-h-full w-auto object-contain select-none"
            />
          </div>

          <div className="flex items-center justify-between gap-3 p-3">
            <button
              type="button"
              onClick={() => go(index - 1)}
              aria-disabled={index === 0}
              className={control}
            >
              <span aria-hidden>←</span>
              <span className="ml-2">Previous</span>
            </button>
            <p id="lightbox-description" className="text-center text-small text-white/90">
              {photo.caption || photo.alt}
            </p>
            <button
              type="button"
              onClick={() => go(index + 1)}
              aria-disabled={index === last}
              className={control}
            >
              <span className="mr-2">Next</span>
              <span aria-hidden>→</span>
            </button>
          </div>
        </div>
      )}
    </dialog>
  )
}
