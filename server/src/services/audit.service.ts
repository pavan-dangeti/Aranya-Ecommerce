import { desc, eq, sql } from 'drizzle-orm'
import { db, type Db, type Tx } from '../db/client.js'
import { auditLogs } from '../db/schema.js'
import type { AuditLogEntry } from '@aranya/shared'

type Executor = Db | Tx

export interface Actor {
  id: string
  email: string
}

export interface AuditInput {
  action: string
  entity: string
  entityId: string
  meta?: Record<string, unknown> | null
}

export async function record(
  actor: Actor,
  input: AuditInput,
  executor: Executor = db,
): Promise<void> {
  await executor.insert(auditLogs).values({
    actorId: actor.id,
    actorEmail: actor.email,
    action: input.action,
    entity: input.entity,
    entityId: input.entityId,
    meta: input.meta ?? null,
  })
}

export async function listAudit(input: {
  entity?: string
  entityId?: string
  limit: number
  offset: number
}): Promise<{ items: AuditLogEntry[]; total: number }> {
  const conditions = []
  if (input.entity) conditions.push(eq(auditLogs.entity, input.entity))
  if (input.entityId) conditions.push(eq(auditLogs.entityId, input.entityId))

  const where = conditions.length > 0 ? sql`${sql.join(conditions, sql` and `)}` : undefined

  const rows = await db
    .select()
    .from(auditLogs)
    .where(where)
    .orderBy(desc(auditLogs.createdAt))
    .limit(input.limit)
    .offset(input.offset)

  const counted = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(auditLogs)
    .where(where)

  return {
    items: rows.map((r) => ({
      id: r.id,
      actorId: r.actorId,
      actorEmail: r.actorEmail,
      action: r.action,
      entity: r.entity,
      entityId: r.entityId,
      meta: r.meta,
      createdAt: r.createdAt.toISOString(),
    })),
    total: Number(counted[0]?.count ?? 0),
  }
}
