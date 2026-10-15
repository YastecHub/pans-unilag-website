import { AdvancedImage, lazyload } from '@cloudinary/react'
import { Cloudinary } from '@cloudinary/url-gen'
import { fill } from '@cloudinary/url-gen/actions/resize'
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
 * Every Cloudinary image goes through here: cropped to size, automatic format (WebP/AVIF) and
 * quality, lazy-loaded, with width and height set so the page doesn't jump while it loads.
 */
export function Img({ publicId, alt, width, height, lazy = true, className = '' }: Props) {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
  if (!cloudName) {
    // No Cloudinary configured (e.g. a fresh clone): show the standard photo placeholder.
    return (
      <PlaceholderImage kind="badge" aspectRatio={`${width} / ${height}`} className={className} />
    )
  }

  const image = new Cloudinary({ cloud: { cloudName } })
    .image(publicId)
    .resize(fill().width(width).height(height))
    .format('auto')
    .quality('auto')

  return (
    <AdvancedImage
      cldImg={image}
      plugins={lazy ? [lazyload()] : []}
      alt={alt}
      width={width}
      height={height}
      className={`h-auto max-w-full ${className}`}
    />
  )
}
