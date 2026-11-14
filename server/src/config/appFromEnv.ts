import type { Express } from 'express'
import mongoose from 'mongoose'
import { createApp } from '../app.js'
import type { Logger } from '../lib/logger.js'
import { MongoRateLimitStore, type RateLimitCollection } from '../lib/mongoRateLimitStore.js'
import type { RateLimitStores } from '../middleware/rateLimit.js'
import { emailNotifier } from '../modules/submissions/application/notifications.js'
import { gmailSender } from '../modules/submissions/infrastructure/gmailSender.js'
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
  if (!!env.GMAIL_USER !== !!env.GMAIL_APP_PASSWORD) {
    throw new EnvError(
      '  - GMAIL_USER and GMAIL_APP_PASSWORD: set both to email the PANS inbox about new ' +
        'submissions, or leave both empty to send no emails.',
    )
  }
  const email =
    env.GMAIL_USER && env.GMAIL_APP_PASSWORD
      ? (() => {
          const to = env.NOTIFY_EMAIL.length > 0 ? env.NOTIFY_EMAIL : [env.GMAIL_USER]
          const send = gmailSender({
            user: env.GMAIL_USER,
            appPassword: env.GMAIL_APP_PASSWORD,
            to,
          })
          return { to, send }
        })()
      : undefined
  const isProduction = env.NODE_ENV === 'production'
  const docsEnabled = env.API_DOCS_ENABLED ?? !isProduction
  const app = createApp({
    clientOrigins: env.CLIENT_ORIGIN,
    isProduction,
    docsEnabled,
    logger,
    logRequests: env.NODE_ENV !== 'test',
    rateLimitStores: isProduction ? mongoRateLimitStores : undefined,
    // The dashboard links in each email point at the live site.
    notifier: email ? emailNotifier(email.send, env.CLIENT_ORIGIN[0] ?? '', logger) : undefined,
    emailTest: email,
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
