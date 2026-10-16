/**
 * The whole site on one local address, the way Vercel serves it, for the launch smoke tests
 * (client/e2e) and Lighthouse. No database needed:
 *
 * - the built client (client/dist) with the response headers from vercel.json (CSP and the rest),
 *   gzip like Vercel's CDN (so Lighthouse measures realistic transfer sizes), and the SPA fallback
 *   to index.html;
 * - vercel.json's link-preview rewrites: crawlers (by User-Agent) asking for an event or
 *   opportunity get the API's preview page instead of the app;
 * - the real Express API at /api, reading the seed files from memory, with an in-memory form
 *   store, dashboard and one test admin.
 *
 *   npm run build -w client && npm run e2e:server -w server     →  http://localhost:4321
 *
 * Test-only: the admin password below is not a secret and never reaches production, because
 * this file is not part of the server build (server/src) or the Vercel function.
 */
import { existsSync, readFileSync, statSync } from 'node:fs'
import { extname, join, normalize } from 'node:path'
import { fileURLToPath } from 'node:url'
import { gzipSync } from 'node:zlib'
import express from 'express'
import { createApp } from '../src/app.js'
import { ADMIN_RESOURCES } from '../src/modules/admin/application/adminResources.js'
import { PLACEHOLDER_PAGES } from '../src/modules/admin/application/placeholders.js'
import type {
  AlumnusRecord,
  FeedbackRecord,
  SubmissionAdminStore,
} from '../src/modules/admin/application/submissionsAdmin.js'
import { hashPassword } from '../src/modules/auth/application/passwords.js'
import type { SubmissionStore } from '../src/modules/submissions/application/submissionRules.js'
import { originalUrl } from '../src/vercel.js'
import { memoryAccounts } from '../tests/memoryAccounts.js'
import { memoryAdminCollection } from '../tests/memoryAdmin.js'
import { seedReaders } from '../tests/seedReaders.js'

export const E2E_PORT = Number(process.env.E2E_PORT ?? 4321)
export const E2E_ADMIN = {
  email: 'e2e-admin@pans.test',
  password: process.env.E2E_ADMIN_PASSWORD ?? 'e2e-only-password-not-a-secret',
}

const root = (path: string) => fileURLToPath(new URL(`../../${path}`, import.meta.url))
const dist = root('client/dist')
if (!existsSync(`${dist}/index.html`)) {
  console.error('\nBuild the client first: npm run build -w client\n')
  process.exit(1)
}

/** vercel.json "headers": a source like "/assets/(.*)" becomes a regular expression. */
type HeaderRule = { source: string; headers: { key: string; value: string }[] }
type Rewrite = {
  source: string
  destination: string
  has?: { type: string; key: string; value: string }[]
}
const vercel = JSON.parse(readFileSync(root('vercel.json'), 'utf8')) as {
  headers: HeaderRule[]
  rewrites: Rewrite[]
}
const matchers = vercel.headers.map((rule) => ({
  test: new RegExp(`^${rule.source.replace(/\(\.\*\)/g, '.*')}$`),
  headers: rule.headers,
}))
/** The rewrites that depend on the User-Agent (link previews), e.g. "/events/:slug". */
const botRewrites = vercel.rewrites.flatMap((rule) => {
  const agent = rule.has?.find((h) => h.type === 'header' && h.key === 'user-agent')
  if (!agent) return []
  return [
    {
      path: new RegExp(`^${rule.source.replace(/:(\w+)/g, '(?<$1>[^/]+)')}$`),
      agent: new RegExp(`^${agent.value}$`),
      destination: rule.destination,
    },
  ]
})

