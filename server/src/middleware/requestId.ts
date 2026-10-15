import { randomUUID } from 'node:crypto'
import type { RequestHandler } from 'express'

declare module 'express-serve-static-core' {
  interface Request {
    /** Unique id for this request; set by the requestId middleware. */
    id?: string
  }
}

export const REQUEST_ID_HEADER = 'X-Request-Id'
const SAFE_ID = /^[\w.-]{1,128}$/

/**
 * Gives every request an id (reusing a safe incoming X-Request-Id, e.g. from the host's proxy)
 * and echoes it in the response. Errors include it, so a user can quote it and we can find the log line.
 */
export const requestId: RequestHandler = (req, res, next) => {
  const incoming = req.get(REQUEST_ID_HEADER)
  req.id = incoming && SAFE_ID.test(incoming) ? incoming : randomUUID()
  res.setHeader(REQUEST_ID_HEADER, req.id)
  next()
}
