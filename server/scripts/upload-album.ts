/**
 * Uploads a curated folder of photos for one event to Cloudinary and records them in seed/albums.json.
 *
 *   npm run upload-album -w server -- --event health-week-2026-day-3 --dir photos/health-week-2026-day-3 --consent-confirmed
 *   (PowerShell drops a bare --, so type it as '--' there.)
 *   --dir is relative to the folder you run npm from (usually the repo root).
 *   options: --cover 5 (which photo is the album cover, default 1)   --dry-run (resize and report only)
 *
 * Needs CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET in server/.env.
 * Re-running for the same event replaces its photos (same public ids) and keeps edited alt text.
 */
import { existsSync } from 'node:fs'
import { readdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { v2 as cloudinary } from 'cloudinary'
import {
  albumFolder,
  IMAGE_EXTENSIONS,
  MAX_PHOTOS,
  photoPublicId,
  RECOMMENDED_MIN_PHOTOS,
  updateAlbums,
  type SeedAlbum,
} from '../src/modules/albums/application/albumUpload.js'
import { resizeForWeb } from './lib/resizeForWeb.js'

const SEED_DIR = fileURLToPath(new URL('../seed/', import.meta.url))
const mb = (bytes: number) => `${(bytes / 1024 / 1024).toFixed(1)} MB`

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(name)
  return i === -1 ? undefined : process.argv[i + 1]
}

function fail(message: string): never {
  console.error(`\n${message}\n`)
  process.exit(1)
}

async function main() {
  const eventSlug = arg('--event')
  const dirArg = arg('--dir')
  // npm runs this from server/, so resolve --dir from where npm was started (INIT_CWD).
  const dir = dirArg && path.resolve(process.env.INIT_CWD ?? process.cwd(), dirArg)
  const dryRun = process.argv.includes('--dry-run')
  const coverIndex = Number(arg('--cover') ?? '1') - 1
  if (!eventSlug || !dir)
    fail(
      [
        'Usage: npm run upload-album -w server -- --event <event-slug> --dir <folder> --consent-confirmed [--cover N] [--dry-run]',
        "In PowerShell, quote the --:  npm run upload-album -w server '--' --event ... --dir ...",
      ].join('\n'),
    )
  if (!dryRun && !process.argv.includes('--consent-confirmed')) {
    fail(
      'Add --consent-confirmed only after the Media Committee has confirmed the people pictured agreed to publication.',
    )
  }

  const events = JSON.parse(await readFile(path.join(SEED_DIR, 'events.json'), 'utf8')) as {
    slug: string
    title: string
    series?: string
    dayNumber?: number
  }[]
  const event =
    events.find((e) => e.slug === eventSlug) ?? fail(`No event "${eventSlug}" in seed/events.json`)

  const files = (await readdir(dir))
    .filter((f) => IMAGE_EXTENSIONS.includes(path.extname(f).toLowerCase()))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
  if (files.length === 0) fail(`No JPG, PNG or WebP photos in ${dir}`)
  if (files.length > MAX_PHOTOS)
    fail(
      `${files.length} photos: curate down to ${MAX_PHOTOS} or fewer and link the Drive folder for the rest.`,
    )
  if (files.length < RECOMMENDED_MIN_PHOTOS)
    console.warn(
      `Note: ${files.length} photos (the guideline is ${RECOMMENDED_MIN_PHOTOS}–${MAX_PHOTOS}).`,
    )

  if (!dryRun) {
    if (existsSync('.env')) process.loadEnvFile('.env')
    const {
      CLOUDINARY_CLOUD_NAME: cloud_name,
      CLOUDINARY_API_KEY: api_key,
      CLOUDINARY_API_SECRET: api_secret,
    } = process.env
    if (!cloud_name || !api_key || !api_secret)
      fail('Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET in server/.env')
    cloudinary.config({ cloud_name, api_key, api_secret, secure: true })
  }

  const folder = albumFolder(event.slug)
  console.log(`${dryRun ? '[dry run] ' : ''}${event.title}: ${files.length} photos → ${folder}\n`)
  const publicIds: string[] = []
  let originalBytes = 0
  let uploadedBytes = 0

  for (const [i, file] of files.entries()) {
    const original = await readFile(path.join(dir, file))
    const { data, width, height } = await resizeForWeb(original)
    const publicId = photoPublicId(folder, i)
    originalBytes += original.length
    uploadedBytes += data.length
    if (!dryRun) {
      await new Promise<void>((resolve, reject) => {
        cloudinary.uploader
          .upload_stream(
            { public_id: publicId, overwrite: true, resource_type: 'image' },
            (error) => (error ? reject(error) : resolve()),
          )
          .end(data)
      })
    }
    publicIds.push(publicId)
    console.log(
      `  ${String(i + 1).padStart(2)}. ${file.padEnd(32)} ${width}×${height}  ${mb(data.length)}`,
    )
  }

  console.log(`\nTotal: ${mb(originalBytes)} original → ${mb(uploadedBytes)} uploaded`)
  if (dryRun) return

  const albumsFile = path.join(SEED_DIR, 'albums.json')
  const albums = JSON.parse(await readFile(albumsFile, 'utf8')) as SeedAlbum[]
  await writeFile(
    albumsFile,
    `${JSON.stringify(updateAlbums(albums, event, publicIds, coverIndex), null, 2)}\n`,
  )
  console.log(
    `Updated seed/albums.json. Next: improve the alt text for each photo, then run npm run seed:check -w server.`,
  )
}

main().catch((error: unknown) =>
  fail(`Upload failed: ${error instanceof Error ? error.message : String(error)}`),
)
