import "server-only";
import { getDb, schema } from "@/db";

/** Append an audit row (K-16). Content/media writes call this after a successful change. */
export async function writeAudit(entry: {
  action: string;
  entity: string;
  entityId?: string | number | null;
  actorUserId: string | null;
  data?: Record<string, unknown>;
  ip?: string | null;
}) {
  await getDb()
    .insert(schema.auditLog)
    .values({
      action: entry.action,
      entity: entry.entity,
      entityId: entry.entityId == null ? null : String(entry.entityId),
      actorUserId: entry.actorUserId,
      data: entry.data ?? null,
      ip: entry.ip ?? null,
    });
}
