import express, { type Express } from 'express'

/**
 * Builds the Express app. Kept separate from server startup so tests can use it
 * without opening a port. Security middleware, MongoDB and feature modules are
 * added in issue #3 and later.
 */
export function createApp(): Express {
  const app = express()

  app.disable('x-powered-by')
  app.use(express.json({ limit: '100kb' }))

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' })
  })

  return app
}
