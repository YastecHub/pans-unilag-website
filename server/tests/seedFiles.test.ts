import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { SEED_TARGETS } from '../src/seed/registry.js'
import { runSeed } from '../src/seed/runSeed.js'

const SEED_DIR = fileURLToPath(new URL('../seed/', import.meta.url))

/** Runs in CI: a pull request with an invalid or unregistered seed file fails here. */
describe('server/seed files', () => {
  it('are all valid for their models', async () => {
    await expect(
      runSeed({ dir: SEED_DIR, targets: SEED_TARGETS, mode: 'check', isProduction: false }),
    ).resolves.toBeDefined()
  })

  it.each(SEED_TARGETS.map((t) => [t.file, t] as const))(
    '%s has a unique index on its key',
    (_file, target) => {
      const keyFields = [...target.key].sort()
      const unique = target.model.schema.indexes().some(([fields, options]) => {
        return (
          options?.unique === true &&
          JSON.stringify(Object.keys(fields).sort()) === JSON.stringify(keyFields)
        )
      })
      const uniquePath =
        keyFields.length === 1 && target.model.schema.path(keyFields[0]!)?.options?.unique === true
      expect(unique || uniquePath).toBe(true)
    },
  )
})
