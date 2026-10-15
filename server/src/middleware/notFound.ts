import type { RequestHandler } from 'express'
import { HttpError } from '../lib/httpError.js'

/** Unknown routes become a NOT_FOUND error, formatted by the error handler like every other error. */
export const notFound: RequestHandler = (req, _res, next) => {
  next(HttpError.notFound(`Not found: ${req.method} ${req.path}`))
}
