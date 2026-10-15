import cookieParser from 'cookie-parser'
import cors from 'cors'
import express, { type Express } from 'express'
import helmet from 'helmet'
import { docsRouter } from './docs/docs.routes.js'
import { type Logger, silentLogger } from './lib/logger.js'
import { createErrorHandler } from './middleware/errorHandler.js'
import { notFound } from './middleware/notFound.js'
import { requestId } from './middleware/requestId.js'
import { createRequestLogger } from './middleware/requestLogger.js'
import { healthRouter } from './modules/health/http/health.routes.js'
import type { AlbumReader } from './modules/albums/application/albumView.js'
import { albumsRouter } from './modules/albums/http/albums.routes.js'
import { mongoAlbumReader } from './modules/albums/infrastructure/album.repository.js'
import type { CommitteeReader } from './modules/committees/application/committeeView.js'
import { committeesRouter } from './modules/committees/http/committees.routes.js'
import { mongoCommitteeReader } from './modules/committees/infrastructure/committee.repository.js'
import type { EventReader } from './modules/events/application/eventView.js'
import { eventsRouter } from './modules/events/http/events.routes.js'
import { mongoEventReader } from './modules/events/infrastructure/event.repository.js'
import type { ExecutiveReader } from './modules/executives/application/executiveView.js'
import { executivesRouter } from './modules/executives/http/executives.routes.js'
import { mongoExecutiveReader } from './modules/executives/infrastructure/executive.repository.js'
import type { PageReader } from './modules/pages/application/pageView.js'
import { pagesRouter } from './modules/pages/http/pages.routes.js'
import { mongoPageReader } from './modules/pages/infrastructure/page.repository.js'
import type { PatronReader } from './modules/patrons/application/patronView.js'
import { patronsRouter } from './modules/patrons/http/patrons.routes.js'
import { mongoPatronReader } from './modules/patrons/infrastructure/patron.repository.js'
import type { SenatorReader } from './modules/senate/application/senatorView.js'
import { senateRouter } from './modules/senate/http/senate.routes.js'
import { mongoSenatorReader } from './modules/senate/infrastructure/senator.repository.js'

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
  /** The current time, for upcoming/past events. Tests pass a fixed time. */
  now?: () => Date
}

export type Readers = {
  pages: PageReader
  executives: ExecutiveReader
  senate: SenatorReader
  committees: CommitteeReader
  patrons: PatronReader
  events: EventReader
  albums: AlbumReader
}

const mongoReaders: Readers = {
  pages: mongoPageReader,
  executives: mongoExecutiveReader,
  senate: mongoSenatorReader,
  committees: mongoCommitteeReader,
  patrons: mongoPatronReader,
  events: mongoEventReader,
  albums: mongoAlbumReader,
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
}: AppOptions): Express {
  const app = express()
  const readers = { ...mongoReaders, ...readerOverrides }

  app.disable('x-powered-by')
  // Behind one proxy on the host (e.g. Render), so rate limits see the real client IP.
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

  app.use(notFound)
  app.use(createErrorHandler({ isProduction, logger }))

  return app
}
