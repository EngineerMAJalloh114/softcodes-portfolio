import "server-only";
import { randomUUID } from "node:crypto";
import { and, count, desc, eq, ilike, isNull, or, sql, type SQL } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { getSettings } from "@/lib/admin/settings";
import { writeAudit } from "@/lib/audit";
import { assertCan, type Role } from "@/lib/auth/permissions";
import { getEmailAdapter } from "@/lib/email";
import {
  LEAD_STATUSES,
  SPAM_RULES,
  budgetLabel,
  formatLeadReference,
  leadSchema,
  noteSchema,
  sourceLabel,
  type LeadFilters,
  type LeadStatus,
} from "./schema";

/**
 * Leads (M-03) — public submission and the admin inbox. Submissions are validated (K-15)
 * and rate limited per IP (K-14); every admin change is audited (K-16).
 */

export type Actor = { userId: string; role: Role; ip?: string | null };
export const LEADS_PAGE_SIZE = 25;

/* ------------------------------------------------------------------ */
/* Rate limit (K-14) — shared across instances via the rate_limits table */
/* ------------------------------------------------------------------ */

/**
 * Fixed window per key. Returns true when this request is allowed. Atomic: one upsert,
 * so concurrent requests can't both slip under the limit.
 */
export async function hitRateLimit(key: string, max: number, windowMs: number, now = Date.now()): Promise<boolean> {
  const windowStart = now - windowMs;
  const result = await getDb().execute(sql`
    insert into rate_limits (id, key, count, last_request)
    values (${randomUUID()}, ${key}, 1, ${now})
    on conflict (key) do update set
      count = case when rate_limits.last_request < ${windowStart} then 1 else rate_limits.count + 1 end,
      last_request = case when rate_limits.last_request < ${windowStart} then ${now} else rate_limits.last_request end
    returning count
  `);
  const rows = (result as unknown as { rows?: { count: number }[] }).rows ?? (result as unknown as { count: number }[]);
  return Number(rows[0]?.count ?? 0) <= max;
}

/* ------------------------------------------------------------------ */
/* Public submission                                                   */
/* ------------------------------------------------------------------ */

/** Next number in a per-key sequence (atomic). */
async function nextCounter(key: string): Promise<number> {
  const [row] = await getDb()
    .insert(schema.counters)
    .values({ key, value: 1 })
    .onConflictDoUpdate({ target: schema.counters.key, set: { value: sql`${schema.counters.value} + 1` } })
    .returning({ value: schema.counters.value });
  return row.value;
}

/** Published package slugs: the project types a visitor can pick (plus "other"). */
export async function projectTypeOptions(): Promise<{ slug: string; name: string }[]> {
  return getDb()
    .select({ slug: schema.pricingPackages.slug, name: schema.pricingPackages.name })
    .from(schema.pricingPackages)
    .where(eq(schema.pricingPackages.published, true))
    .orderBy(schema.pricingPackages.sortOrder, schema.pricingPackages.id);
}

export type SubmitResult =
  | { ok: true; reference: string }
  | { ok: false; reason: "invalid"; fieldErrors: Record<string, string[]> }
  | { ok: false; reason: "rate_limited" };

/**
 * Store a quote request. Spam checks (honeypot, fill time) run in the action before this;
 * the rate limit counts accepted submissions per IP.
 */
