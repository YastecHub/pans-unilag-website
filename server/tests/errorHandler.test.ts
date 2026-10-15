import express from 'express'
import mongoose from 'mongoose'
import request from 'supertest'
import { describe, expect, it, vi } from 'vitest'
import { z } from 'zod'
import { HttpError } from '../src/lib/httpError.js'
import { silentLogger } from '../src/lib/logger.js'
import { createErrorHandler } from '../src/middleware/errorHandler.js'
import { requestId } from '../src/middleware/requestId.js'

function appThatThrows(
  error: unknown,
  {
    isProduction = true,
    logger = silentLogger,
  }: { isProduction?: boolean; logger?: typeof silentLogger } = {},
) {
  const app = express()
  app.use(requestId)
  app.get('/boom', async () => {
    throw error
  })
  app.use(createErrorHandler({ isProduction, logger }))
  return app
}

describe('error handler', () => {
  it('uses the status, code and message of an HttpError, with the request id', async () => {
    const res = await request(appThatThrows(HttpError.forbidden())).get('/boom')

    expect(res.status).toBe(403)
    expect(res.body).toEqual({
      error: {
        code: 'FORBIDDEN',
        message: 'You do not have permission to do that',
        requestId: res.headers['x-request-id'],
      },
    })
  })

  it('includes details when the error has them', async () => {
    const res = await request(
      appThatThrows(
        HttpError.validation([{ location: 'body', path: 'email', message: 'Required' }]),
      ),
    ).get('/boom')

    expect(res.status).toBe(400)
    expect(res.body.error.code).toBe('VALIDATION_ERROR')
    expect(res.body.error.details).toEqual([
      { location: 'body', path: 'email', message: 'Required' },
    ])
  })

  it('hides internal details in production and logs them with the request id', async () => {
    const logger = { ...silentLogger, error: vi.fn() }
    const res = await request(appThatThrows(new Error('db password is hunter2'), { logger })).get(
      '/boom',
    )

    expect(res.status).toBe(500)
    expect(res.body.error).toMatchObject({
      code: 'INTERNAL_ERROR',
      message: 'Something went wrong. Please try again.',
    })
    expect(JSON.stringify(res.body)).not.toMatch(/hunter2/)
    expect(logger.error).toHaveBeenCalledWith(
      'Unhandled error',
      expect.objectContaining({ requestId: res.headers['x-request-id'], path: '/boom' }),
    )
  })

  it('includes a stack trace outside production', async () => {
    const res = await request(appThatThrows(new Error('kaboom'), { isProduction: false })).get(
      '/boom',
    )

    expect(res.status).toBe(500)
    expect(res.body.error.debug).toMatch(/kaboom/)
  })

  it('maps a thrown ZodError to VALIDATION_ERROR', async () => {
    const result = z.object({ name: z.string() }).safeParse({})
    const res = await request(appThatThrows(result.error)).get('/boom')

    expect(res.status).toBe(400)
    expect(res.body.error.code).toBe('VALIDATION_ERROR')
    expect(res.body.error.details[0].path).toBe('name')
  })
})

describe('error handler: MongoDB and Mongoose errors', () => {
  it('maps a CastError (bad ObjectId) to INVALID_ID', async () => {
    const error = new mongoose.Error.CastError('ObjectId', 'not-an-id', '_id')
    const res = await request(appThatThrows(error)).get('/boom')

    expect(res.status).toBe(400)
    expect(res.body.error).toMatchObject({ code: 'INVALID_ID', details: { path: '_id' } })
  })

  it('maps a ValidationError to VALIDATION_ERROR with the failing fields', async () => {
    const Model =
      mongoose.models.ErrorHandlerTest ??
      mongoose.model(
        'ErrorHandlerTest',
        new mongoose.Schema({ title: { type: String, required: true } }),
      )
    const error = await new Model({})
      .validate()
      .catch((validationError: unknown) => validationError)
    const res = await request(appThatThrows(error)).get('/boom')

    expect(res.status).toBe(400)
    expect(res.body.error.code).toBe('VALIDATION_ERROR')
    expect(res.body.error.details).toEqual([
      { path: 'title', message: 'Path `title` is required.' },
    ])
  })

  it('maps a duplicate key error to CONFLICT without leaking the value', async () => {
    const error = Object.assign(new Error('E11000 duplicate key error'), {
      code: 11000,
      keyValue: { email: 'someone@example.com' },
    })
    const res = await request(appThatThrows(error)).get('/boom')

    expect(res.status).toBe(409)
    expect(res.body.error).toMatchObject({
      code: 'CONFLICT',
      message: 'A record with that email already exists',
      details: { fields: ['email'] },
    })
    expect(JSON.stringify(res.body)).not.toMatch(/someone@example\.com/)
  })
})
