import { type EventReader, toEventView } from '../modules/events/application/eventView.js'
import {
  isOpen,
  type OpportunityReader,
  toOpportunityView,
} from '../modules/opportunities/application/opportunityView.js'

/**
 * Link previews for event and opportunity pages (issue #45).
 *
 * The site is a single-page app: every address serves the same index.html, whose Open Graph tags
 * describe the whole site. WhatsApp, Facebook, X, LinkedIn, Telegram and the like read those tags
 * without running JavaScript, so a shared event link would show the generic card. vercel.json
 * sends those crawlers (and only them, by User-Agent) to the API for /events/:slug and
 * /opportunities/:slug, and this page answers with tags for that one item. People still get the
 * normal static app from the CDN.
 */

export type PreviewOptions = {
  /** The public site address, e.g. "https://pans-unilag.vercel.app" (no trailing slash). */
  siteUrl: string
  /** Cloudinary cloud for cover images; without it the default card image is used. */
  cloudName?: string
}

export type Preview = {
  title: string
  description: string
  /** The page's own address on the site. */
  url: string
  image: string
  imageAlt: string
}

export type PreviewReaders = { events: EventReader; opportunities: OpportunityReader }

const SITE_TITLE = 'PANS UNILAG: Service to Humanity'
const SITE_DESCRIPTION =
  'Pharmaceutical Association of Nigerian Students, University of Lagos: events, opportunities, academics and leadership.'
const TIME_ZONE = 'Africa/Lagos'
/** Long enough for WhatsApp's two lines and Facebook's card, short enough not to be cut mid-word by them. */
const DESCRIPTION_LIMIT = 200

const TYPE_LABELS: Record<string, string> = {
  scholarship: 'Scholarship',
  internship: 'Internship',
  competition: 'Competition',
  conference: 'Conference',
  training: 'Training',
  job: 'Job',
  other: 'Opportunity',
}

