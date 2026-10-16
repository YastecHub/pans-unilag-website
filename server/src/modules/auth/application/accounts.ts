import { HttpError } from '../../../lib/httpError.js'
import { type AdminRole, type AdminView, ADMIN_ROLES } from './adminView.js'
import { generatePassword, hashPassword } from './passwords.js'

/**
 * Dashboard accounts, managed by the developer role on the Accounts page (/admin/accounts).
 *
 * The page manages admins and editors only. Developer accounts are created, reset and removed
 * with `npm run create-admin` (which needs the database connection string), so a developer can't
 * lock themselves or the other developers out from the browser, and a stolen dashboard session
 * can't create more developers.
 */
export const MANAGED_ROLES = ['admin', 'editor'] as const
export type ManagedRole = (typeof MANAGED_ROLES)[number]

export type AccountView = AdminView & {
  lastLoginAt: string | null
  createdAt: string | null
}

export type AccountStore = {
  list(): Promise<AccountView[]>
  findById(id: string): Promise<AccountView | null>
  findByEmail(email: string): Promise<AccountView | null>
  /** Throws HttpError.conflict if the email is taken (including a race with another request). */
  create(input: {
    name: string
    email: string
    role: AdminRole
    passwordHash: string
  }): Promise<AccountView>
  /** A new passwordHash also bumps tokenVersion, which signs the account out everywhere. */
  update(
    id: string,
    changes: { role?: AdminRole; passwordHash?: string },
  ): Promise<AccountView | null>
  remove(id: string): Promise<boolean>
}

/** A new password is returned once, to show the developer; only its hash is stored. */
export type WithPassword = { account: AccountView; password: string }

export const DEVELOPER_ACCOUNTS_MESSAGE =
  'Developer accounts are managed with the create-admin command, not the dashboard.'

export function accountService(store: AccountStore) {
  /** The account, if the dashboard may change it. */
  async function managed(id: string): Promise<AccountView> {
    const account = await store.findById(id)
    if (!account) throw HttpError.notFound('Account not found')
    if (account.role === 'developer') throw HttpError.forbidden(DEVELOPER_ACCOUNTS_MESSAGE)
    return account
  }

  return {
    /** Developers first, then admins, then editors; by name within each. */
    async list(): Promise<AccountView[]> {
      return (await store.list()).sort(
        (a, b) =>
          ADMIN_ROLES.indexOf(a.role) - ADMIN_ROLES.indexOf(b.role) || a.name.localeCompare(b.name),
      )
    },

    async create(input: { name: string; email: string; role: ManagedRole }): Promise<WithPassword> {
      if (await store.findByEmail(input.email))
        throw HttpError.conflict('There is already an account with that email.')
      const password = generatePassword()
      const account = await store.create({ ...input, passwordHash: await hashPassword(password) })
      return { account, password }
    },

    async resetPassword(id: string): Promise<WithPassword> {
      await managed(id)
      const password = generatePassword()
      const account = await store.update(id, { passwordHash: await hashPassword(password) })
      if (!account) throw HttpError.notFound('Account not found')
      return { account, password }
    },

    async setRole(id: string, role: ManagedRole): Promise<AccountView> {
      await managed(id)
      const account = await store.update(id, { role })
      if (!account) throw HttpError.notFound('Account not found')
      return account
    },

    async remove(id: string): Promise<AccountView> {
      const account = await managed(id)
      if (!(await store.remove(id))) throw HttpError.notFound('Account not found')
      return account
    },
  }
}

export type AccountService = ReturnType<typeof accountService>
