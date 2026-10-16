/**
 * Sites known for pirated textbooks and papers. The Academics Committee checks resources before
 * adding them; this stops the dashboard saving a link to one of these by mistake. Keep in step
 * with BLOCKED_HOSTS in client/src/features/academics/resources/api.ts, which hides them on the
 * site as a second safety net.
 */
export const BLOCKED_HOSTS = [
  'libgen',
  'library.lol',
  'z-lib',
  'zlibrary',
  'z-library',
  '1lib',
  'b-ok',
  'pdfdrive',
  'annas-archive',
  'sci-hub',
  'ebookee',
  'vdoc.pub',
  'dokumen.pub',
]

/**
 * True when the link's host contains a known piracy site's name (the same rule as the client).
 * Empty or invalid links: false; the model checks those.
 */
export function isBlockedLink(url: string): boolean {
  let host: string
  try {
    host = new URL(url).hostname.toLowerCase()
  } catch {
    return false
  }
  return BLOCKED_HOSTS.some((blocked) => host.includes(blocked))
}
