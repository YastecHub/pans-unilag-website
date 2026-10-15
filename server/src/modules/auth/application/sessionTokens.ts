import { jwtVerify, SignJWT } from 'jose'

const ISSUER = 'pans-unilag-api'
const AUDIENCE = 'pans-unilag-admin'

export type SessionClaims = { adminId: string; tokenVersion: number }

const key = (secret: string) => new TextEncoder().encode(secret)

/** A signed session token (HS256) that expires after `hours`. */
export function signSessionToken(
  claims: SessionClaims,
  secret: string,
  hours: number,
  now = new Date(),
): Promise<string> {
  const issuedAt = Math.floor(now.getTime() / 1000)
  return new SignJWT({ ver: claims.tokenVersion })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(claims.adminId)
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setIssuedAt(issuedAt)
    .setExpirationTime(issuedAt + hours * 3600)
    .sign(key(secret))
}

/** The claims of a valid token, or null for a missing, tampered, expired or foreign token. */
export async function verifySessionToken(
  token: string,
  secret: string,
  now = new Date(),
): Promise<SessionClaims | null> {
  try {
    const { payload } = await jwtVerify(token, key(secret), {
      algorithms: ['HS256'],
      issuer: ISSUER,
      audience: AUDIENCE,
      currentDate: now,
    })
    if (typeof payload.sub !== 'string' || typeof payload.ver !== 'number') return null
    return { adminId: payload.sub, tokenVersion: payload.ver }
  } catch {
    return null
  }
}
