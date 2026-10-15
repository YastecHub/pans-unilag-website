/**
 * Machine-readable error codes. The client switches on `error.code`, never on the message,
 * so messages can be reworded freely. Add a code here (and to the README table) when you need one.
 */
export const ERROR_CODES = [
  'BAD_REQUEST',
  'VALIDATION_ERROR',
  'INVALID_JSON',
  'INVALID_ID',
  'UNAUTHORIZED',
  'FORBIDDEN',
  'NOT_FOUND',
  'CONFLICT',
  'PAYLOAD_TOO_LARGE',
  'RATE_LIMITED',
  'INTERNAL_ERROR',
] as const

export type ErrorCode = (typeof ERROR_CODES)[number]

/** One problem with a request field, as returned in `error.details` for validation errors. */
export type FieldIssue = {
  location?: 'params' | 'query' | 'body'
  path: string
  message: string
}

/**
 * An error that is safe to show to the client. Throw it from routes or services;
 * the error handler turns it into `{ error: { code, message, details?, requestId } }`.
 *
 * @example throw HttpError.notFound('Event not found')
 */
export class HttpError extends Error {
  readonly status: number
  readonly code: ErrorCode
  readonly details?: unknown

  constructor(status: number, code: ErrorCode, message: string, details?: unknown) {
    super(message)
    this.name = 'HttpError'
    this.status = status
    this.code = code
    this.details = details
  }

  static badRequest(message = 'Bad request', details?: unknown) {
    return new HttpError(400, 'BAD_REQUEST', message, details)
  }

  static validation(details: FieldIssue[], message = 'Invalid request') {
    return new HttpError(400, 'VALIDATION_ERROR', message, details)
  }

  static unauthorized(message = 'You need to sign in to do that') {
    return new HttpError(401, 'UNAUTHORIZED', message)
  }

  static forbidden(message = 'You do not have permission to do that') {
    return new HttpError(403, 'FORBIDDEN', message)
  }

  static notFound(message = 'Not found') {
    return new HttpError(404, 'NOT_FOUND', message)
  }

  static conflict(message = 'That conflicts with an existing record', details?: unknown) {
    return new HttpError(409, 'CONFLICT', message, details)
  }

  static tooManyRequests(message = 'Too many requests. Please try again later.') {
    return new HttpError(429, 'RATE_LIMITED', message)
  }
}
