import { isSession } from '../../../lib/sessions.js'

/** Every upload lives under this root (README → Images and Cloudinary). */
export const MEDIA_ROOT = 'pans-unilag'

const SLUG = '[a-z0-9]+(?:-[a-z0-9]+)*'
const SESSION = '(\\d{4})-(\\d{4})'

/**
 * The folders the dashboard may upload into, relative to MEDIA_ROOT. Anything else is refused,
 * so an editor (or a stolen session) can't write over brand assets elsewhere in the account.
 */
const FOLDER_RULES: { pattern: RegExp; example: string }[] = [
  { pattern: /^brand$/, example: 'brand' },
  { pattern: new RegExp(`^executives/${SESSION}$`), example: 'executives/2026-2027' },
  { pattern: new RegExp(`^senate/${SESSION}$`), example: 'senate/2026-2027' },
  { pattern: new RegExp(`^committees/${SLUG}$`), example: 'committees/admap' },
  {
    pattern: new RegExp(`^events/${SLUG}(?:/${SLUG})?$`),
    example: 'events/health-week-2026/day-3',
  },
  {
    pattern: /^publications\/(?:recipharm|newspaper|substack)$/,
    example: 'publications/recipharm',
  },
]

export const FOLDER_EXAMPLES = FOLDER_RULES.map((r) => r.example)

/** True for an allowed folder (relative to MEDIA_ROOT). Session folders must be real sessions. */
export function isAllowedFolder(folder: string): boolean {
  return FOLDER_RULES.some(({ pattern }) => {
    const match = pattern.exec(folder)
    if (!match) return false
    // executives/2026-2028 matches the pattern but is not a session.
    return match[1] === undefined || isSession(`${match[1]}/${match[2]}`)
  })
}

export const PUBLIC_ID_PATTERN = /^[a-z0-9][a-z0-9_-]{0,79}$/

/** Cloudinary rejects signatures older than one hour; the dashboard should ask for a new one per upload. */
export const SIGNATURE_LIFETIME_SECONDS = 60 * 60

export const ALLOWED_FORMATS = 'jpg,jpeg,png,webp'

export type MediaConfig = { cloudName: string; apiKey: string; apiSecret: string }

export type SignedUpload = {
  uploadUrl: string
  cloudName: string
  /** Public (not secret): Cloudinary needs it alongside the signature. */
  apiKey: string
  /** Send these exactly, plus `file`, `api_key` and `signature`, as the multipart form fields. */
  params: Record<string, string | number>
  signature: string
  expiresAt: string
}

/**
 * Signs one direct upload to Cloudinary. The API secret stays here; the browser gets only the
 * signature, which is valid for these exact parameters (folder, formats, optional public id).
 */
export function signUpload(
  config: MediaConfig,
  request: { folder: string; publicId?: string },
  now: Date,
  sign: (params: Record<string, string | number>, secret: string) => string,
): SignedUpload {
  const timestamp = Math.floor(now.getTime() / 1000)
  const params: Record<string, string | number> = {
    allowed_formats: ALLOWED_FORMATS,
    folder: `${MEDIA_ROOT}/${request.folder}`,
    timestamp,
    ...(request.publicId
      ? { public_id: request.publicId, overwrite: 'true', invalidate: 'true' }
      : {}),
  }
  return {
    uploadUrl: `https://api.cloudinary.com/v1_1/${config.cloudName}/image/upload`,
    cloudName: config.cloudName,
    apiKey: config.apiKey,
    params,
    signature: sign(params, config.apiSecret),
    expiresAt: new Date((timestamp + SIGNATURE_LIFETIME_SECONDS) * 1000).toISOString(),
  }
}