/** Markdown (the editors' format) as one line of plain text. */
export function plainText(markdown: string): string {
  return markdown
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '') // images
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1') // links: keep the text
    .replace(/^\s{0,3}(#{1,6}\s+|>\s?|[-*+]\s+|\d+[.)]\s+)/gm, '') // headings, quotes, list markers
    .replace(/(\*\*|__|\*|_|`)/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Cut at a word boundary, with an ellipsis, so a preview never ends mid-word. */
export function shorten(text: string, limit = DESCRIPTION_LIMIT): string {
  if (text.length <= limit) return text
  const cut = text.slice(0, limit - 1)
  const space = cut.lastIndexOf(' ')
  return `${(space > limit / 2 ? cut.slice(0, space) : cut).replace(/[\s,.;:–-]+$/, '')}…`
}

const dateParts = (iso: string) => {
  const get = (options: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat('en-GB', { timeZone: TIME_ZONE, ...options }).format(new Date(iso))
  return {
    day: get({ day: 'numeric' }),
    shortMonth: get({ month: 'short' }),
    longMonth: get({ month: 'long' }),
    year: get({ year: 'numeric' }),
  }
}
const formatDate = (iso: string) => {
  const p = dateParts(iso)
  return `${p.day} ${p.shortMonth} ${p.year}`
}

/** The same wording as the event page (client/src/lib/dates.ts): "7 – 11 Jun 2027", "April 2027". */
export function eventWhen(e: {
  startsAt: string | null
  endsAt: string | null
  datePrecision: string
}): string {
  if (e.datePrecision === 'unknown' || !e.startsAt) return ''
  const [s, t] = [dateParts(e.startsAt), dateParts(e.endsAt ?? e.startsAt)]
  if (e.datePrecision === 'month') {
    if (s.year !== t.year) return `${s.longMonth} ${s.year} – ${t.longMonth} ${t.year}`
    if (s.longMonth !== t.longMonth) return `${s.longMonth} – ${t.longMonth} ${t.year}`
    return `${s.longMonth} ${s.year}`
  }
  if (s.year !== t.year) return `${formatDate(e.startsAt)} – ${formatDate(e.endsAt!)}`
  if (s.shortMonth !== t.shortMonth)
    return `${s.day} ${s.shortMonth} – ${t.day} ${t.shortMonth} ${t.year}`
  if (s.day !== t.day) return `${s.day} – ${t.day} ${t.shortMonth} ${t.year}`
  return formatDate(e.startsAt)
}

const join = (...parts: string[]) => parts.filter(Boolean).join(' · ')
const sentence = (head: string, body: string) =>
  shorten(head && body ? `${head}. ${body}` : head || body)

/** A 1200 × 630 JPEG of a Cloudinary image: the size every network shows as a large card. */
function coverUrl(publicId: string, cloudName: string) {
  const id = publicId.split('/').map(encodeURIComponent).join('/')
  return `https://res.cloudinary.com/${encodeURIComponent(cloudName)}/image/upload/c_fill,g_auto,h_630,w_1200/f_jpg/q_auto/${id}`
}

/** The site-wide card (the same as index.html), for any other address or a missing item. */
export function sitePreview(path: string, options: PreviewOptions): Preview {
  return {
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    url: `${options.siteUrl}${path}`,
    image: `${options.siteUrl}/og-default.png`,
    imageAlt: 'The PANS UNILAG badge',
  }
}

/**
 * The preview for one page, or null if there's no such event or open opportunity (the caller
 * then shows the site-wide card). Placeholder text and placeholder images are never used.
 */
export async function previewFor(
  kind: 'events' | 'opportunities',
  slug: string,
  readers: PreviewReaders,
  options: PreviewOptions,
  now: Date,
): Promise<Preview | null> {
  const url = `${options.siteUrl}/${kind}/${encodeURIComponent(slug)}`
  const fallbackImage = sitePreview('', options)

  if (kind === 'events') {
    const stored = await readers.events.findBySlug(slug)
    if (!stored) return null
    const e = toEventView(stored, now)
    const hasCover = !e.isPlaceholder && e.coverImage && options.cloudName
    return {
      title: e.title,
      description: sentence(join(eventWhen(e), e.venue), plainText(e.description)),
      url,
      image: hasCover ? coverUrl(e.coverImage, options.cloudName!) : fallbackImage.image,
      imageAlt: hasCover ? e.coverImageAlt || e.title : fallbackImage.imageAlt,
    }
  }

  const stored = await readers.opportunities.findBySlug(slug)
  // Closed listings 404 on the site too.
  if (!stored || !isOpen(stored, now)) return null
  const o = toOpportunityView(stored)
  const deadline = o.deadline ? `Apply by ${formatDate(o.deadline)}` : 'Open all year'
  return {
    title: o.title,
    description: sentence(
      join(TYPE_LABELS[o.type] ?? 'Opportunity', o.organisation, deadline),
      plainText(o.description),
    ),
    url,
    image: fallbackImage.image,
    imageAlt: fallbackImage.imageAlt,
  }
}

const escapeHtml = (text: string) =>
  text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

/** A small page with only the tags crawlers read, and a link to the page for anyone else. */
export function previewHtml(preview: Preview): string {
  const p = Object.fromEntries(
    Object.entries(preview).map(([key, value]) => [key, escapeHtml(value)]),
  ) as Preview
  const fullTitle = p.title === escapeHtml(SITE_TITLE) ? p.title : `${p.title} · PANS UNILAG`
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>${fullTitle}</title>
<meta name="description" content="${p.description}">
<link rel="canonical" href="${p.url}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="PANS UNILAG">
<meta property="og:locale" content="en_NG">
<meta property="og:title" content="${p.title}">
<meta property="og:description" content="${p.description}">
<meta property="og:url" content="${p.url}">
<meta property="og:image" content="${p.image}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="${p.imageAlt}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:site" content="@PANS_Unilag">
<meta name="twitter:title" content="${p.title}">
<meta name="twitter:description" content="${p.description}">
<meta name="twitter:image" content="${p.image}">
<meta name="twitter:image:alt" content="${p.imageAlt}">
</head>
<body>
<h1>${p.title}</h1>
<p>${p.description}</p>
<p><a href="${p.url}">Open the page</a></p>
</body>
</html>
`
}
