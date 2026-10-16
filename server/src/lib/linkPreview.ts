import type { EventReader } from '../modules/events/application/eventView.js'
import type { OpportunityReader } from '../modules/opportunities/application/opportunityView.js'

export type PreviewMeta = {
  title: string
  description: string
  url: string
  image?: string
  imageAlt?: string
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

/**
 * Injects Open Graph and Twitter Card tags into an index.html template string.
 */
export function injectMetaTags(html: string, meta: PreviewMeta): string {
  const safeTitle = escapeHtml(meta.title)
  const safeDesc = escapeHtml(meta.description)
  const safeUrl = escapeHtml(meta.url)
  const safeImage = meta.image ? escapeHtml(meta.image) : ''
  const safeImageAlt = meta.imageAlt ? escapeHtml(meta.imageAlt) : safeTitle

  let modified = html
    .replace(/<title>.*?<\/title>/i, `<title>${safeTitle}</title>`)
    .replace(
      /<meta property="og:title" content=".*?" \/>/i,
      `<meta property="og:title" content="${safeTitle}" />`,
    )
    .replace(
      /<meta property="og:description" content=".*?" \/>/i,
      `<meta property="og:description" content="${safeDesc}" />`,
    )
    .replace(
      /<meta property="og:url" content=".*?" \/>/i,
      `<meta property="og:url" content="${safeUrl}" />`,
    )
    .replace(
      /<meta name="twitter:title" content=".*?" \/>/i,
      `<meta name="twitter:title" content="${safeTitle}" />`,
    )
    .replace(
      /<meta name="twitter:description" content=".*?" \/>/i,
      `<meta name="twitter:description" content="${safeDesc}" />`,
    )
    .replace(
      /<meta name="twitter:url" content=".*?" \/>/i,
      `<meta name="twitter:url" content="${safeUrl}" />`,
    )

  if (safeImage) {
    modified = modified
      .replace(
        /<meta property="og:image" content=".*?" \/>/i,
        `<meta property="og:image" content="${safeImage}" />`,
      )
      .replace(
        /<meta property="og:image:alt" content=".*?" \/>/i,
        `<meta property="og:image:alt" content="${safeImageAlt}" />`,
      )
      .replace(
        /<meta name="twitter:image" content=".*?" \/>/i,
        `<meta name="twitter:image" content="${safeImage}" />`,
      )
      .replace(
        /<meta name="twitter:image:alt" content=".*?" \/>/i,
        `<meta name="twitter:image:alt" content="${safeImageAlt}" />`,
      )
  }

  return modified
}

/**
 * Generates dynamic Open Graph metadata for individual events and opportunities.
 */
export async function getPreviewMeta(
  path: string,
  readers: { events: EventReader; opportunities: OpportunityReader },
  siteUrl = 'https://pansunilag.com',
): Promise<PreviewMeta | null> {
  const eventMatch = path.match(/^\/events\/([a-z0-9-]+)\/?$/)
  if (eventMatch) {
    const slug = eventMatch[1]
    const event = await readers.events.findBySlug(slug)
    if (event) {
      const title = `${event.title} · PANS UNILAG`
      const description = event.description
        ? event.description.slice(0, 160).trim().replace(/\n+/g, ' ')
        : `${event.title} organized by PANS UNILAG.`
      return {
        title,
        description,
        url: `${siteUrl}/events/${slug}`,
        image: event.coverImage || `${siteUrl}/og-default.png`,
        imageAlt: event.coverImageAlt || event.title,
      }
    }
  }

  const oppMatch = path.match(/^\/opportunities\/([a-z0-9-]+)\/?$/)
  if (oppMatch) {
    const slug = oppMatch[1]
    const opp = await readers.opportunities.findBySlug(slug)
    if (opp) {
      const title = `${opp.title} · PANS UNILAG`
      const org = opp.organisation ? ` with ${opp.organisation}` : ''
      const description = opp.description
        ? opp.description.slice(0, 160).trim().replace(/\n+/g, ' ')
        : `Opportunity: ${opp.title}${org}. Apply via PANS UNILAG.`
      return {
        title,
        description,
        url: `${siteUrl}/opportunities/${slug}`,
        image: `${siteUrl}/og-default.png`,
        imageAlt: opp.title,
      }
    }
  }

  return null
}
