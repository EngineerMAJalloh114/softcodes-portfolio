import "server-only";
import { and, count, desc, eq, gte, isNull, lt, type SQL } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { AUDIT_PAGE_SIZE, SYSTEM_ACTOR, dateRange, type AuditFilters } from "./audit-filters";

export type AuditRow = {
  id: number;
  at: Date;
  action: string;
  entity: string;
  entityId: string | null;
  actorUserId: string | null;
  actorEmail: string | null;
  ip: string | null;
  data: unknown;
};

function whereFor(filters: Partial<AuditFilters>): SQL | undefined {
  const parts: SQL[] = [];
  if (filters.actor === SYSTEM_ACTOR) parts.push(isNull(schema.auditLog.actorUserId));
  else if (filters.actor) parts.push(eq(schema.auditLog.actorUserId, filters.actor));
  if (filters.action) parts.push(eq(schema.auditLog.action, filters.action));
  const { start, end } = dateRange(filters.from, filters.to);
  if (start) parts.push(gte(schema.auditLog.at, start));
  if (end) parts.push(lt(schema.auditLog.at, end));
  return parts.length ? and(...parts) : undefined;
}

/** Read-only, paginated audit log query (G-19). Newest first. */
export async function queryAuditLog(filters: Partial<AuditFilters>, pageSize = AUDIT_PAGE_SIZE) {
  const db = getDb();
  const page = Math.max(1, filters.page ?? 1);
  const where = whereFor(filters);

  const rows: AuditRow[] = await db
    .select({
      id: schema.auditLog.id,
      at: schema.auditLog.at,
      action: schema.auditLog.action,
      entity: schema.auditLog.entity,
      entityId: schema.auditLog.entityId,
      actorUserId: schema.auditLog.actorUserId,
      actorEmail: schema.users.email,
      ip: schema.auditLog.ip,
      data: schema.auditLog.data,
    })
    .from(schema.auditLog)
    .leftJoin(schema.users, eq(schema.users.id, schema.auditLog.actorUserId))
    .where(where)
    .orderBy(desc(schema.auditLog.at), desc(schema.auditLog.id))
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  const [{ total }] = await db.select({ total: count() }).from(schema.auditLog).where(where);
  return { rows, total: Number(total), page, pageSize, pages: Math.max(1, Math.ceil(Number(total) / pageSize)) };
}

/** Distinct actions, for the filter dropdown. */
export async function listAuditActions(): Promise<string[]> {
  const rows = await getDb()
    .selectDistinct({ action: schema.auditLog.action })
    .from(schema.auditLog)
    .orderBy(schema.auditLog.action);
  return rows.map((r) => r.action);
}

/** Users who appear as actors, for the filter dropdown. */
export async function listAuditActors(): Promise<{ id: string; email: string }[]> {
  return getDb()
    .selectDistinct({ id: schema.users.id, email: schema.users.email })
    .from(schema.auditLog)
    .innerJoin(schema.users, eq(schema.users.id, schema.auditLog.actorUserId))
    .orderBy(schema.users.email);
}
