/**
 * Official Executive Council portraits that ship with the site, so a session's photos show without
 * uploading each one in the dashboard (2026/2027: Team Aurea, by Bukade Clicks Photography). A
 * photo uploaded in the dashboard (Content → Executive Council → Photo) always wins over these.
 *
 * Files: assets/executives/<session as 2026-2027>/exec-<office in kebab-case>.webp, 960 × 720
 * head-and-shoulders crops of 10–40 KB; exec-team.webp is the group photo. The exec- prefix keeps
 * them out of the offline cache (pwa/plugin.ts), so they load only when someone sees them.
 */
const FILES = import.meta.glob<string>('../../assets/executives/*/*.webp', {
  eager: true,
  import: 'default',
})

const slug = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

const fileFor = (session: string, name: string) =>
  FILES[`../../assets/executives/${session.replace('/', '-')}/exec-${name}.webp`]

/** The bundled portrait for an office in a session, if there is one. */
export const bundledExecutivePhoto = (session: string, office: string): string | undefined =>
  fileFor(session, slug(office))

/** The bundled group photo of a session's Executive Council, if there is one. */
export const bundledTeamPhoto = (session: string): string | undefined => fileFor(session, 'team')
