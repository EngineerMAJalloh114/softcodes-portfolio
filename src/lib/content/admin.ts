import "server-only";
import { and, asc, eq, gt, lt, desc, sql } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { writeAudit } from "@/lib/audit";
import { assertCan, type Role } from "@/lib/auth/permissions";
import {
  COLLECTION_DEFS,
  SECTION_DEFS,
  collectionSchema,
  sectionSchema,
  type CollectionKey,
  type SectionKey,
} from "./defs";
import { issuesToErrors } from "./fields";
import { seedContent } from "./seed-content";

/**
 * Admin content services (A-15, G-14). Every function re-checks `content.write` (deny by
 * default, K-05), validates with the shared field specs (K-15) and writes an audit row
 * (K-16). Callers (server actions) revalidate the public cache.
 */

export type Actor = { userId: string; role: Role; ip?: string | null };
export type Result<T = object> = ({ ok: true } & T) | { ok: false; errors: Record<string, string>; message: string };

const invalid = (errors: Record<string, string>, message = "Please fix the highlighted fields."): Result<never> => ({
  ok: false,
  errors,
  message,
});

/* ------------------------------------------------------------------ */
/* Sections                                                            */
/* ------------------------------------------------------------------ */

/** Seed value for a section (fills a missing DB row and fields added later). */
function sectionSeed(key: SectionKey): Record<string, unknown> {
  const s = seedContent();
  const map: Record<SectionKey, unknown> = {
    hero: s.hero,
    about: s.about,
    person: s.person,
    services_section: { eyebrow: s.services.eyebrow, heading: s.services.heading },
    process: s.process,
    projects_section: s.projectsSection,
    stack_section: { eyebrow: s.stack.eyebrow, heading: s.stack.heading },
    contact_section: s.contactSection,
    soft_codes: s.softCodes,
    nav: s.nav,
    footer: s.footer,
    site: s.site,
    pages: s.pages,
  };
  return map[key] as Record<string, unknown>;
}

export async function getSectionForEdit(key: SectionKey) {
  const [row] = await getDb().select().from(schema.contentSections).where(eq(schema.contentSections.key, key));
  const seed = sectionSeed(key);
  const published = { ...seed, ...((row?.data as object) ?? {}) };
  const draft = row?.draft ? { ...published, ...(row.draft as object) } : null;
  return { published, draft, value: draft ?? published, hasDraft: !!draft, updatedAt: row?.updatedAt ?? null };
}

/** Save a section as a draft, or publish it (the live version changes only on publish). */
export async function saveSection(actor: Actor, key: SectionKey, input: unknown, opts: { publish: boolean }): Promise<Result> {
  assertCan(actor.role, "content.write");
  const parsed = sectionSchema(key).safeParse(input);
  if (!parsed.success) return invalid(issuesToErrors(parsed.error));
  const value = parsed.data;
  const db = getDb();
  const set = opts.publish
    ? { data: value, draft: null, updatedBy: actor.userId, updatedAt: new Date() }
    : { draft: value, updatedBy: actor.userId, updatedAt: new Date() };
  await db
    .insert(schema.contentSections)
    .values({ key, data: opts.publish ? value : sectionSeed(key), draft: opts.publish ? null : value, updatedBy: actor.userId })
    .onConflictDoUpdate({ target: schema.contentSections.key, set });
  await writeAudit({
    action: opts.publish ? "content.section.published" : "content.section.draft_saved",
    entity: "content_section",
    entityId: key,
    actorUserId: actor.userId,
    ip: actor.ip,
    data: { label: SECTION_DEFS[key].label },
  });
  return { ok: true };
}

export async function discardSectionDraft(actor: Actor, key: SectionKey): Promise<Result> {
  assertCan(actor.role, "content.write");
  await getDb()
    .update(schema.contentSections)
    .set({ draft: null, updatedBy: actor.userId })
    .where(eq(schema.contentSections.key, key));
  await writeAudit({ action: "content.section.draft_discarded", entity: "content_section", entityId: key, actorUserId: actor.userId, ip: actor.ip });
  return { ok: true };
}

