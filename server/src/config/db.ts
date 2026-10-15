import mongoose from 'mongoose'

const STATES = ['disconnected', 'connected', 'connecting', 'disconnecting'] as const
export type DbStatus = (typeof STATES)[number] | 'unknown'

/** Connects to MongoDB. Fails within ~10 s instead of hanging if the database is unreachable. */
export async function connectDb(uri: string): Promise<void> {
  mongoose.set('strictQuery', true)
  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10_000,
      maxPoolSize: 10,
    })
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error)
    throw new Error(
      `Could not connect to MongoDB (${reason}). Check MONGODB_URI, and on Atlas make sure your IP address is allowed under Network Access.`,
      { cause: error },
    )
  }
}

export async function disconnectDb(): Promise<void> {
  await mongoose.disconnect()
}

export function dbStatus(): DbStatus {
  // readyState can also be 99 (uninitialized), which maps to 'unknown'.
  const state: number = mongoose.connection.readyState
  return STATES[state] ?? 'unknown'
}
