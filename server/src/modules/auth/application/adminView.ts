/**
 * Highest first; each role can do everything the ones after it can.
 * - developer: the web lead. Everything, plus the Accounts page (creating and removing admins).
 * - admin: everything else, including feedback and alumni sign-ups (personal data).
 * - editor: content only.
 */
export const ADMIN_ROLES = ['developer', 'admin', 'editor'] as const
export type AdminRole = (typeof ADMIN_ROLES)[number]

/** True if `role` can do what `atLeast` can (developer > admin > editor). */
export function hasRole(role: AdminRole, atLeast: AdminRole): boolean {
  return ADMIN_ROLES.indexOf(role) <= ADMIN_ROLES.indexOf(atLeast)
}

/** What the API ever says about an admin. Never includes the password hash. */
export type AdminView = {
  id: string
  name: string
  email: string
  /** See ADMIN_ROLES. */
  role: AdminRole
}

export type StoredAdmin = AdminView & {
  /** Bumped when the password is reset, which signs out every existing session. */
  tokenVersion: number
}

export type AdminStore = {
  /** Includes the hash: only the sign-in check may call this. */
  findByEmailWithHash(email: string): Promise<(StoredAdmin & { passwordHash: string }) | null>
  findById(id: string): Promise<StoredAdmin | null>
  recordLogin(id: string, at: Date): Promise<void>
}

export function toAdminView({ id, name, email, role }: AdminView): AdminView {
  return { id, name, email, role }
}
