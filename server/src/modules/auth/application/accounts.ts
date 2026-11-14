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
  /** Asked for access on the request-access page and not approved yet. */
  pending: boolean
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
    pending?: boolean
  }): Promise<AccountView>
  countPending(): Promise<number>
  /** A new passwordHash also bumps tokenVersion, which signs the account out everywhere. */
  update(
    id: string,
    changes: { role?: AdminRole; passwordHash?: string; pending?: boolean },
  ): Promise<AccountView | null>
  remove(id: string): Promise<boolean>
}

/** A new password is returned once, to show the developer; only its hash is stored. */
export type WithPassword = { account: AccountView; password: string }

export const DEVELOPER_ACCOUNTS_MESSAGE =
  'Developer accounts are managed with the create-admin command, not the dashboard.'

/** More requests than this waiting at once and new ones are quietly dropped (a flood, not people). */
export const MAX_PENDING_REQUESTS = 30

export function accountService(store: AccountStore) {
  /** The account, if the dashboard may change it. */
  async function managed(id: string): Promise<AccountView> {
    const account = await store.findById(id)
    if (!account) throw HttpError.notFound('Account not found')
    if (account.role === 'developer') throw HttpError.forbidden(DEVELOPER_ACCOUNTS_MESSAGE)
    return account
  }

  return {
    /** Requests waiting for approval first; then developers, admins, editors; by name within each. */
    async list(): Promise<AccountView[]> {
      return (await store.list()).sort(
        (a, b) =>
          Number(b.pending) - Number(a.pending) ||
          ADMIN_ROLES.indexOf(a.role) - ADMIN_ROLES.indexOf(b.role) ||
          a.name.localeCompare(b.name),
      )
    },

    async create(input: { name: string; email: string; role: ManagedRole }): Promise<WithPassword> {
      if (await store.findByEmail(input.email))
        throw HttpError.conflict('There is already an account with that email.')
      const password = generatePassword()
      const account = await store.create({ ...input, passwordHash: await hashPassword(password) })
      return { account, password }
    },

    /**
     * Someone asks for access with a password of their own. The account can't sign in until a
     * developer approves it. Nothing here tells the caller whether the email already has an
     * account, so the page can't be used to find out who the admins are.
     */
    async requestAccess(input: { name: string; email: string; password: string }): Promise<void> {
      // Hash first, so the reply takes the same time whether or not anything is stored.
      const passwordHash = await hashPassword(input.password)
      if (await store.findByEmail(input.email)) return
      if ((await store.countPending()) >= MAX_PENDING_REQUESTS) return
      try {
        await store.create({
          name: input.name,
          email: input.email,
          role: 'editor',
          passwordHash,
          pending: true,
        })
      } catch (error) {
        // Two requests for one email at the same moment: the first one stands.
        if (!(error instanceof HttpError && error.status === 409)) throw error
      }
    },

    /** Lets a waiting account sign in, with the role the developer chose. */
    async approve(id: string, role: ManagedRole): Promise<AccountView> {
      const waiting = await managed(id)
      if (!waiting.pending) throw HttpError.conflict('That account is already approved.')
      const account = await store.update(id, { role, pending: false })
      if (!account) throw HttpError.notFound('Account not found')
      return account
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
