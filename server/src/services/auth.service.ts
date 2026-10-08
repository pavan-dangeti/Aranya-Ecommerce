import { loginThrottle } from '../middleware/rate-limit.js'
import { and, eq, isNull, lt, sql } from 'drizzle-orm'
import type { Db, Tx } from '../db/client.js'
import { db } from '../db/client.js'
import { passwordResetTokens, refreshTokens, users, type UserRow } from '../db/schema.js'
import { badRequest, conflict, tooManyRequests, unauthorized } from '../http/errors.js'
import { fakeVerify, hashPassword, needsRehash, verifyPassword } from '../lib/password.js'
import {
  generateRefreshToken,
  generateResetToken,
  hashToken,
  newFamilyId,
  refreshExpiry,
  signAccessToken,
  verifyAccessToken,
} from '../lib/tokens.js'
import { env } from '../env.js'
import type { Role } from '@aranya/shared'

const RESET_TOKEN_TTL_MS = 60 * 60_000

export interface PublicUser {
  id: string
  name: string
  email: string
  phone?: string
  role: Role
  memberSince: string
}

function toPublicUser(row: UserRow): PublicUser {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    ...(row.phone ? { phone: row.phone } : {}),
    role: row.role,
    memberSince: row.memberSince.toISOString(),
  }
}

export interface IssuedSession {
  user: PublicUser
  refreshToken: string
  refreshExpiresAt: Date
  accessToken: string
  expiresIn: number
}

async function issueSession(
  tx: Tx | Db,
  user: UserRow,
  meta: { userAgent?: string; ip?: string },
): Promise<IssuedSession> {
  const token = generateRefreshToken()
  const family = newFamilyId()
  const expiresAt = refreshExpiry()

  await tx.insert(refreshTokens).values({
    userId: user.id,
    tokenHash: hashToken(token),
    familyId: family,
    userAgent: meta.userAgent?.slice(0, 400) ?? null,
    ip: meta.ip ?? null,
    expiresAt,
  })

  const accessToken = await signAccessToken({ sub: user.id, email: user.email, role: user.role })

  return {
    user: toPublicUser(user),
    refreshToken: token,
    refreshExpiresAt: expiresAt,
    accessToken,
    expiresIn: env.ACCESS_TOKEN_TTL,
  }
}

export async function register(
  input: { name: string; email: string; password: string; phone?: string },
  meta: { userAgent?: string; ip?: string },
): Promise<IssuedSession> {
  const email = input.email.trim().toLowerCase()

  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(sql`lower(${users.email}) = ${email}`)
    .limit(1)

  if (existing.length > 0) {
    await fakeVerify()
    throw conflict('An account with this email already exists', 'email_taken')
  }

  const passwordHash = await hashPassword(input.password)

  const created = await db.transaction(async (tx) => {
    const rows = await tx
      .insert(users)
      .values({
        name: input.name.trim(),
        email,
        passwordHash,
        phone: input.phone?.trim() ?? null,
        role: 'customer',
      })
      .returning()
    const user = rows[0]
    if (!user) throw new Error('user insert returned no row')
    return issueSession(tx, user, meta)
  })

  return created
}

export async function login(
  input: { email: string; password: string },
  meta: { userAgent?: string; ip?: string },
): Promise<IssuedSession> {
  const email = input.email.trim().toLowerCase()

  const rows = await db
    .select()
    .from(users)
    .where(sql`lower(${users.email}) = ${email}`)
    .limit(1)
  const user = rows[0]

  const throttleKey = `${email}|${meta.ip ?? 'unknown'}`
  if (loginThrottle.blocked(throttleKey)) {
    throw tooManyRequests('Too many sign-in attempts. Try again in a few minutes.')
  }

  if (!user) {
    await fakeVerify()
    loginThrottle.fail(throttleKey)
    throw unauthorized('Invalid email or password', 'invalid_credentials')
  }

  if (!(await verifyPassword(user.passwordHash, input.password))) {
    loginThrottle.fail(throttleKey)
    throw unauthorized('Invalid email or password', 'invalid_credentials')
  }
  loginThrottle.clear(throttleKey)

  if (needsRehash(user.passwordHash)) {
    await db
      .update(users)
      .set({ passwordHash: await hashPassword(input.password) })
      .where(eq(users.id, user.id))
  }

  return db.transaction((tx) => issueSession(tx, user, meta))
}

