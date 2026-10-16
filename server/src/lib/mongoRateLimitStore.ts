import type { ClientRateLimitInfo, Options, Store } from 'express-rate-limit'

/** One counter per limiter and client: hits in the current window, and when the window ends. */
export type RateLimitDoc = { _id: string; hits: number; resetAt: Date }

/** The few MongoDB collection methods the store uses (the driver's Collection has them all). */
export type RateLimitCollection = {
  findOne(filter: object): Promise<RateLimitDoc | null>
  findOneAndUpdate(
    filter: object,
    update: object,
    options: { upsert?: boolean; returnDocument: 'after' },
  ): Promise<RateLimitDoc | null>
  updateOne(filter: object, update: object): Promise<unknown>
  deleteOne(filter: object): Promise<unknown>
  createIndex(spec: object, options: object): Promise<unknown>
}

const isDuplicateKey = (error: unknown) =>
  typeof error === 'object' && error !== null && (error as { code?: unknown }).code === 11000

/**
 * Rate-limit counters in MongoDB, shared by every copy of the API. On a serverless host (Vercel)
 * each request may run in a different instance, so counters kept in memory would let a client
 * multiply its allowance; here they live in one place. MongoDB deletes each counter once its
 * window has ended (TTL index on resetAt).
 */
export class MongoRateLimitStore implements Store {
  /** Keys are global, not per process. */
  localKeys = false
  prefix: string
  private windowMs = 60_000
  private indexed: Promise<unknown> | undefined

  constructor(
    private readonly collection: () => RateLimitCollection,
    /** Keeps limiters apart, e.g. "login" or "feedback". */
    name: string,
    private readonly now: () => Date = () => new Date(),
  ) {
    this.prefix = `${name}:`
  }

  init(options: Options): void {
    this.windowMs = options.windowMs
  }

  private key(key: string) {
    return `${this.prefix}${key}`
  }

  /** Creates the clean-up index once per process; failures are retried on the next request. */
  private ensureIndex() {
    this.indexed ??= this.collection()
      .createIndex({ resetAt: 1 }, { expireAfterSeconds: 0, name: 'expire_at_reset' })
      .catch(() => {
        this.indexed = undefined
      })
    return this.indexed
  }

  async get(key: string): Promise<ClientRateLimitInfo | undefined> {
    const doc = await this.collection().findOne({
      _id: this.key(key),
      resetAt: { $gt: this.now() },
    })
    return doc ? { totalHits: doc.hits, resetTime: doc.resetAt } : undefined
  }

  async increment(key: string): Promise<ClientRateLimitInfo> {
    void this.ensureIndex()
    const id = this.key(key)
    for (let attempt = 0; attempt < 3; attempt++) {
      const now = this.now()
      // Most requests: another hit in a window that's still open.
      const open = await this.collection().findOneAndUpdate(
        { _id: id, resetAt: { $gt: now } },
        { $inc: { hits: 1 } },
        { returnDocument: 'after' },
      )
      if (open) return { totalHits: open.hits, resetTime: open.resetAt }
      // No open window: start one. If another request started it a moment ago, the upsert hits
      // the unique _id and we go round again to count this request in that window.
      try {
        const started = await this.collection().findOneAndUpdate(
          { _id: id, resetAt: { $lte: now } },
          { $set: { hits: 1, resetAt: new Date(now.getTime() + this.windowMs) } },
          { upsert: true, returnDocument: 'after' },
        )
        if (started) return { totalHits: started.hits, resetTime: started.resetAt }
      } catch (error) {
        if (!isDuplicateKey(error)) throw error
      }
    }
    throw new Error('Could not update the rate-limit counter')
  }

  async decrement(key: string): Promise<void> {
    await this.collection().updateOne(
      { _id: this.key(key), resetAt: { $gt: this.now() }, hits: { $gt: 0 } },
      { $inc: { hits: -1 } },
    )
  }

  async resetKey(key: string): Promise<void> {
    await this.collection().deleteOne({ _id: this.key(key) })
  }
}
