import cookieParser from 'cookie-parser'
import cors from 'cors'
import express, { type Express } from 'express'
import helmet from 'helmet'
import { docsRouter } from './docs/docs.routes.js'
import { previewFor, previewHtml, type PreviewOptions, sitePreview } from './lib/linkPreview.js'
import { type Logger, silentLogger } from './lib/logger.js'
import type { RateLimitStores } from './middleware/rateLimit.js'
import { type AuthGuard, createAuthGuard } from './middleware/requireAdmin.js'
import { createErrorHandler } from './middleware/errorHandler.js'
import { notFound } from './middleware/notFound.js'
import { requestId } from './middleware/requestId.js'
import { createRequestLogger } from './middleware/requestLogger.js'
import { healthRouter } from './modules/health/http/health.routes.js'
import type { AlbumReader } from './modules/albums/application/albumView.js'
import { albumsRouter } from './modules/albums/http/albums.routes.js'
import { mongoAlbumReader } from './modules/albums/infrastructure/album.repository.js'
import type { AnnouncementReader } from './modules/announcements/application/announcementView.js'
import { announcementsRouter } from './modules/announcements/http/announcements.routes.js'
import { mongoAnnouncementReader } from './modules/announcements/infrastructure/announcement.repository.js'
import type { DocumentReader } from './modules/documents/application/documentView.js'
import { documentsRouter } from './modules/documents/http/documents.routes.js'
import { mongoDocumentReader } from './modules/documents/infrastructure/document.repository.js'
import type { OpportunityReader } from './modules/opportunities/application/opportunityView.js'
import { opportunitiesRouter } from './modules/opportunities/http/opportunities.routes.js'
import { mongoOpportunityReader } from './modules/opportunities/infrastructure/opportunity.repository.js'
import type { PublicationReader } from './modules/publications/application/publicationView.js'
import { publicationsRouter } from './modules/publications/http/publications.routes.js'
import { mongoPublicationReader } from './modules/publications/infrastructure/publication.repository.js'
import type { ResourceReader } from './modules/resources/application/resourceView.js'
import { resourcesRouter } from './modules/resources/http/resources.routes.js'
import { mongoResourceReader } from './modules/resources/infrastructure/resource.repository.js'
import {
  ADMIN_RESOURCES,
  type AdminCollection,
  type AdminResourceName,
} from './modules/admin/application/adminResources.js'
import type { PlaceholderSource } from './modules/admin/application/placeholders.js'
import type { SubmissionAdminStore } from './modules/admin/application/submissionsAdmin.js'
import { adminRouter } from './modules/admin/http/admin.routes.js'
import { mongoAdminCollection } from './modules/admin/infrastructure/mongoAdminCollection.js'
import { mongoPlaceholderSources } from './modules/admin/infrastructure/placeholder.sources.js'
import { mongoSubmissionAdminStore } from './modules/admin/infrastructure/submissionsAdmin.store.js'
import type { MediaConfig } from './modules/media/application/mediaFolders.js'
import { mediaRouter } from './modules/media/http/media.routes.js'
import type { AdminStore } from './modules/auth/application/adminView.js'
import { authRouter } from './modules/auth/http/auth.routes.js'
import { mongoAdminStore } from './modules/auth/infrastructure/admin.store.js'
import type { CommitteeReader } from './modules/committees/application/committeeView.js'
import { committeesRouter } from './modules/committees/http/committees.routes.js'
import { mongoCommitteeReader } from './modules/committees/infrastructure/committee.repository.js'
import type { EventReader } from './modules/events/application/eventView.js'
import { eventsRouter } from './modules/events/http/events.routes.js'
import { mongoEventReader } from './modules/events/infrastructure/event.repository.js'
import type { ExecutiveReader } from './modules/executives/application/executiveView.js'
import { executivesRouter } from './modules/executives/http/executives.routes.js'
import { mongoExecutiveReader } from './modules/executives/infrastructure/executive.repository.js'
import type { GradingScaleReader } from './modules/grading/application/gradingView.js'
import { gradingRouter } from './modules/grading/http/grading.routes.js'
import { mongoGradingScaleReader } from './modules/grading/infrastructure/gradingScale.repository.js'
import type { PageReader } from './modules/pages/application/pageView.js'
import { pagesRouter } from './modules/pages/http/pages.routes.js'
import { mongoPageReader } from './modules/pages/infrastructure/page.repository.js'
import type { PatronReader } from './modules/patrons/application/patronView.js'
import { patronsRouter } from './modules/patrons/http/patrons.routes.js'
import { mongoPatronReader } from './modules/patrons/infrastructure/patron.repository.js'
import type { SubmissionStore } from './modules/submissions/application/submissionRules.js'
import {
  type FormRateLimit,
  submissionsRouter,
} from './modules/submissions/http/submissions.routes.js'
import { mongoSubmissionStore } from './modules/submissions/infrastructure/submission.store.js'
import type { SearchSource } from './modules/search/application/search.js'
import { searchRouter } from './modules/search/http/search.routes.js'
import { mongoSearchSources } from './modules/search/infrastructure/search.sources.js'
import type { SenatorReader } from './modules/senate/application/senatorView.js'
import { senateRouter } from './modules/senate/http/senate.routes.js'
import { mongoSenatorReader } from './modules/senate/infrastructure/senator.repository.js'
import type { SettingsReader } from './modules/settings/application/settingsView.js'
import { settingsRouter } from './modules/settings/http/settings.routes.js'
import { mongoSettingsReader } from './modules/settings/infrastructure/settings.repository.js'