/** Status of every section (for the content index). */
export async function listSections() {
  const rows = await getDb()
    .select({ key: schema.contentSections.key, hasDraft: sql<boolean>`${schema.contentSections.draft} is not null`, updatedAt: schema.contentSections.updatedAt })
    .from(schema.contentSections);
  return Object.values(SECTION_DEFS).map((def) => {
    const row = rows.find((r) => r.key === def.key);
    return { ...def, hasDraft: !!row?.hasDraft, updatedAt: row?.updatedAt ?? null };
  });
}

/* ------------------------------------------------------------------ */
/* Collections                                                         */
/* ------------------------------------------------------------------ */

const TABLES = {
  services: schema.services,
  stack: schema.stackItems,
  projects: schema.projects,
} as const;

// Narrow helper type: all three tables share these columns.
type AnyTable = typeof schema.services;
const table = (c: CollectionKey) => TABLES[c] as unknown as AnyTable;

/** Columns written from validated input (field names = Drizzle column keys). */
function liveColumns(c: CollectionKey, value: Record<string, unknown>) {
  return Object.fromEntries(COLLECTION_DEFS[c].fields.map((f) => [f.name, value[f.name]]));
}

function uniqueViolation(error: unknown): boolean {
  const e = error as { code?: string; cause?: { code?: string } };
  return e?.code === "23505" || e?.cause?.code === "23505";
}

function uniqueFieldError(c: CollectionKey): Record<string, string> {
  if (c === "projects") return { slug: "Another project already uses this slug." };
  if (c === "services") return { title: "Another service already has this title." };
  return { name: "This tool is already in the list." };
}

export type CollectionRow = { id: number; title: string; published: boolean; hasDraft: boolean; sortOrder: number; updatedAt: Date };

export async function listCollection(c: CollectionKey): Promise<CollectionRow[]> {
  const t = TABLES[c];
  const titleCol = (t as unknown as Record<string, unknown>)[COLLECTION_DEFS[c].titleField] as typeof schema.services.title;
  const rows = await getDb()
    .select({
      id: t.id,
      title: titleCol,
      published: t.published,
      hasDraft: sql<boolean>`${t.draft} is not null`,
      sortOrder: t.sortOrder,
      updatedAt: t.updatedAt,
    })
    .from(t)
    .orderBy(asc(t.sortOrder), asc(t.id));
  return rows.map((r) => ({ ...r, title: String(r.title) }));
}

/** Current editable value (draft if any, else live) for one item. */
export async function getItemForEdit(c: CollectionKey, id: number) {
  const t = table(c);
  const [row] = await getDb().select().from(t).where(eq(t.id, id));
  if (!row) return null;
  const live = liveColumns(c, row as unknown as Record<string, unknown>);
  const draft = row.draft ? { ...live, ...(row.draft as object) } : null;
  return { id: row.id, live, value: draft ?? live, published: row.published, hasDraft: !!draft };
}

export async function createItem(actor: Actor, c: CollectionKey, input: unknown, opts: { publish: boolean }): Promise<Result<{ id: number }>> {
  assertCan(actor.role, "content.write");
  const parsed = collectionSchema(c).safeParse(input);
  if (!parsed.success) return invalid(issuesToErrors(parsed.error));
  const t = table(c);
  const db = getDb();
  const [{ max }] = await db.select({ max: sql<number>`coalesce(max(${t.sortOrder}), -1)::int` }).from(t);
  try {
    const [row] = await db
      .insert(t)
      .values({ ...liveColumns(c, parsed.data), sortOrder: max + 1, published: opts.publish, draft: null, updatedBy: actor.userId } as never)
      .returning({ id: t.id });
    await writeAudit({
      action: opts.publish ? "content.item.created_published" : "content.item.created",
      entity: c,
      entityId: row.id,
      actorUserId: actor.userId,
      ip: actor.ip,
      data: { title: parsed.data[COLLECTION_DEFS[c].titleField] },
    });
    return { ok: true, id: row.id };
  } catch (e) {
    if (uniqueViolation(e)) return invalid(uniqueFieldError(c), "That value is already in use.");
    throw e;
  }
}