export async function submitLead(input: unknown, meta: { ip: string | null; now?: Date }): Promise<SubmitResult> {
  const types = await projectTypeOptions();
  const parsed = leadSchema(types.map((t) => t.slug)).safeParse(input);
  if (!parsed.success) {
    return { ok: false, reason: "invalid", fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]> };
  }
  const { max, windowMs } = SPAM_RULES.rateLimit;
  if (!(await hitRateLimit(`lead:${meta.ip ?? "unknown"}`, max, windowMs))) return { ok: false, reason: "rate_limited" };

  const v = parsed.data;
  const now = meta.now ?? new Date();
  const year = now.getUTCFullYear();
  const reference = formatLeadReference(year, await nextCounter(`lead:${year}`));
  const db = getDb();
  const [lead] = await db
    .insert(schema.leads)
    .values({
      reference,
      name: v.name,
      email: v.email,
      phone: v.phone,
      company: v.company,
      projectType: v.projectType,
      budget: v.budget,
      budgetCurrency: v.budgetCurrency,
      deadline: v.deadline,
      message: v.message,
      source: v.source,
    })
    .returning({ id: schema.leads.id });

  await writeAudit({
    action: "lead.created",
    entity: "lead",
    entityId: lead.id,
    actorUserId: null,
    ip: meta.ip,
    data: { reference, projectType: v.projectType, source: v.source },
  });

  const typeName = types.find((t) => t.slug === v.projectType)?.name ?? "Other";
  await notifyOwner({
    kind: "lead.new",
    title: `New quote request ${reference}`,
    body: `${v.name}${v.company ? ` (${v.company})` : ""} — ${typeName}, ${budgetLabel(v.budget, v.budgetCurrency)}.`,
    href: `/admin/leads/${lead.id}`,
    entityId: lead.id,
    email: {
      subject: `New quote request ${reference} from ${v.name}`,
      text: [
        `Reference: ${reference}`,
        `Name: ${v.name}`,
        `Email: ${v.email}`,
        `Phone/WhatsApp: ${v.phone ?? "—"}`,
        `Company: ${v.company ?? "—"}`,
        `Project type: ${typeName}`,
        `Budget: ${budgetLabel(v.budget, v.budgetCurrency)}`,
        `Deadline: ${v.deadline ?? "—"}`,
        `Found us via: ${sourceLabel(v.source)}`,
        "",
        v.message,
      ].join("\n"),
    },
  });
  return { ok: true, reference };
}

/* ------------------------------------------------------------------ */
/* Owner notifications (stored always; emailed once an adapter is set)  */
/* ------------------------------------------------------------------ */

async function notifyOwner(n: {
  kind: string;
  title: string;
  body: string;
  href: string;
  entityId: string;
  email: { subject: string; text: string };
}) {
  const adapter = getEmailAdapter();
  let email: "sent" | "logged" | "not_configured" | "failed" = "not_configured";
  if (adapter.configured) {
    try {
      const { contactEmail } = await getSettings();
      await adapter.send({ to: contactEmail, subject: n.email.subject, text: n.email.text, kind: "lead-notification" });
      email = adapter.name === "dev-log" ? "logged" : "sent";
    } catch (error) {
      console.error("[leads] owner email failed", (error as Error).message);
      email = "failed";
    }
  }
  await getDb()
    .insert(schema.notifications)
    .values({ kind: n.kind, title: n.title, body: n.body, href: n.href, entityId: n.entityId, email });
}

export async function unreadNotificationCount(): Promise<number> {
  const [row] = await getDb().select({ n: count() }).from(schema.notifications).where(isNull(schema.notifications.readAt));
  return Number(row?.n ?? 0);
}

/* ------------------------------------------------------------------ */
/* Admin inbox                                                         */
/* ------------------------------------------------------------------ */

export type LeadRow = typeof schema.leads.$inferSelect & { unread: boolean };

export async function listLeads(actor: Actor, filters: LeadFilters, pageSize = LEADS_PAGE_SIZE) {
  assertCan(actor.role, "leads.read");
  const db = getDb();
  const parts: SQL[] = [];
  if (filters.status) parts.push(eq(schema.leads.status, filters.status));
  if (filters.q) {
    const like = `%${filters.q.replace(/[%_\\]/g, (c) => `\\${c}`)}%`;
    parts.push(
      or(
        ilike(schema.leads.name, like),
        ilike(schema.leads.email, like),
        ilike(schema.leads.reference, like),
        ilike(schema.leads.company, like),
      )!,
    );
  }
  const where = parts.length ? and(...parts) : undefined;
  const page = Math.max(1, filters.page);
  const unread = sql<boolean>`exists (select 1 from notifications n where n.entity_id = ${schema.leads.id}::text and n.read_at is null)`;
  const rows = await db
    .select({ lead: schema.leads, unread })
    .from(schema.leads)
    .where(where)
    .orderBy(desc(schema.leads.createdAt))
    .limit(pageSize)
    .offset((page - 1) * pageSize);
  const [{ total }] = await db.select({ total: count() }).from(schema.leads).where(where);
  const byStatus = await db
    .select({ status: schema.leads.status, n: count() })
    .from(schema.leads)
    .groupBy(schema.leads.status);
  const counts = Object.fromEntries(LEAD_STATUSES.map((s) => [s, 0])) as Record<LeadStatus, number>;
  for (const r of byStatus) counts[r.status as LeadStatus] = Number(r.n);
  return {
    rows: rows.map((r) => ({ ...r.lead, unread: !!r.unread })) as LeadRow[],
    total: Number(total),
    page,
    pages: Math.max(1, Math.ceil(Number(total) / pageSize)),
    counts,
  };
}