export type AppOptions = {
  /** Browser origins allowed to call the API (CORS). */
  clientOrigins: string[]
  isProduction: boolean
  /** Serve Swagger UI at /api/docs and the spec at /api/docs/openapi.json. */
  docsEnabled?: boolean
  /** Defaults to a silent logger (tests). server.ts passes a real one. */
  logger?: Logger
  /** Log one line per request. */
  logRequests?: boolean
  /** Where each module reads its data. Defaults to MongoDB; tests pass in-memory readers. */
  readers?: Partial<Readers>
  /** The current time, for upcoming/past events, active announcements and open opportunities. Tests pass a fixed time. */
  now?: () => Date
  /** Where form submissions are written. Defaults to MongoDB; tests pass an in-memory store. */
  submissions?: SubmissionStore
  /** Per-IP limit for each form (default 5 per hour). */
  formRateLimit?: FormRateLimit
  /**
   * Shared rate-limit counters. Leave out to count in memory (tests, one long-running server);
   * production passes MongoDB so every serverless instance shares the counts.
   */
  rateLimitStores?: RateLimitStores
  /** Admin sign-in. Without it the /api/auth routes are not mounted (tests of public routes). */
  auth?: AuthOptions
  /**
   * Link previews for crawlers (lib/linkPreview.ts). The site address defaults to the first
   * client origin; production passes it with the Cloudinary cloud for cover images.
   */
  previews?: Partial<PreviewOptions>
}

export type AuthOptions = {
  /** Signs session tokens. At least 32 characters (JWT_SECRET). */
  jwtSecret: string
  /** Defaults to MongoDB; tests pass an in-memory store. */
  admins?: AdminStore
  sessionHours?: number
  loginRateLimit?: { windowMs: number; limit: number }
  /** Dashboard data. Each defaults to MongoDB; tests pass in-memory versions. */
  adminCollections?: Partial<Record<AdminResourceName, AdminCollection>>
  placeholderSources?: PlaceholderSource[]
  submissionAdmin?: SubmissionAdminStore
  /** Cloudinary credentials for signing dashboard uploads. Without them, signing returns 503. */
  media?: MediaConfig
}

export type Readers = {
  pages: PageReader
  executives: ExecutiveReader
  senate: SenatorReader
  committees: CommitteeReader
  patrons: PatronReader
  events: EventReader
  albums: AlbumReader
  announcements: AnnouncementReader
  opportunities: OpportunityReader
  publications: PublicationReader
  documents: DocumentReader
  resources: ResourceReader
  gradingScale: GradingScaleReader
  settings: SettingsReader
  search: SearchSource[]
}

const mongoReaders: Readers = {
  pages: mongoPageReader,
  executives: mongoExecutiveReader,
  senate: mongoSenatorReader,
  committees: mongoCommitteeReader,
  patrons: mongoPatronReader,
  events: mongoEventReader,
  albums: mongoAlbumReader,
  announcements: mongoAnnouncementReader,
  opportunities: mongoOpportunityReader,
  publications: mongoPublicationReader,
  documents: mongoDocumentReader,
  resources: mongoResourceReader,
  gradingScale: mongoGradingScaleReader,
  settings: mongoSettingsReader,
  search: mongoSearchSources,
}

/**
 * Builds the Express app without opening a port or connecting to the database,
 * so tests can use it directly. Feature routers are mounted under /api.
 */
