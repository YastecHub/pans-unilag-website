import { readFileSync } from 'node:fs'
import request from 'supertest'
import { describe, expect, it } from 'vitest'
import { createApp, type Readers } from '../src/app.js'
import { eventWhen, plainText, shorten } from '../src/lib/linkPreview.js'
import type { StoredEvent } from '../src/modules/events/application/eventView.js'
import type { StoredOpportunity } from '../src/modules/opportunities/application/opportunityView.js'
import { originalUrl } from '../src/vercel.js'
import { seedReaders } from './seedReaders.js'

const NOW = new Date('2026-10-16T09:00:00+01:00')
const SITE = 'https://pans-unilag.vercel.app'

const events: StoredEvent[] = [
  {
    slug: 'pharmalympics-2027',
    title: 'Pharmalympics 2027',
    startsAt: '2027-03-12T08:00:00+01:00',
    endsAt: '2027-03-14T18:00:00+01:00',
    venue: 'Faculty of Pharmacy, Idi-Araba',
    description:
      '## Games week\n\nThe **inter-class** sports festival. [Register](https://example.com) now!',
    coverImage: 'pans-unilag/events/pharmalympics-2027/cover',
    coverImageAlt: 'Students racing on the faculty field',
  },
  {
    slug: 'awards-night',
    title: 'Awards Night',
    datePrecision: 'month',
    startsAt: '2027-04-01T00:00:00+01:00',
    endsAt: '2027-05-31T23:59:59+01:00',
    coverImage: 'pans-unilag/events/awards-night/cover',
    isPlaceholder: true,
  },
  { slug: 'unsafe', title: 'A "quoted" <script>alert(1)</script> & co', description: "It's <b>" },
]
const opportunities: StoredOpportunity[] = [
  {
    slug: 'graduate-trainee',
    title: 'Graduate Trainee Pharmacist',
    type: 'internship',
    organisation: 'Lagos University Teaching Hospital',
    deadline: '2026-10-23T00:00:00+01:00',
    description: 'A paid placement for final-year students.',
  },
  { slug: 'closed', title: 'Closed', type: 'scholarship', deadline: '2026-10-15T00:00:00+01:00' },
]
const readers: Partial<Readers> = {
  events: {
    list: async () => events,
    findBySlug: async (s) => events.find((e) => e.slug === s) ?? null,
  },
  opportunities: {
    list: async () => opportunities,
    findBySlug: async (s) => opportunities.find((o) => o.slug === s) ?? null,
  },
}
const app = createApp({
  clientOrigins: [`${SITE}/`],
  isProduction: true,
  readers: { ...seedReaders(), ...readers },
  now: () => NOW,
  previews: { cloudName: 'pans' },
})
const meta = (html: string, property: string) =>
  new RegExp(`<meta (?:property|name)="${property}" content="([^"]*)">`).exec(html)?.[1]

describe('link previews for crawlers', () => {
  it('describes an event with its dates, venue, text and cover photo', async () => {
    const res = await request(app).get('/api/previews/events/pharmalympics-2027')
    expect(res.status).toBe(200)
    expect(res.headers['content-type']).toMatch(/^text\/html/)
    expect(res.headers['cache-control']).toBe('public, max-age=0, s-maxage=300')
    expect(meta(res.text, 'og:title')).toBe('Pharmalympics 2027')
    expect(meta(res.text, 'og:description')).toBe(
      '12 – 14 Mar 2027 · Faculty of Pharmacy, Idi-Araba. Games week The inter-class sports festival. Register now!',
    )
    expect(meta(res.text, 'og:url')).toBe(`${SITE}/events/pharmalympics-2027`)
    expect(res.text).toContain(`<link rel="canonical" href="${SITE}/events/pharmalympics-2027">`)
    expect(meta(res.text, 'og:image')).toBe(
      'https://res.cloudinary.com/pans/image/upload/c_fill,g_auto,h_630,w_1200/f_jpg/q_auto/pans-unilag/events/pharmalympics-2027/cover',
    )
    expect(meta(res.text, 'og:image:alt')).toBe('Students racing on the faculty field')
    expect(meta(res.text, 'twitter:card')).toBe('summary_large_image')
    expect(res.text).toContain('<title>Pharmalympics 2027 · PANS UNILAG</title>')
  })

  it('never uses a placeholder’s image, and shows month-only dates as months', async () => {
    const res = await request(app).get('/api/previews/events/awards-night')
    expect(meta(res.text, 'og:image')).toBe(`${SITE}/og-default.png`)
    expect(meta(res.text, 'og:description')).toBe('April – May 2027')
  })

  it('escapes what admins type, so a title can’t add tags or scripts', async () => {
    const res = await request(app).get('/api/previews/events/unsafe')
    expect(res.text).not.toContain('<script>')
    expect(res.text).not.toContain('<b>')
    expect(meta(res.text, 'og:title')).toBe(
      'A &quot;quoted&quot; &lt;script&gt;alert(1)&lt;/script&gt; &amp; co',
    )
    expect(meta(res.text, 'og:description')).toBe('It&#39;s &lt;b&gt;')
  })

  it('describes an open opportunity with its type, organisation and deadline', async () => {
    const res = await request(app).get('/api/previews/opportunities/graduate-trainee')
    expect(res.status).toBe(200)
    expect(meta(res.text, 'og:title')).toBe('Graduate Trainee Pharmacist')
    expect(meta(res.text, 'og:description')).toBe(
      'Internship · Lagos University Teaching Hospital · Apply by 23 Oct 2026. A paid placement for final-year students.',
    )
    expect(meta(res.text, 'og:image')).toBe(`${SITE}/og-default.png`)
  })

  it('falls back to the site-wide card for a closed opportunity or a missing event', async () => {
    for (const path of ['/opportunities/closed', '/events/no-such-event']) {
      const res = await request(app).get(`/api/previews${path}`)
      expect(res.status).toBe(404)
      expect(meta(res.text, 'og:title')).toBe('PANS UNILAG: Service to Humanity')
      expect(meta(res.text, 'og:url')).toBe(`${SITE}${path}`)
    }
  })

  it('only answers for events and opportunities', async () => {
    const res = await request(app).get('/api/previews/executives/president')
    expect(res.status).toBe(404)
    expect(res.body.error.code).toBe('NOT_FOUND')
  })
})

