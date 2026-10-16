import { HttpError } from '../src/lib/httpError.js'
import type { AccountStore, AccountView } from '../src/modules/auth/application/accounts.js'
import type { AdminStore, StoredAdmin } from '../src/modules/auth/application/adminView.js'

export type AccountRow = StoredAdmin & { passwordHash: string; lastLoginAt?: Date; createdAt: Date }

/**
 * Dashboard accounts in memory: the sign-in store and the Accounts page's store over the same
 * rows, as MongoDB's admins collection is for both. Used by the tests and the e2e server.
 */
export function memoryAccounts(rows: AccountRow[]): {
  rows: AccountRow[]
  admins: AdminStore
  accounts: AccountStore
} {
  let nextId = rows.length + 1
  const view = (r: AccountRow): AccountView => ({
    id: r.id,
    name: r.name,
    email: r.email,
    role: r.role,
    lastLoginAt: r.lastLoginAt?.toISOString() ?? null,
    createdAt: r.createdAt.toISOString(),
  })
  const stored = ({ id, name, email, role, tokenVersion }: AccountRow): StoredAdmin => ({
    id,
    name,
    email,
    role,
    tokenVersion,
  })
  const byId = (id: string) => rows.find((r) => r.id === id)

  return {
    rows,
    admins: {
      findByEmailWithHash: async (email) => {
        const row = rows.find((r) => r.email === email)
        return row ? { ...stored(row), passwordHash: row.passwordHash } : null
      },
      findById: async (id) => {
        const row = byId(id)
        return row ? stored(row) : null
      },
      recordLogin: async (id, at) => {
        const row = byId(id)
        if (row) row.lastLoginAt = at
      },
    },
    accounts: {
      list: async () => rows.map(view),
      findById: async (id) => {
        const row = byId(id)
        return row ? view(row) : null
      },
      findByEmail: async (email) => {
        const row = rows.find((r) => r.email === email)
        return row ? view(row) : null
      },
      create: async (input) => {
        if (rows.some((r) => r.email === input.email))
          throw HttpError.conflict('There is already an account with that email.')
        const row: AccountRow = {
          ...input,
          id: `acc${nextId++}`,
          tokenVersion: 0,
          createdAt: new Date(),
        }
        rows.push(row)
        return view(row)
      },
      update: async (id, { role, passwordHash }) => {
        const row = byId(id)
        if (!row) return null
        if (role) row.role = role
        if (passwordHash) {
          row.passwordHash = passwordHash
          row.tokenVersion += 1
        }
        return view(row)
      },
      remove: async (id) => {
        const index = rows.findIndex((r) => r.id === id)
        if (index < 0) return false
        rows.splice(index, 1)
        return true
      },
    },
  }
}
