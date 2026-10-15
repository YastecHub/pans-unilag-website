import { randomBytes } from 'node:crypto'
import argon2 from 'argon2'

/** argon2id with the library defaults (64 MiB memory, 3 passes), the OWASP-recommended setting. */
export function hashPassword(password: string): Promise<string> {
  return argon2.hash(password, { type: argon2.argon2id })
}

export async function verifyPassword(hash: string, password: string): Promise<boolean> {
  try {
    return await argon2.verify(hash, password)
  } catch {
    return false // a malformed hash never signs anyone in
  }
}

/**
 * Checked when the email is unknown, so a wrong email takes as long as a wrong password
 * and response times don't reveal which admin emails exist.
 */
let dummyHash: Promise<string> | undefined
export async function verifyAgainstDummy(password: string): Promise<false> {
  dummyHash ??= hashPassword(randomBytes(16).toString('hex'))
  await verifyPassword(await dummyHash, password)
  return false
}

/** A random 24-character password for new admins (scripts/create-admin.ts). */
export function generatePassword(): string {
  return randomBytes(18).toString('base64url')
}
