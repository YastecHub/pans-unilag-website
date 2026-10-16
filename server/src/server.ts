import { existsSync } from 'node:fs'
import { appFromEnv } from './config/appFromEnv.js'
import { connectDb, disconnectDb } from './config/db.js'
import { EnvError, loadEnv } from './config/env.js'
import { createLogger, type Logger } from './lib/logger.js'

let logger: Logger = createLogger({ json: process.env.NODE_ENV === 'production' })

// A bug that escapes every handler leaves the process in an unknown state: log it and exit,
// so the host restarts a clean process instead of serving half-broken requests.
process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled promise rejection, exiting', { error: reason })
  process.exit(1)
})
process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception, exiting', { error })
  process.exit(1)
})

async function main() {
  // Load server/.env in development if it exists (hosting providers set real env vars).
  if (existsSync('.env')) process.loadEnvFile('.env')

  const env = loadEnv()
  logger = createLogger({ json: env.NODE_ENV === 'production' })
  // Throws EnvError without JWT_SECRET, before connecting.
  const { app, docsEnabled } = appFromEnv(env, logger)

  await connectDb(env.MONGODB_URI)

  const server = app.listen(env.PORT, () => {
    logger.info(`PANS UNILAG API listening on http://localhost:${env.PORT} (${env.NODE_ENV})`)
    if (docsEnabled) logger.info(`API docs at http://localhost:${env.PORT}/api/docs`)
  })

  const shutdown = (signal: string) => {
    logger.info(`${signal} received, shutting down…`)
    server.close(() => {
      disconnectDb().finally(() => process.exit(0))
    })
    // Don't hang forever on open connections.
    setTimeout(() => process.exit(1), 10_000).unref()
  }
  process.on('SIGTERM', () => shutdown('SIGTERM'))
  process.on('SIGINT', () => shutdown('SIGINT'))
}

main().catch((error: unknown) => {
  if (error instanceof EnvError) {
    console.error(`\n${error.message}\n`)
  } else {
    console.error(
      '\nThe API failed to start:',
      error instanceof Error ? error.message : error,
      '\n',
    )
  }
  process.exit(1)
})
