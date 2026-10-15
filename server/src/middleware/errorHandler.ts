import type { ErrorRequestHandler } from 'express'
import { HttpError } from '../lib/httpError.js'

type Options = { isProduction: boolean; log?: (error: unknown) => void }

/**
 * Last middleware: turns any error into a JSON response.
 * Never exposes stack traces or internal messages in production.
 */
export function createErrorHandler({
  isProduction,
  log = console.error,
}: Options): ErrorRequestHandler {
  return (error, _req, res, next) => {
    if (res.headersSent) {
      next(error)
      return
    }

    if (error instanceof HttpError) {
      res.status(error.status).json({ error: { message: error.message, details: error.details } })
      return
    }

    // Errors from express.json(): invalid JSON or a body over the size limit
    const status = typeof error?.status === 'number' ? error.status : undefined
    if (error?.type === 'entity.parse.failed') {
      res.status(400).json({ error: { message: 'Request body is not valid JSON' } })
      return
    }
    if (error?.type === 'entity.too.large') {
      res.status(413).json({ error: { message: 'Request body is too large' } })
      return
    }
    if (status && status >= 400 && status < 500) {
      res.status(status).json({ error: { message: error.message } })
      return
    }

    log(error)
    res.status(500).json({
      error: {
        message: 'Something went wrong. Please try again.',
        ...(isProduction ? {} : { debug: String(error?.stack ?? error) }),
      },
    })
  }
}
