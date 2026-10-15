import sharp from 'sharp'
import { MAX_LONG_EDGE } from '../../src/modules/albums/application/albumUpload.js'

/**
 * Prepares a photo for the web: applies the camera's rotation, fits it within 2500 px on the long edge
 * (never enlarges), and saves a JPEG. sharp drops all metadata by default, so GPS location, camera and
 * owner details in the original never reach the public site.
 */
export async function resizeForWeb(
  input: Buffer | string,
): Promise<{ data: Buffer; width: number; height: number }> {
  const { data, info } = await sharp(input)
    .rotate()
    .resize({
      width: MAX_LONG_EDGE,
      height: MAX_LONG_EDGE,
      fit: 'inside',
      withoutEnlargement: true,
    })
    .jpeg({ quality: 82, mozjpeg: true })
    .toBuffer({ resolveWithObject: true })
  return { data, width: info.width, height: info.height }
}
