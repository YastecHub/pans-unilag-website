import { type AdminStore, type AdminView, toAdminView } from './adminView.js'
import { verifyAgainstDummy, verifyPassword } from './passwords.js'
import { verifySessionToken } from './sessionTokens.js'

/** Said to someone whose password is right but whose account hasn't been approved yet. */
export const PENDING_MESSAGE =
  'Your account is waiting for approval. You’ll be able to sign in once the web lead approves it.'

/**
 * The admin for a correct email and password, or null. Both failures look the same to the caller.
 * "pending": the password is right but the account still waits for approval.
 */
export async function signIn(
  store: AdminStore,
  email: string,
  password: string,
  now: Date,
): Promise<(AdminView & { tokenVersion: number }) | 'pending' | null> {
  const admin = await store.findByEmailWithHash(email.trim().toLowerCase())
  if (!admin) return verifyAgainstDummy(password).then(() => null)
  if (!(await verifyPassword(admin.passwordHash, password))) return null
  if (admin.pending) return 'pending'
  await store.recordLogin(admin.id, now)
  return { ...toAdminView(admin), tokenVersion: admin.tokenVersion }
}

/**
 * The admin a session cookie belongs to, or null. The admin is looked up on every request,
 * so removing an admin or resetting their password ends their sessions at once.
 */
export async function adminForSession(
  store: AdminStore,
  token: string | undefined,
  secret: string,
  now: Date,
): Promise<AdminView | null> {
  if (!token) return null
  const claims = await verifySessionToken(token, secret, now)
  if (!claims) return null
  const admin = await store.findById(claims.adminId)
  if (!admin || admin.pending || admin.tokenVersion !== claims.tokenVersion) return null
  return toAdminView(admin)
}