export function createApp({
  clientOrigins,
  isProduction,
  docsEnabled = false,
  logger = silentLogger,
  logRequests = false,
  readers: readerOverrides,
  now = () => new Date(),
  submissions = mongoSubmissionStore,
  formRateLimit,
  rateLimitStores,
  auth,
  previews,
}: AppOptions): Express {
  const app = express()
  const readers = { ...mongoReaders, ...readerOverrides }

  app.disable('x-powered-by')
  // Behind the host's proxy (Vercel), which sets X-Forwarded-For, so rate limits see the client.
  if (isProduction) app.set('trust proxy', 1)

  app.use(requestId)
  if (logRequests) app.use(createRequestLogger(logger))
  app.use(helmet())
  app.use(
    cors({
      origin: (origin, callback) => {
        // Requests without an Origin header (curl, server-to-server, same-origin) are allowed.
        callback(null, !origin || clientOrigins.includes(origin))
      },
      credentials: true,
      exposedHeaders: ['X-Request-Id'],
    }),
  )
  app.use(express.json({ limit: '100kb' }))
  app.use(cookieParser())

  if (docsEnabled) app.use('/api/docs', docsRouter())
  app.use('/api/health', healthRouter())
  app.use('/api/pages', pagesRouter(readers.pages))
  app.use('/api/executives', executivesRouter(readers.executives))
  app.use('/api/senate', senateRouter(readers.senate))
  app.use('/api/committees', committeesRouter(readers.committees))
  app.use('/api/patrons', patronsRouter(readers.patrons))
  app.use('/api/events', eventsRouter(readers.events, now))
  app.use('/api/albums', albumsRouter(readers.albums))
  app.use('/api/announcements', announcementsRouter(readers.announcements, now))
  app.use('/api/opportunities', opportunitiesRouter(readers.opportunities, now))
  app.use('/api/publications', publicationsRouter(readers.publications))
  app.use('/api/documents', documentsRouter(readers.documents))
  app.use('/api/resources', resourcesRouter(readers.resources))
  app.use('/api/grading-scale', gradingRouter(readers.gradingScale))
  app.use('/api/settings', settingsRouter(readers.settings))
  app.use('/api/search', searchRouter(readers.search, now))
  app.use('/api', submissionsRouter(submissions, now, formRateLimit, rateLimitStores))

  // vercel.json sends link-preview crawlers here for /events/:slug and /opportunities/:slug.
  const previewOptions: PreviewOptions = {
    siteUrl: (previews?.siteUrl ?? clientOrigins[0] ?? '').replace(/\/+$/, ''),
    cloudName: previews?.cloudName,
  }
  app.get('/api/previews/:kind/:slug', async (req, res, next) => {
    const { kind, slug } = req.params
    if (kind !== 'events' && kind !== 'opportunities') return next()
    try {
      const preview = await previewFor(kind, slug, readers, previewOptions, now())
      res
        .status(preview ? 200 : 404)
        .type('html')
        // Crawlers fetch each link once; the CDN keeps it briefly so a burst of shares is cheap.
        .set('Cache-Control', 'public, max-age=0, s-maxage=300')
        .send(
          previewHtml(
            preview ?? sitePreview(`/${kind}/${encodeURIComponent(slug)}`, previewOptions),
          ),
        )
    } catch (error) {
      next(error)
    }
  })

  if (auth) {
    const admins = auth.admins ?? mongoAdminStore
    const guard: AuthGuard = createAuthGuard(admins, auth.jwtSecret, now)
    app.use(
      '/api/auth',
      authRouter({
        store: admins,
        guard,
        secret: auth.jwtSecret,
        isProduction,
        now,
        sessionHours: auth.sessionHours,
        loginRateLimit: auth.loginRateLimit,
        rateLimitStores,
      }),
    )
    const collections = Object.fromEntries(
      ADMIN_RESOURCES.map((r) => [
        r.name,
        auth.adminCollections?.[r.name] ?? mongoAdminCollection(r.model),
      ]),
    ) as Record<AdminResourceName, AdminCollection>
    app.use(
      '/api/admin/media',
      guard.requireAdmin,
      mediaRouter(auth.media, now, guard.requireRole('admin')),
    )
    app.use(
      '/api/admin',
      guard.requireAdmin,
      adminRouter({
        adminOnly: guard.requireRole('admin'),
        collections,
        placeholders: auth.placeholderSources ?? mongoPlaceholderSources,
        submissions: auth.submissionAdmin ?? mongoSubmissionAdminStore,
      }),
    )
  }

  app.use(notFound)
  app.use(createErrorHandler({ isProduction, logger }))

  return app
}
