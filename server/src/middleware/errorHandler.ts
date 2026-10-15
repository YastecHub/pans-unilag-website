import type { ErrorRequestHandler } from 'express'
import mongoose from 'mongoose'
import { z } from 'zod'
import { type ErrorCode, HttpError } from '../lib/httpError.js'
import type { Logger } from '../lib/logger.js'

type Options = {
  isProduction: boolean
  logger: Pick<Logger, 'error'>
}

/** The JSON body of every error response. Documented as `ErrorResponse` in the OpenAPI spec. */
export type ErrorBody = {
  error: {
    code: ErrorCode
    message: string
    details?: unknown
    requestId?: string
    /** Stack trace, outside production only. */
    debug?: string
  }
}

const CODE_FOR_STATUS: Record<number, ErrorCode> = {
  400: 'BAD_REQUEST',
  401: 'UNAUTHORIZED',
  403: 'FORBIDDEN',
  404: 'NOT_FOUND',
  409: 'CONFLICT',
  413: 'PAYLOAD_TOO_LARGE',
  429: 'RATE_LIMITED',
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

/**
 * Turns known error types into an HttpError. Returns undefined for anything unexpected,
 * which becomes a 500 with no internal details.
 */
export function toHttpError(error: unknown): HttpError | undefined {
  if (error instanceof HttpError) return error

  // A Zod schema parsed outside validate(), e.g. schema.parse(...) in a service
  if (error instanceof z.ZodError) {
    return HttpError.validation(
      error.issues.map((issue) => ({ path: issue.path.join('.'), message: issue.message })),
    )
  }

  // Mongoose: a malformed ObjectId (e.g. GET /api/admin/events/not-an-id)
  if (error instanceof mongoose.Error.CastError) {
    return new HttpError(400, 'INVALID_ID', `Invalid value for ${error.path}`, {
      path: error.path,
    })
  }

  // Mongoose: schema validation failed when saving
  if (error instanceof mongoose.Error.ValidationError) {
    return HttpError.validation(
      Object.values(error.errors).map((issue) => ({ path: issue.path, message: issue.message })),
    )
  }

  if (!isObject(error)) return undefined

  // MongoDB: unique index violated. Report the field names, never the values (they may be emails).
  if (error.code === 11000) {
    const fields = isObject(error.keyValue) ? Object.keys(error.keyValue) : []
    const message =
      fields.length > 0
        ? `A record with that ${fields.join(', ')} already exists`
        : 'That record already exists'
    return HttpError.conflict(message, { fields })
  }

  // express.json(): invalid JSON or a body over the size limit
  if (error.type === 'entity.parse.failed') {
    return new HttpError(400, 'INVALID_JSON', 'Request body is not valid JSON')
  }
  if (error.type === 'entity.too.large') {
    return new HttpError(413, 'PAYLOAD_TOO_LARGE', 'Request body is too large')
  }

  // Other 4xx errors from Express or middleware (http-errors). Only show the message if it is meant to be shown.
  const status = typeof error.status === 'number' ? error.status : undefined
  if (status && status >= 400 && status < 500) {
    const message =
      error.expose === true && typeof error.message === 'string' ? error.message : 'Bad request'
    return new HttpError(status, CODE_FOR_STATUS[status] ?? 'BAD_REQUEST', message)
  }

  return undefined
}

/**
 * Last middleware: turns any error into `{ error: { code, message, details?, requestId } }`.
 * Unexpected errors are logged with the request id and returned as a generic 500;
 * stack traces are included only outside production.
 */
export function createErrorHandler({ isProduction, logger }: Options): ErrorRequestHandler {
  return (error, req, res, next) => {
    if (res.headersSent) {
      next(error)
      return
    }

    const known = toHttpError(error)
    const status = known?.status ?? 500

    if (status >= 500) {
      logger.error('Unhandled error', {
        requestId: req.id,
        method: req.method,
        path: req.originalUrl.split('?')[0],
        error,
      })
    }

    const body: ErrorBody = {
      error: {
        code: known?.code ?? 'INTERNAL_ERROR',
        message: known && status < 500 ? known.message : 'Something went wrong. Please try again.',
        ...(known?.details !== undefined ? { details: known.details } : {}),
        ...(req.id ? { requestId: req.id } : {}),
        ...(!isProduction && status >= 500
          ? { debug: error instanceof Error ? (error.stack ?? error.message) : String(error) }
          : {}),
      },
    }
    res.status(status).json(body)
  }
}
