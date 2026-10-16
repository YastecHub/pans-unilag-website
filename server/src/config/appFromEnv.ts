import type { Express } from 'express'
import mongoose from 'mongoose'
import { createApp } from '../app.js'
import type { Logger } from '../lib/logger.js'
import { MongoRateLimitStore, type RateLimitCollection } from '../lib/mongoRateLimitStore.js'
import type { RateLimitStores } from '../middleware/rateLimit.js'
import { type Env, EnvError } from './env.js'

/** Rate-limit counters in the "ratelimits" collection, shared by every instance of the API. */
export const mongoRateLimitStores: RateLimitStores = (name) =>
  new MongoRateLimitStore(
    () => mongoose.connection.collection('ratelimits') as unknown as RateLimitCollection,
    name,
  )

/**
 * The app as production runs it, from validated environment variables. Shared by server.ts (a
 * long-running process) and vercel.ts (a serverless function), so both behave the same.
 */
export function appFromEnv(env: Env, logger: Logger): { app: Express; docsEnabled: boolean } {
  if (!env.JWT_SECRET) {
    throw new EnvError(
      '  - JWT_SECRET: required to sign admin sessions. Generate one with:\n' +
        "      node -e \"console.log(require('crypto').randomBytes(48).toString('base64url'))\"",
    )
  }
  const isProduction = env.NODE_ENV === 'production'
  const docsEnabled = env.API_DOCS_ENABLED ?? !isProduction
  const app = createApp({
    clientOrigins: env.CLIENT_ORIGIN,
    isProduction,
    docsEnabled,
    logger,
    logRequests: env.NODE_ENV !== 'test',
    rateLimitStores: isProduction ? mongoRateLimitStores : undefined,
    // Link previews name the site by its first allowed origin and show Cloudinary covers.
    previews: { cloudName: env.CLOUDINARY_CLOUD_NAME },
    auth: {
      jwtSecret: env.JWT_SECRET,
      media:
        env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET
          ? {
              cloudName: env.CLOUDINARY_CLOUD_NAME,
              apiKey: env.CLOUDINARY_API_KEY,
              apiSecret: env.CLOUDINARY_API_SECRET,
            }
          : undefined,
    },
  })
  return { app, docsEnabled }
}