/** Lead detail. Opening it marks its notifications read. */
export async function getLead(actor: Actor, id: string) {
  assertCan(actor.role, "leads.read");
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const db = getDb();
  const [lead] = await db.select().from(schema.leads).where(eq(schema.leads.id, id));
  if (!lead) return null;
  const [notes, history] = await Promise.all([
    db
      .select({ id: schema.leadNotes.id, body: schema.leadNotes.body, createdAt: schema.leadNotes.createdAt, author: schema.users.email })
      .from(schema.leadNotes)
      .leftJoin(schema.users, eq(schema.users.id, schema.leadNotes.authorId))
      .where(eq(schema.leadNotes.leadId, id))
      .orderBy(desc(schema.leadNotes.createdAt)),
    db
      .select({ at: schema.auditLog.at, action: schema.auditLog.action, data: schema.auditLog.data, actor: schema.users.email })
      .from(schema.auditLog)
      .leftJoin(schema.users, eq(schema.users.id, schema.auditLog.actorUserId))
      .where(and(eq(schema.auditLog.entity, "lead"), eq(schema.auditLog.entityId, id)))
      .orderBy(desc(schema.auditLog.at), desc(schema.auditLog.id)),
  ]);
  await db
    .update(schema.notifications)
    .set({ readAt: new Date(), readBy: actor.userId })
    .where(and(eq(schema.notifications.entityId, id), isNull(schema.notifications.readAt)));
  return { lead, notes, history };
}

export type ChangeResult = { ok: true } | { ok: false; message: string };

export async function setLeadStatus(actor: Actor, id: string, status: unknown): Promise<ChangeResult> {
  assertCan(actor.role, "leads.write");
  if (typeof status !== "string" || !(LEAD_STATUSES as readonly string[]).includes(status)) {
    return { ok: false, message: "Choose a valid status." };
  }
  const db = getDb();
  const [current] = await db.select({ status: schema.leads.status }).from(schema.leads).where(eq(schema.leads.id, id));
  if (!current) return { ok: false, message: "This lead no longer exists." };
  if (current.status === status) return { ok: true };
  await db
    .update(schema.leads)
    .set({ status: status as LeadStatus, updatedAt: new Date() })
    .where(eq(schema.leads.id, id));
  await writeAudit({
    action: "lead.status_changed",
    entity: "lead",
    entityId: id,
    actorUserId: actor.userId,
    ip: actor.ip,
    data: { from: current.status, to: status },
  });
  return { ok: true };
}

export async function addLeadNote(actor: Actor, id: string, body: unknown): Promise<ChangeResult> {
  assertCan(actor.role, "leads.write");
  const parsed = noteSchema.safeParse(body);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message };
  const db = getDb();
  const [exists] = await db.select({ id: schema.leads.id }).from(schema.leads).where(eq(schema.leads.id, id));
  if (!exists) return { ok: false, message: "This lead no longer exists." };
  const [note] = await db
    .insert(schema.leadNotes)
    .values({ leadId: id, authorId: actor.userId, body: parsed.data })
    .returning({ id: schema.leadNotes.id });
  await writeAudit({
    action: "lead.note_added",
    entity: "lead",
    entityId: id,
    actorUserId: actor.userId,
    ip: actor.ip,
    data: { noteId: note.id, length: parsed.data.length },
  });
  return { ok: true };
}

/** Count of leads with status "new" (dashboard). */
export async function newLeadCount(): Promise<number> {
  const [row] = await getDb().select({ n: count() }).from(schema.leads).where(eq(schema.leads.status, "new"));
  return Number(row?.n ?? 0);
}
