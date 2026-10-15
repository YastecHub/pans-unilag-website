import type { RequestHandler } from 'express'
import type { Logger } from '../lib/logger.js'

/**
 * Logs one line per request when the response finishes: method, path (no query string,
 * which can carry personal data), status, duration and request id.
 */
export function createRequestLogger(logger: Logger): RequestHandler {
  return (req, res, next) => {
    const started = process.hrtime.bigint()
    res.on('finish', () => {
      const durationMs = Number(process.hrtime.bigint() - started) / 1e6
      const level = res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info'
      logger[level]('request', {
        requestId: req.id,
        method: req.method,
        path: req.originalUrl.split('?')[0],
        status: res.statusCode,
        durationMs: Math.round(durationMs),
      })
    })
    next()
  }
}
