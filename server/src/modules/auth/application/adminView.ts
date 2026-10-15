export const ADMIN_ROLES = ['admin', 'editor'] as const
export type AdminRole = (typeof ADMIN_ROLES)[number]

/** What the API ever says about an admin. Never includes the password hash. */
export type AdminView = {
  id: string
  name: string
  email: string
  /** admin: everything, including managing other admins. editor: content only. */
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
