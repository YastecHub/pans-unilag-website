/**
 * Cloudinary delivery URLs, built by hand: the format is simple and stable, and leaving out the
 * Cloudinary SDK saves about 18 KB (gzipped) of JavaScript on every page.
 *
 *   https://res.cloudinary.com/<cloud>/image/upload/c_fill,h_400,w_600/f_auto/q_auto/<public id>
 *
 * Every URL asks for automatic format (WebP/AVIF) and quality, so phones download as little as
 * possible. Functions return null when no cloud is configured (a fresh clone): show a placeholder.
 */
export type CloudinaryCrop =
  /** Cropped to exactly width × (width / aspectRatio) (thumbnails, cards). */
  | { crop: 'fill'; aspectRatio: number }
  /** Scaled down to fit the width, never cropped or enlarged (the full photo). */
  | { crop: 'limit' }

/** Public ids are paths ("pans-unilag/events/…"); each segment is encoded, the slashes kept. */
const encodePublicId = (publicId: string) => publicId.split('/').map(encodeURIComponent).join('/')

/** "auto": Cloudinary's default quality. "auto:eco": smaller files, for thumbnails. */
export type CloudinaryQuality = 'auto' | 'auto:eco'

export function cloudinaryUrl(
  publicId: string,
  width: number,
  crop: CloudinaryCrop,
  quality: CloudinaryQuality = 'auto',
): string | null {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
  if (!cloudName) return null
  const resize =
    crop.crop === 'fill'
      ? `c_fill,h_${Math.round(width / crop.aspectRatio)},w_${width}`
      : `c_limit,w_${width}`
  return `https://res.cloudinary.com/${encodeURIComponent(cloudName)}/image/upload/${resize}/f_auto/q_${quality}/${encodePublicId(publicId)}`
}

/** `src` and `srcSet` for the given widths; the browser picks one using the `sizes` attribute. */
export function cloudinarySources(
  publicId: string,
  widths: number[],
  crop: CloudinaryCrop,
  quality: CloudinaryQuality = 'auto',
): { src: string; srcSet: string } | null {
  const urls = widths.map((w) => [w, cloudinaryUrl(publicId, w, crop, quality)] as const)
  if (urls.length === 0 || urls.some(([, url]) => url === null)) return null
  return {
    src: urls[0]![1]!,
    srcSet: urls.map(([w, url]) => `${url} ${w}w`).join(', '),
  }
}
