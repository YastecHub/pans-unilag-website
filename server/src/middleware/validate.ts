import type { RequestHandler } from 'express'
import type { z } from 'zod'
import { type FieldIssue, HttpError } from '../lib/httpError.js'

type Schemas = {
  body?: z.ZodType
  query?: z.ZodType
  params?: z.ZodType
}

/**
 * Validates request body, query and params with Zod and replaces them with the parsed values.
 * Use z.strictObject(...) in schemas so unknown fields are rejected.
 *
 * @example router.post('/feedback', validate({ body: feedbackSchema }), controller)
 */
export function validate(schemas: Schemas): RequestHandler {
  return (req, _res, next) => {
    const issues: FieldIssue[] = []

    for (const location of ['params', 'query', 'body'] as const) {
      const schema = schemas[location]
      if (!schema) continue
      const result = schema.safeParse(req[location])
      if (!result.success) {
        for (const issue of result.error.issues) {
          issues.push({ location, path: issue.path.join('.'), message: issue.message })
        }
        continue
      }
      // req.query is a getter in Express 5, so redefine it rather than assigning.
      Object.defineProperty(req, location, {
        value: result.data,
        writable: true,
        configurable: true,
      })
    }

    if (issues.length > 0) {
      next(HttpError.validation(issues))
      return
    }
    next()
  }
}