/**
 * Rotates a refresh token. Presenting an already-revoked token means the cookie
 * leaked, so the whole family is revoked and the caller must sign in again.
 */
export async function refresh(
  token: string,
  meta: { userAgent?: string; ip?: string },
): Promise<IssuedSession> {
  const hash = hashToken(token)
  const found = await db
    .select()
    .from(refreshTokens)
    .where(eq(refreshTokens.tokenHash, hash))
    .limit(1)
  const presented = found[0]

  if (!presented) throw unauthorized('Session expired, please sign in again', 'refresh_invalid')

  // Revocation happens outside the rotation transaction: throwing inside one
  // would roll the family revocation back and let the stolen token live on.
  if (presented.revokedAt) {
    await revokeFamily(presented.familyId)
    throw unauthorized('Session reuse detected. Please sign in again.', 'refresh_reuse_detected')
  }

  return db.transaction(async (tx) => {
    const locked = await tx
      .select()
      .from(refreshTokens)
      .where(eq(refreshTokens.id, presented.id))
      .for('update')
      .limit(1)

    const stored = locked[0]
    if (!stored) throw unauthorized('Session expired, please sign in again', 'refresh_invalid')

    if (stored.revokedAt) {
      throw unauthorized('Session reuse detected. Please sign in again.', 'refresh_reuse_detected')
    }

    if (stored.expiresAt.getTime() <= Date.now()) {
      throw unauthorized('Session expired, please sign in again', 'refresh_expired')
    }

    const userRows = await tx.select().from(users).where(eq(users.id, stored.userId)).limit(1)
    const user = userRows[0]
    if (!user) throw unauthorized('Session expired, please sign in again', 'refresh_invalid')

    const next = generateRefreshToken()
    const expiresAt = refreshExpiry()

    const inserted = await tx
      .insert(refreshTokens)
      .values({
        userId: user.id,
        tokenHash: hashToken(next),
        familyId: stored.familyId,
        userAgent: meta.userAgent?.slice(0, 400) ?? null,
        ip: meta.ip ?? null,
        expiresAt,
      })
      .returning({ id: refreshTokens.id })

    await tx
      .update(refreshTokens)
      .set({ revokedAt: new Date(), replacedById: inserted[0]?.id ?? null })
      .where(eq(refreshTokens.id, stored.id))

    return {
      user: toPublicUser(user),
      refreshToken: next,
      refreshExpiresAt: expiresAt,
      accessToken: await signAccessToken({ sub: user.id, email: user.email, role: user.role }),
      expiresIn: env.ACCESS_TOKEN_TTL,
    }
  })
}

async function revokeFamily(familyId: string): Promise<void> {
  await db
    .update(refreshTokens)
    .set({ revokedAt: sql`coalesce(${refreshTokens.revokedAt}, now())` })
    .where(and(eq(refreshTokens.familyId, familyId), isNull(refreshTokens.revokedAt)))
}

export async function logout(token: string | undefined): Promise<void> {
  if (!token) return
  await db
    .update(refreshTokens)
    .set({ revokedAt: new Date() })
    .where(and(eq(refreshTokens.tokenHash, hashToken(token)), isNull(refreshTokens.revokedAt)))
}

async function logoutAll(userId: string): Promise<void> {
  await db
    .update(refreshTokens)
    .set({ revokedAt: new Date() })
    .where(and(eq(refreshTokens.userId, userId), isNull(refreshTokens.revokedAt)))
}

