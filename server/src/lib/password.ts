import argon2 from 'argon2'

const OPTIONS = {
  type: argon2.argon2id,
  memoryCost: 65_536,
  timeCost: 3,
  parallelism: 4,
} as const

const DUMMY_HASH =
  '$argon2id$v=19$m=65536,p=4,t=3$ZldeVlAyhdVg6yyPf3s03A$8ybSlqbqWl80eLdjbW7Ib5A0iW55GDJMEoDFnjXUqu8'

export function hashPassword(plain: string): Promise<string> {
  return argon2.hash(plain, OPTIONS)
}

export async function verifyPassword(hash: string, plain: string): Promise<boolean> {
  try {
    return await argon2.verify(hash, plain)
  } catch {
    return false
  }
}

/** Burns the same CPU as a real verify so a missing user cannot be timed out. */
export async function fakeVerify(): Promise<void> {
  await argon2.verify(DUMMY_HASH, 'not-a-real-password').catch(() => false)
}

export function needsRehash(hash: string): boolean {
  return !hash.startsWith(
    `$argon2id$v=19$m=${OPTIONS.memoryCost},t=${OPTIONS.timeCost},p=${OPTIONS.parallelism}`,
  )
}