async function main() {
  // Everything a visitor or admin does is kept in memory and forgotten when the server stops.
  const feedback: FeedbackRecord[] = []
  const alumni: AlumnusRecord[] = []
  const submissions: SubmissionStore = {
    async saveFeedback(f) {
      feedback.unshift({
        id: `f${feedback.length + 1}`,
        ...f,
        status: 'new',
        createdAt: new Date().toISOString(),
      })
    },
    async saveAlumnus(a) {
      const now = new Date().toISOString()
      alumni.unshift({
        id: `a${alumni.length + 1}`,
        ...a,
        consentAt: a.consentAt.toISOString(),
        createdAt: now,
        updatedAt: now,
      })
    },
  }
  const page = <T>(items: T[], p: number, size: number) => ({
    items: items.slice((p - 1) * size, p * size),
    total: items.length,
    page: p,
    pageSize: size,
  })
  const submissionAdmin: SubmissionAdminStore = {
    listFeedback: async ({ status, page: p, pageSize }) =>
      page(
        feedback.filter((f) => !status || f.status === status),
        p,
        pageSize,
      ),
    setFeedbackStatus: async (id, status) => {
      const f = feedback.find((x) => x.id === id)
      if (f) f.status = status
      return f ?? null
    },
    listAlumni: async ({ page: p, pageSize }) => page(alumni, p, pageSize),
    removeAlumnus: async (id) => {
      const i = alumni.findIndex((a) => a.id === id)
      if (i >= 0) alumni.splice(i, 1)
      return i >= 0
    },
  }

  // The test admin is a developer, so every dashboard page (Accounts included) can be checked.
  const { admins, accounts } = memoryAccounts([
    {
      id: 'e2e-admin',
      name: 'Test Admin',
      email: E2E_ADMIN.email,
      role: 'developer',
      tokenVersion: 0,
      passwordHash: await hashPassword(E2E_ADMIN.password),
      createdAt: new Date(),
    },
  ])

  const seedFile: Record<string, string> = {
    pages: 'pages.json',
    executives: 'executives.json',
    senators: 'senate.json',
    committees: 'committees.json',
    patrons: 'patrons.json',
    events: 'events.json',
    albums: 'albums.json',
    publications: 'publications.json',
    documents: 'documents.json',
    gradingscales: 'grading.json',
    settings: 'settings.json',
  }
  const readSeed = (name: string) =>
    seedFile[name]
      ? (JSON.parse(readFileSync(root(`server/seed/${seedFile[name]}`), 'utf8')) as Record<
          string,
          unknown
        >[])
      : []
  const collections = Object.fromEntries(
    ADMIN_RESOURCES.map((r) => [r.name, memoryAdminCollection(r.model, readSeed(r.name))]),
  )

  const api = createApp({
    clientOrigins: [`http://localhost:${E2E_PORT}`],
    isProduction: false,
    readers: seedReaders(),
    submissions,
    // The real limits (5 forms an hour, 10 sign-ins per 15 minutes) would trip over repeated
    // test runs from one address; they have their own tests in server/tests.
    formRateLimit: { windowMs: 60_000, limit: 1000 },
    auth: {
      loginRateLimit: { windowMs: 60_000, limit: 1000 },
      jwtSecret: 'e2e-only-jwt-secret-at-least-32-characters',
      admins,
      accounts,
      adminCollections: collections,
      placeholderSources: PLACEHOLDER_PAGES.map((p) => ({
        ...p,
        list: async () =>
          ((collections[p.collection] as { rows?: Record<string, unknown>[] })?.rows ?? []).filter(
            (r) => r.isPlaceholder === true,
          ),
      })),
      submissionAdmin,
    },
  })

  const site = express()
  site.disable('x-powered-by')
  site.use((req, res, next) => {
    for (const m of matchers)
      if (m.test.test(req.path)) for (const h of m.headers) res.setHeader(h.key, h.value)
    next()
  })
  // Link-preview crawlers: the destination goes to the function, as on Vercel.
  site.use((req, _res, next) => {
    for (const rule of botRewrites) {
      const match = rule.path.exec(req.path)
      if (match && rule.agent.test(req.get('user-agent') ?? '')) {
        req.url = originalUrl(
          rule.destination.replace(/:(\w+)/g, (_, key: string) => match.groups?.[key] ?? ''),
        )
        break
      }
    }
    next()
  })
  // The API answers /api/* (its own 404s included); everything else is the site.
  site.use((req, res, next) => (req.path.startsWith('/api') ? api(req, res, next) : next()))
  // Text files gzipped, as Vercel's CDN does (it also offers brotli).
  const zipped = new Map<string, Buffer>()
  const TEXT = new Set(['.js', '.css', '.html', '.svg', '.json', '.xml', '.txt', '.webmanifest'])
  site.use((req, res, next) => {
    const file = normalize(join(dist, req.path))
    if (
      !file.startsWith(dist) ||
      !TEXT.has(extname(file)) ||
      !/\bgzip\b/.test(req.headers['accept-encoding'] ?? '') ||
      !existsSync(file) ||
      !statSync(file).isFile()
    )
      return next()
    if (!zipped.has(file)) zipped.set(file, gzipSync(readFileSync(file)))
    res.setHeader('Content-Encoding', 'gzip')
    res.setHeader('Vary', 'Accept-Encoding')
    res.type(extname(file))
    res.send(zipped.get(file))
  })
  site.use(express.static(dist, { index: false }))
  // SPA fallback, as in vercel.json: every other address gets the app.
  site.use((_req, res) => {
    res.sendFile(`${dist}/index.html`)
  })
  site.listen(E2E_PORT, () => {
    console.log(`PANS UNILAG (e2e) on http://localhost:${E2E_PORT}`)
  })
}

main().catch((error: unknown) => {
  console.error(error)
  process.exit(1)
})