export async function me(accessToken: string) {
  const claims = await verifyAccessToken(accessToken)
  const rows = await db.select().from(users).where(eq(users.id, claims.sub)).limit(1)
  const user = rows[0]
  if (!user) throw unauthorized('Account no longer exists', 'unauthorized')
  return toPublicUser(user)
}

export async function updateProfile(userId: string, patch: { name?: string; phone?: string }) {
  const rows = await db
    .update(users)
    .set({
      ...(patch.name !== undefined ? { name: patch.name.trim() } : {}),
      ...(patch.phone !== undefined ? { phone: patch.phone.trim() } : {}),
    })
    .where(eq(users.id, userId))
    .returning()
  const user = rows[0]
  if (!user) throw unauthorized('Account no longer exists', 'unauthorized')
  return toPublicUser(user)
}

export async function changePassword(
  userId: string,
  input: { currentPassword: string; newPassword: string },
): Promise<void> {
  const rows = await db.select().from(users).where(eq(users.id, userId)).limit(1)
  const user = rows[0]
  if (!user) throw unauthorized('Account no longer exists', 'unauthorized')

  const ok = await verifyPassword(user.passwordHash, input.currentPassword)
  if (!ok) throw badRequest('Current password is incorrect', 'invalid_credentials')

  await db
    .update(users)
    .set({
      passwordHash: await hashPassword(input.newPassword),
      passwordChangedAt: new Date(),
    })
    .where(eq(users.id, userId))

  await logoutAll(userId)
}

export interface IssuedResetToken {
  token: string
  user: PublicUser
}

/** Always resolves: callers must not be able to probe which emails exist. */
export async function requestPasswordReset(email: string): Promise<IssuedResetToken | null> {
  const normalized = email.trim().toLowerCase()
  const rows = await db
    .select()
    .from(users)
    .where(sql`lower(${users.email}) = ${normalized}`)
    .limit(1)
  const user = rows[0]
  if (!user) return null

  const token = generateResetToken()
  await db.insert(passwordResetTokens).values({
    userId: user.id,
    tokenHash: hashToken(token),
    expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS),
  })
  return { token, user: toPublicUser(user) }
}

export async function resetPassword(token: string, newPassword: string): Promise<void> {
  const rows = await db
    .select()
    .from(passwordResetTokens)
    .where(
      and(eq(passwordResetTokens.tokenHash, hashToken(token)), isNull(passwordResetTokens.usedAt)),
    )
    .limit(1)

  const stored = rows[0]
  if (!stored || stored.expiresAt.getTime() <= Date.now()) {
    throw badRequest('This reset link has expired. Request a new one.', 'reset_invalid')
  }

  await db.transaction(async (tx) => {
    await tx
      .update(users)
      .set({
        passwordHash: await hashPassword(newPassword),
        passwordChangedAt: new Date(),
      })
      .where(eq(users.id, stored.userId))

    await tx
      .update(passwordResetTokens)
      .set({ usedAt: new Date() })
      .where(eq(passwordResetTokens.id, stored.id))
  })

  await logoutAll(stored.userId)
}

export async function purgeExpiredTokens(): Promise<number> {
  const now = new Date()
  const refresh = await db
    .delete(refreshTokens)
    .where(lt(refreshTokens.expiresAt, now))
    .returning({ id: refreshTokens.id })
  const resets = await db
    .delete(passwordResetTokens)
    .where(lt(passwordResetTokens.expiresAt, now))
    .returning({ id: passwordResetTokens.id })
  return refresh.length + resets.length
}

export async function ensureSeedAdmin(): Promise<boolean> {
  if (!env.SEED_ADMIN_EMAIL || !env.SEED_ADMIN_PASSWORD) return false

  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.role, 'admin'))
    .limit(1)
  if (existing.length > 0) return false

  await db.insert(users).values({
    name: 'Aranya Admin',
    email: env.SEED_ADMIN_EMAIL.trim().toLowerCase(),
    passwordHash: await hashPassword(env.SEED_ADMIN_PASSWORD),
    role: 'admin',
  })

  return true
}
