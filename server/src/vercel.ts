import type { IncomingMessage, ServerResponse } from 'node:http'
import type { Express } from 'express'
import { appFromEnv } from './config/appFromEnv.js'
import { connectDb } from './config/db.js'
import { type Env, EnvError, loadEnv } from './config/env.js'
import { createLogger, type Logger } from './lib/logger.js'

type Handler = (req: IncomingMessage, res: ServerResponse) => Promise<void>

/**
 * The address the visitor asked for. vercel.json rewrites /api/* to this one function; the
 * function normally sees the original path, but if the rewrite arrives as "/api?path=events&…"
 * it's turned back into "/api/events?…" so Express's routes match.
 */
export function originalUrl(url = '/'): string {
  if (!/^\/api\/?\?/.test(url)) return url
  const query = new URLSearchParams(url.slice(url.indexOf('?') + 1))
  const path = query.get('path')
  if (path === null) return url
  query.delete('path')
  const rest = query.toString()
  return `/api/${path.replace(/^\/+/, '')}${rest ? `?${rest}` : ''}`
}

export type VercelDeps = {
  env: () => Env
  connect: (uri: string) => Promise<void>
  logger: Logger
}

/**
 * The API as a Vercel function (api/index.js at the repository root). Each instance builds the
 * app and connects to MongoDB once, on its first request, then reuses both while it stays warm.
 * If start-up fails (a missing variable, the database unreachable) the request gets a 503 and the
 * next request tries again, instead of the instance being stuck broken.
 */
export function createVercelHandler({ env, connect, logger }: VercelDeps): Handler {
  let ready: Promise<Express> | undefined

  const start = async () => {
    const config = env()
    const { app } = appFromEnv(config, logger)
    await connect(config.MONGODB_URI)
    return app
  }

  return async (req, res) => {
    ready ??= start()
    let app: Express
    try {
      app = await ready
    } catch (error) {
      ready = undefined
      logger.error('The API failed to start', {
        error: error instanceof EnvError ? error.message : error,
      })
      res.statusCode = 503
      res.setHeader('Content-Type', 'application/json')
      res.setHeader('Retry-After', '10')
      res.setHeader('Cache-Control', 'no-store')
      res.end(
        JSON.stringify({
          error: {
            code: 'SERVICE_UNAVAILABLE',
            message:
              'The site is starting up or temporarily unavailable. Please try again shortly.',
            requestId: '',
          },
        }),
      )
      return
    }
    req.url = originalUrl(req.url)
    app(req as Parameters<Express>[0], res as Parameters<Express>[1])
  }
}

export default createVercelHandler({
  env: () => loadEnv(),
  connect: connectDb,
  logger: createLogger({ json: true }),
})
