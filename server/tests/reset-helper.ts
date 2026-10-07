import { hashToken } from '../src/lib/tokens.js'
import { db } from '../src/db/client.js'
import { passwordResetTokens, users } from '../src/db/schema.js'
import { eq, sql } from 'drizzle-orm'

const RESET_TOKEN = 'reset-token-for-tests-0000000001'

/**
 * The dev console-mail adapter logs the token instead of sending it. Tests need
 * the token itself, so they mint one through the same code path the reset flow
 * uses rather than scraping logs.
 */
export async function issueResetTokenForTest(email: string): Promise<string> {
  const rows = await db.select().from(users).where(eq(users.email, email)).limit(1)
  const user = rows[0]
  if (!user) throw new Error(`no user ${email}`)

  await db.execute(sql`delete from password_reset_tokens where user_id = ${user.id}`)
  await db.insert(passwordResetTokens).values({
    userId: user.id,
    tokenHash: hashToken(RESET_TOKEN),
    expiresAt: new Date(Date.now() + 3_600_000),
  })

  return RESET_TOKEN
}
