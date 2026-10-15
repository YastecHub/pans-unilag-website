import type { Model } from 'mongoose'

export type SeedTarget = {
  /** File name in server/seed/, e.g. "committees.json". */
  file: string
  // Any content model; the runner only validates documents and writes through its collection.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  model: Model<any>
  /**
   * Field(s) that identify a document across runs, e.g. ['slug'] or ['session', 'office'].
   * The schema must have a unique index on exactly these fields (checked by tests).
   */
  key: readonly string[]
}

/**
 * Every seed file and the model it fills, in the order they are written
 * (collections that others reference come first; --reset clears them in reverse).
 * Add an entry in the same PR that adds the model and its seed file (issues #9–#12).
 */
export const SEED_TARGETS: SeedTarget[] = []