describe('preview text', () => {
  it('turns Markdown into one line of plain text', () => {
    expect(plainText('# Title\n\n- **one**\n- _two_ [link](https://x.y)\n\n![photo](a.jpg)')).toBe(
      'Title one two link',
    )
  })

  it('shortens long text at a word, never mid-word', () => {
    const text = 'word '.repeat(60).trim()
    const short = shorten(text)
    expect(short.length).toBeLessThanOrEqual(200)
    expect(short).toMatch(/ word…$/)
    expect(shorten('Short enough.')).toBe('Short enough.')
  })

  it('writes dates like the event page, in Lagos time', () => {
    const day = (startsAt: string, endsAt: string) =>
      eventWhen({ startsAt, endsAt, datePrecision: 'day' })
    expect(day('2026-12-30T23:30:00Z', '2026-12-30T23:45:00Z')).toBe('31 Dec 2026')
    expect(day('2026-11-30T09:00:00Z', '2026-12-04T09:00:00Z')).toBe('30 Nov – 4 Dec 2026')
    expect(day('2026-12-28T09:00:00Z', '2027-01-02T09:00:00Z')).toBe('28 Dec 2026 – 2 Jan 2027')
    expect(eventWhen({ startsAt: null, endsAt: null, datePrecision: 'unknown' })).toBe('')
  })
})

describe('the Vercel rewrites for link previews', () => {
  const vercel = JSON.parse(
    readFileSync(new URL('../../vercel.json', import.meta.url), 'utf8'),
  ) as {
    rewrites: { source: string; destination: string; has?: { value: string }[] }[]
  }
  const previews = vercel.rewrites.filter((r) => r.has)
  const isBot = (agent: string) => new RegExp(`^${previews[0]!.has![0]!.value}$`).test(agent)

  it('sends crawlers for events and opportunities to the function, before the app catch-all', () => {
    expect(previews.map((r) => [r.source, r.destination])).toEqual([
      ['/events/:slug', '/api?preview=events&slug=:slug'],
      ['/opportunities/:slug', '/api?preview=opportunities&slug=:slug'],
    ])
    const sources = vercel.rewrites.map((r) => r.source)
    expect(sources.indexOf('/events/:slug')).toBeLessThan(sources.indexOf('/(.*)'))
    expect(new Set(previews.map((r) => r.has![0]!.value)).size).toBe(1)
  })

  it('recognises the link-preview crawlers', () => {
    for (const agent of [
      'WhatsApp/2.24.20.89 A',
      'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
      'Twitterbot/1.0',
      'LinkedInBot/1.0 (compatible; Mozilla/5.0; Apache-HttpClient +http://www.linkedin.com)',
      'TelegramBot (like TwitterBot)',
      'Slackbot-LinkExpanding 1.0 (+https://api.slack.com/robots)',
      'Mozilla/5.0 (compatible; Discordbot/2.0; +https://discordapp.com)',
      // iMessage
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_1) AppleWebKit/601.2.4 (KHTML, like Gecko) Version/9.0.1 Safari/601.2.4 facebookexternalhit/1.1 Facebot Twitterbot/1.0',
    ])
      expect(isBot(agent), agent).toBe(true)
  })

  it('leaves people (in-app browsers included) and search engines on the normal app', () => {
    for (const agent of [
      'Mozilla/5.0 (Linux; Android 13; TECNO KJ7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Mobile Safari/537.36',
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 [FBAN/FBIOS;FBAV/470.0.0.0]',
      'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Mobile Safari/537.36 Instagram 350.0',
      'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
      '',
    ])
      expect(isBot(agent), agent).toBe(false)
  })

  it('maps either form of the rewritten request onto the preview route', () => {
    expect(originalUrl('/api?preview=events&slug=pharmalympics-2027')).toBe(
      '/api/previews/events/pharmalympics-2027',
    )
    expect(originalUrl('/api?slug=graduate-trainee&preview=opportunities')).toBe(
      '/api/previews/opportunities/graduate-trainee',
    )
    expect(originalUrl('/events/pharmalympics-2027')).toBe(
      '/api/previews/events/pharmalympics-2027',
    )
    expect(originalUrl('/opportunities/graduate-trainee/?slug=graduate-trainee')).toBe(
      '/api/previews/opportunities/graduate-trainee',
    )
    // Anything else is left alone.
    expect(originalUrl('/api?preview=executives&slug=x')).toBe('/api?preview=executives&slug=x')
    expect(originalUrl('/api/events/pharmalympics-2027')).toBe('/api/events/pharmalympics-2027')
  })
})
