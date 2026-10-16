import { describe, expect, it } from 'vitest'
import { getPreviewMeta, injectMetaTags, type PreviewMeta } from '../src/lib/linkPreview.js'

describe('linkPreview', () => {
  const sampleHtml = `<!doctype html>
<html>
<head>
  <title>PANS UNILAG: Service to Humanity</title>
  <meta property="og:title" content="PANS UNILAG: Service to Humanity" />
  <meta property="og:description" content="Pharmaceutical Association of Nigeria Students" />
  <meta property="og:url" content="https://pansunilag.com/" />
  <meta property="og:image" content="https://pansunilag.com/og-default.png" />
  <meta property="og:image:alt" content="PANS UNILAG badge" />
  <meta name="twitter:title" content="PANS UNILAG: Service to Humanity" />
  <meta name="twitter:description" content="Pharmaceutical Association of Nigeria Students" />
  <meta name="twitter:url" content="https://pansunilag.com/" />
  <meta name="twitter:image" content="https://pansunilag.com/og-default.png" />
  <meta name="twitter:image:alt" content="PANS UNILAG badge" />
</head>
<body><div id="root"></div></body>
</html>`

  it('injects event meta tags with cover image and alt', () => {
    const meta: PreviewMeta = {
      title: 'Health Week 2026 Opening Ceremony · PANS UNILAG',
      description: 'Join us for the official kickoff of the 2026 PANS Health Week.',
      url: 'https://pansunilag.com/events/health-week-2026-day-1',
      image: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
      imageAlt: 'Health Week Opening Ceremony',
    }

    const result = injectMetaTags(sampleHtml, meta)

    expect(result).toContain('<title>Health Week 2026 Opening Ceremony · PANS UNILAG</title>')
    expect(result).toContain(
      '<meta property="og:title" content="Health Week 2026 Opening Ceremony · PANS UNILAG" />',
    )
    expect(result).toContain(
      '<meta property="og:description" content="Join us for the official kickoff of the 2026 PANS Health Week." />',
    )
    expect(result).toContain(
      '<meta property="og:url" content="https://pansunilag.com/events/health-week-2026-day-1" />',
    )
    expect(result).toContain(
      '<meta property="og:image" content="https://res.cloudinary.com/demo/image/upload/sample.jpg" />',
    )
    expect(result).toContain(
      '<meta property="og:image:alt" content="Health Week Opening Ceremony" />',
    )
  })

  it('generates preview meta for a valid event', async () => {
    const mockEvents = {
      findBySlug: async (slug: string) =>
        slug === 'pharmalympics-2026'
          ? {
              slug: 'pharmalympics-2026',
              title: 'Pharmalympics 2026',
              description: 'Annual sports competition for pharmacy students.',
              coverImage: 'https://res.cloudinary.com/pans/image/upload/sports.jpg',
              coverImageAlt: 'Pharmalympics athletes',
            }
          : null,
      list: async () => [],
    }

    const mockOpps = {
      findBySlug: async () => null,
      list: async () => [],
    }

    const meta = await getPreviewMeta(
      '/events/pharmalympics-2026',
      { events: mockEvents, opportunities: mockOpps },
      'https://pansunilag.com',
    )

    expect(meta).toEqual({
      title: 'Pharmalympics 2026 · PANS UNILAG',
      description: 'Annual sports competition for pharmacy students.',
      url: 'https://pansunilag.com/events/pharmalympics-2026',
      image: 'https://res.cloudinary.com/pans/image/upload/sports.jpg',
      imageAlt: 'Pharmalympics athletes',
    })
  })

  it('generates preview meta for a valid opportunity', async () => {
    const mockEvents = {
      findBySlug: async () => null,
      list: async () => [],
    }

    const mockOpps = {
      findBySlug: async (slug: string) =>
        slug === 'who-internship'
          ? {
              slug: 'who-internship',
              title: 'WHO Global Health Internship',
              type: 'internship' as const,
              organisation: 'World Health Organization',
              description: 'Paid summer internship for pharmacy students.',
            }
          : null,
      list: async () => [],
    }

    const meta = await getPreviewMeta(
      '/opportunities/who-internship',
      { events: mockEvents, opportunities: mockOpps },
      'https://pansunilag.com',
    )

    expect(meta).toEqual({
      title: 'WHO Global Health Internship · PANS UNILAG',
      description: 'Paid summer internship for pharmacy students.',
      url: 'https://pansunilag.com/opportunities/who-internship',
      image: 'https://pansunilag.com/og-default.png',
      imageAlt: 'WHO Global Health Internship',
    })
  })

  it('returns null for unmatched paths', async () => {
    const mockEvents = { findBySlug: async () => null, list: async () => [] }
    const mockOpps = { findBySlug: async () => null, list: async () => [] }

    const meta = await getPreviewMeta(
      '/about',
      { events: mockEvents, opportunities: mockOpps },
      'https://pansunilag.com',
    )

    expect(meta).toBeNull()
  })
})
