import { existsSync } from 'node:fs'
import { createApp } from './app.js'
import { connectDb, disconnectDb } from './config/db.js'
import { EnvError, loadEnv } from './config/env.js'

async function main() {
  // Load server/.env in development if it exists (hosting providers set real env vars).
  if (existsSync('.env')) process.loadEnvFile('.env')

  const env = loadEnv()
  await connectDb(env.MONGODB_URI)

  const app = createApp({
    clientOrigins: env.CLIENT_ORIGIN,
    isProduction: env.NODE_ENV === 'production',
  })
  const server = app.listen(env.PORT, () => {
    console.log(`PANS UNILAG API listening on http://localhost:${env.PORT} (${env.NODE_ENV})`)
  })

  const shutdown = (signal: string) => {
    console.log(`${signal} received, shutting down…`)
    server.close(() => {
      disconnectDb().finally(() => process.exit(0))
    })
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
