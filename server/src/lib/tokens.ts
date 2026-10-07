import { createHash, randomBytes, randomUUID } from 'node:crypto'
import { SignJWT, jwtVerify } from 'jose'
import { env } from '../env.js'
import { unauthorized } from '../http/errors.js'
import type { Role } from '@aranya/shared'

const secret = new TextEncoder().encode(env.JWT_SECRET)

export interface AccessClaims {
  sub: string
  email: string
  role: Role
}

export async function signAccessToken(claims: AccessClaims): Promise<string> {
  return new SignJWT({ email: claims.email, role: claims.role })
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setSubject(claims.sub)
    .setIssuedAt()
    .setExpirationTime(`${env.ACCESS_TOKEN_TTL}s`)
    .setIssuer('aranya-api')
    .setAudience('aranya-web')
    .setJti(randomUUID())
    .sign(secret)
}

export async function verifyAccessToken(token: string): Promise<AccessClaims> {
  try {
    const { payload } = await jwtVerify(token, secret, {
      issuer: 'aranya-api',
      audience: 'aranya-web',
      algorithms: ['HS256'],
    })
    if (typeof payload.sub !== 'string') throw new Error('missing sub')
    return {
      sub: payload.sub,
      email: String(payload.email ?? ''),
      role: payload.role === 'admin' ? 'admin' : 'customer',
    }
  } catch {
    throw unauthorized('Your session has expired. Please sign in again.', 'token_invalid')
  }
}

/** Refresh tokens are opaque random strings; only their hash is stored. */
export function generateRefreshToken(): string {
  return randomBytes(48).toString('base64url')
}

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

export function newFamilyId(): string {
  return randomUUID()
}

export function refreshExpiry(from: Date = new Date()): Date {
  return new Date(from.getTime() + env.REFRESH_TOKEN_TTL_DAYS * 86_400_000)
}

export const REFRESH_COOKIE = 'aranya_rt'
// Readable, secret-free twin of the refresh cookie so a signed-out visitor's
// page load can skip the refresh probe instead of logging a 401.
export const SESSION_HINT_COOKIE = 'aranya_session'

export const refreshCookieOptions = (
  secure: boolean,
  sameSite: 'lax' | 'none' = env.COOKIE_SAME_SITE,
) =>
  ({
    httpOnly: true,
    // A cross-site cookie is only accepted when it is also Secure.
    secure: secure || sameSite === 'none',
    sameSite: sameSite === 'none' ? ('None' as const) : ('Lax' as const),
    path: '/api/auth',
    maxAge: env.REFRESH_TOKEN_TTL_DAYS * 86_400,
    ...(env.COOKIE_DOMAIN ? { domain: env.COOKIE_DOMAIN } : {}),
  }) as const

export function generateResetToken(): string {
  return randomBytes(32).toString('base64url')
}
