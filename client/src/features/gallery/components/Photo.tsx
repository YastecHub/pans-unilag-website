import { PlaceholderImage } from '../../../components/ui/Placeholder.tsx'
import {
  type CloudinaryCrop,
  type CloudinaryQuality,
  cloudinarySources,
} from '../../../lib/cloudinary.ts'

type Props = {
  publicId: string
  alt: string
  /** Candidate widths in CSS pixels; Cloudinary makes each one. */
  widths: number[]
  /** How wide the photo is on screen, so the browser downloads the smallest file that is sharp. */
  sizes: string
  crop: CloudinaryCrop
  /** "auto:eco" for thumbnails: noticeably smaller files at thumbnail size. */
  quality?: CloudinaryQuality
  /** Lazy by default: only photos near the screen are downloaded. */
  lazy?: boolean
  className?: string
}

/**
 * A responsive Cloudinary photo (srcset, automatic format and quality, native lazy-loading) that
 * keeps its space while loading. Falls back to the photo placeholder when Cloudinary isn't set up.
 */
export function Photo({
  publicId,
  alt,
  widths,
  sizes,
  crop,
  quality = 'auto',
  lazy = true,
  className = '',
}: Props) {
  const sources = cloudinarySources(publicId, widths, crop, quality)
  const ratio = crop.crop === 'fill' ? crop.aspectRatio : undefined
  if (!sources) {
    return (
      <PlaceholderImage
        kind="badge"
        aspectRatio={ratio ? String(ratio) : '3 / 2'}
        label={alt || 'Photo'}
        className={className}
      />
    )
  }
  const width = widths[widths.length - 1]!
  return (
    <img
      src={sources.src}
      srcSet={sources.srcSet}
      sizes={sizes}
      alt={alt}
      loading={lazy ? 'lazy' : 'eager'}
      decoding="async"
      width={width}
      height={ratio ? Math.round(width / ratio) : undefined}
      className={`block h-auto max-w-full ${className}`}
    />
  )
}
