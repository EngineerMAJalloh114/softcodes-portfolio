import "server-only";
import { randomBytes } from "node:crypto";
import { count, desc, eq } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { writeAudit } from "@/lib/audit";
import { assertCan, type Role } from "@/lib/auth/permissions";
import { hitRateLimit } from "@/lib/leads/service";
import { NEWSLETTER_RULES, SUBSCRIBER_STATUSES, TOKEN_RE, signupSchema, subscribersCsv, type SubscriberStatus } from "./schema";

/**
 * Newsletter subscribers (M-13). Signups are stored as "pending" with the consent text and
 * time (DEC-43); the double opt-in email and sending come with Resend (T7b).
 * Audit rows reference the subscriber id only — never the email address.
 */

export type Actor = { userId: string; role: Role; ip?: string | null };
const token = () => randomBytes(32).toString("base64url");

export type SignupResult =
  | { ok: true; outcome: "created" | "existing" | "resubscribed" }
  | { ok: false; reason: "invalid"; fieldErrors: Record<string, string[]> }
  | { ok: false; reason: "rate_limited" };

/**
 * Store a signup. The visitor sees the same answer whether the address is new or already on
 * the list, so the form can't be used to find out who is subscribed.
 */
export async function subscribe(input: unknown, meta: { ip: string | null; consentText: string }): Promise<SignupResult> {
  const parsed = signupSchema.safeParse(input);
  if (!parsed.success) return { ok: false, reason: "invalid", fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]> };
  const { max, windowMs } = NEWSLETTER_RULES.rateLimit;
  if (!(await hitRateLimit(`newsletter:${meta.ip ?? "unknown"}`, max, windowMs))) return { ok: false, reason: "rate_limited" };

  const { email, source } = parsed.data;
  const db = getDb();
  const now = new Date();
  const [existing] = await db.select().from(schema.newsletterSubscribers).where(eq(schema.newsletterSubscribers.email, email));
  let id: string;
  let outcome: "created" | "existing" | "resubscribed";
  if (!existing) {
    const [row] = await db
      .insert(schema.newsletterSubscribers)
      .values({ email, status: "pending", consentAt: now, consentText: meta.consentText, source, unsubscribeToken: token(), confirmToken: token() })
      .onConflictDoNothing({ target: schema.newsletterSubscribers.email })
      .returning({ id: schema.newsletterSubscribers.id });
    if (!row) return { ok: true, outcome: "existing" }; // a concurrent signup for the same address won the race
    id = row.id;
    outcome = "created";
  } else if (existing.status === "unsubscribed") {
    // Signing up again after unsubscribing: fresh consent, back to pending (double opt-in again).
    await db
      .update(schema.newsletterSubscribers)
      .set({ status: "pending", consentAt: now, consentText: meta.consentText, source, confirmToken: token(), confirmedAt: null, unsubscribedAt: null, updatedAt: now })
      .where(eq(schema.newsletterSubscribers.id, existing.id));
    id = existing.id;
    outcome = "resubscribed";
  } else {
    return { ok: true, outcome: "existing" }; // pending or confirmed: nothing to change
  }
  await writeAudit({ action: "newsletter.signup", entity: "subscriber", entityId: id, actorUserId: null, ip: meta.ip, data: { source, outcome } });
  return { ok: true, outcome };
}

/** Public unsubscribe by token (link in every email, T7b). */
export async function unsubscribe(t: unknown, meta: { ip: string | null }): Promise<"done" | "invalid"> {
  if (typeof t !== "string" || !TOKEN_RE.test(t)) return "invalid";
  const db = getDb();
  const [row] = await db
    .select({ id: schema.newsletterSubscribers.id, status: schema.newsletterSubscribers.status })
    .from(schema.newsletterSubscribers)
    .where(eq(schema.newsletterSubscribers.unsubscribeToken, t));
  if (!row) return "invalid";
  if (row.status !== "unsubscribed") {
    const now = new Date();
    await db.update(schema.newsletterSubscribers).set({ status: "unsubscribed", unsubscribedAt: now, updatedAt: now }).where(eq(schema.newsletterSubscribers.id, row.id));
    await writeAudit({ action: "newsletter.unsubscribed", entity: "subscriber", entityId: row.id, actorUserId: null, ip: meta.ip, data: { from: row.status } });
  }
  return "done";
}

export async function isValidUnsubscribeToken(t: unknown): Promise<boolean> {
  if (typeof t !== "string" || !TOKEN_RE.test(t)) return false;
  const [row] = await getDb()
    .select({ id: schema.newsletterSubscribers.id })
    .from(schema.newsletterSubscribers)
    .where(eq(schema.newsletterSubscribers.unsubscribeToken, t));
  return !!row;
}

/* ------------------------------------------------------------------ */
/* Admin                                                               */
/* ------------------------------------------------------------------ */

export const SUBSCRIBERS_PAGE_SIZE = 50;

export async function listSubscribers(actor: Actor, filters: { status?: SubscriberStatus; page?: number }) {
  assertCan(actor.role, "subscribers.manage");
  const db = getDb();
  const where = filters.status ? eq(schema.newsletterSubscribers.status, filters.status) : undefined;
  const page = Math.max(1, filters.page ?? 1);
  const rows = await db
    .select({
      id: schema.newsletterSubscribers.id,
      email: schema.newsletterSubscribers.email,
      status: schema.newsletterSubscribers.status,
      source: schema.newsletterSubscribers.source,
      consentAt: schema.newsletterSubscribers.consentAt,
      createdAt: schema.newsletterSubscribers.createdAt,
    })
    .from(schema.newsletterSubscribers)
    .where(where)
    .orderBy(desc(schema.newsletterSubscribers.createdAt))
    .limit(SUBSCRIBERS_PAGE_SIZE)
    .offset((page - 1) * SUBSCRIBERS_PAGE_SIZE);
  const grouped = await db.select({ status: schema.newsletterSubscribers.status, n: count() }).from(schema.newsletterSubscribers).groupBy(schema.newsletterSubscribers.status);
  const counts = Object.fromEntries(SUBSCRIBER_STATUSES.map((s) => [s, 0])) as Record<SubscriberStatus, number>;
  for (const g of grouped) counts[g.status as SubscriberStatus] = Number(g.n);
  const total = filters.status ? counts[filters.status] : Object.values(counts).reduce((a, b) => a + b, 0);
  return { rows, counts, total, page, pages: Math.max(1, Math.ceil(total / SUBSCRIBERS_PAGE_SIZE)) };
}

/** CSV of subscribers (optionally one status). Every export is audited with its row count. */
export async function exportSubscribers(actor: Actor, status?: SubscriberStatus): Promise<{ csv: string; count: number }> {
  assertCan(actor.role, "subscribers.manage");
  const rows = await getDb()
    .select()
    .from(schema.newsletterSubscribers)
    .where(status ? eq(schema.newsletterSubscribers.status, status) : undefined)
    .orderBy(desc(schema.newsletterSubscribers.createdAt));
  await writeAudit({
    action: "newsletter.exported",
    entity: "subscriber",
    entityId: null,
    actorUserId: actor.userId,
    ip: actor.ip,
    data: { status: status ?? "all", count: rows.length },
  });
  return { csv: subscribersCsv(rows), count: rows.length };
}