/** Save edits as a draft, or publish them (copies to the live columns and makes it public). */
export async function saveItem(actor: Actor, c: CollectionKey, id: number, input: unknown, opts: { publish: boolean }): Promise<Result> {
  assertCan(actor.role, "content.write");
  const parsed = collectionSchema(c).safeParse(input);
  if (!parsed.success) return invalid(issuesToErrors(parsed.error));
  const t = table(c);
  try {
    const updated = await getDb()
      .update(t)
      .set(
        opts.publish
          ? ({ ...liveColumns(c, parsed.data), published: true, draft: null, updatedBy: actor.userId } as never)
          : ({ draft: parsed.data, updatedBy: actor.userId } as never),
      )
      .where(eq(t.id, id))
      .returning({ id: t.id });
    if (!updated.length) return invalid({ _: "Not found." }, "This item no longer exists.");
  } catch (e) {
    if (uniqueViolation(e)) return invalid(uniqueFieldError(c), "That value is already in use.");
    throw e;
  }
  await writeAudit({
    action: opts.publish ? "content.item.published" : "content.item.draft_saved",
    entity: c,
    entityId: id,
    actorUserId: actor.userId,
    ip: actor.ip,
    data: { title: parsed.data[COLLECTION_DEFS[c].titleField] },
  });
  return { ok: true };
}

export async function setItemPublished(actor: Actor, c: CollectionKey, id: number, published: boolean): Promise<Result> {
  assertCan(actor.role, "content.write");
  const t = table(c);
  const rows = await getDb().update(t).set({ published, updatedBy: actor.userId }).where(eq(t.id, id)).returning({ id: t.id });
  if (!rows.length) return invalid({ _: "Not found." }, "This item no longer exists.");
  await writeAudit({ action: published ? "content.item.published" : "content.item.unpublished", entity: c, entityId: id, actorUserId: actor.userId, ip: actor.ip });
  return { ok: true };
}

export async function discardItemDraft(actor: Actor, c: CollectionKey, id: number): Promise<Result> {
  assertCan(actor.role, "content.write");
  const t = table(c);
  await getDb().update(t).set({ draft: null, updatedBy: actor.userId }).where(eq(t.id, id));
  await writeAudit({ action: "content.item.draft_discarded", entity: c, entityId: id, actorUserId: actor.userId, ip: actor.ip });
  return { ok: true };
}

export async function deleteItem(actor: Actor, c: CollectionKey, id: number): Promise<Result> {
  assertCan(actor.role, "content.write");
  const t = table(c);
  const rows = await getDb().delete(t).where(eq(t.id, id)).returning({ id: t.id });
  if (!rows.length) return invalid({ _: "Not found." }, "This item no longer exists.");
  await writeAudit({ action: "content.item.deleted", entity: c, entityId: id, actorUserId: actor.userId, ip: actor.ip });
  return { ok: true };
}

/** Swap an item with its neighbour (up = earlier in the list). */
export async function moveItem(actor: Actor, c: CollectionKey, id: number, direction: "up" | "down"): Promise<Result> {
  assertCan(actor.role, "content.write");
  const t = table(c);
  const db = getDb();
  const [row] = await db.select({ id: t.id, sortOrder: t.sortOrder }).from(t).where(eq(t.id, id));
  if (!row) return invalid({ _: "Not found." }, "This item no longer exists.");
  const [neighbour] = await db
    .select({ id: t.id, sortOrder: t.sortOrder })
    .from(t)
    .where(direction === "up" ? lt(t.sortOrder, row.sortOrder) : gt(t.sortOrder, row.sortOrder))
    .orderBy(direction === "up" ? desc(t.sortOrder) : asc(t.sortOrder))
    .limit(1);
  if (!neighbour) return { ok: true }; // already first/last
  await db.update(t).set({ sortOrder: neighbour.sortOrder }).where(eq(t.id, row.id));
  await db.update(t).set({ sortOrder: row.sortOrder }).where(and(eq(t.id, neighbour.id)));
  await writeAudit({ action: "content.item.reordered", entity: c, entityId: id, actorUserId: actor.userId, ip: actor.ip, data: { direction } });
  return { ok: true };
}
