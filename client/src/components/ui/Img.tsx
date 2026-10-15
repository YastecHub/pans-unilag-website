import { cloudinaryUrl } from '../../lib/cloudinary.ts'
import { PlaceholderImage } from './Placeholder.tsx'

type Props = {
  /** Cloudinary public id, e.g. "pans-unilag/events/health-week-2026/day-3/cover". */
  publicId: string
  /**
   * Required. Describe the photo ("Students at the Day 3 medical outreach").
   * Pass "" only for purely decorative images.
   */
  alt: string
  /** The largest size the image is shown at, in CSS pixels. Cloudinary crops to this. */
  width: number
  height: number
  /** Lazy-load (default). Turn off for images visible on first load, e.g. a hero. */
  lazy?: boolean
  className?: string
}

/**
 * A single Cloudinary image: cropped to size, automatic format (WebP/AVIF) and quality, natively
 * lazy-loaded, with width and height set so the page doesn't jump while it loads. For photos shown
 * at several sizes (the gallery), use features/gallery/components/Photo, which adds a srcset.
 */
export function Img({ publicId, alt, width, height, lazy = true, className = '' }: Props) {
  const src = cloudinaryUrl(publicId, width, { crop: 'fill', aspectRatio: width / height })
  if (!src) {
    // No Cloudinary configured (e.g. a fresh clone): show the standard photo placeholder.
    return (
      <PlaceholderImage kind="badge" aspectRatio={`${width} / ${height}`} className={className} />
    )
  }
  return (
    <img
      src={src}
      alt={alt}
      width={width}
      height={height}
      loading={lazy ? 'lazy' : 'eager'}
      decoding="async"
      className={`h-auto max-w-full ${className}`}
    />
  )
}
