import "server-only";
import { randomUUID } from "node:crypto";
import { desc, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { getDb, schema } from "@/db";
import { writeAudit } from "@/lib/audit";
import { assertCan } from "@/lib/auth/permissions";
import { publicUrl, remove, signedUrl, upload, type Visibility } from "@/lib/storage";
import type { Actor, Result } from "./admin";
import { checkUpload, mediaKey, sanitizeFilename } from "./media-rules";

/**
 * Media library (M-09) on Neon object storage (DEC-32). Public images go to the public
 * bucket (served via next/image); everything else defaults to the private bucket and is
 * shown to admins through short-lived signed URLs. Every change is audited (K-16).
 */

export type MediaItem = {
  id: string;
  ref: string; // media:<id>, the value stored in content
  key: string;
  visibility: Visibility;
  mime: string;
  kind: "image" | "document";
  size: number;
  alt: string;
  filename: string;
  url: string;
  createdAt: Date;
};

const altSchema = z.string().trim().max(300, "Alt text: at most 300 characters.");
const visibilitySchema = z.enum(["public", "private"]);
const PUBLIC_CACHE = "public, max-age=31536000, immutable"; // keys are unique per upload

const kindOf = (mime: string) => (mime.startsWith("image/") ? "image" : "document") as MediaItem["kind"];

async function toItem(row: typeof schema.media.$inferSelect): Promise<MediaItem> {
  const visibility = row.visibility as Visibility;
  return {
    id: row.id,
    ref: `media:${row.id}`,
    key: row.key,
    visibility,
    mime: row.mime,
    kind: kindOf(row.mime),
    size: row.size,
    alt: row.alt ?? "",
    filename: row.filename ?? row.key.split("/").pop() ?? row.key,
    url: visibility === "public" ? publicUrl(row.key) : await signedUrl(row.key, 600),
    createdAt: row.createdAt,
  };
}

export async function listMedia(opts: { kind?: "image"; visibility?: Visibility } = {}): Promise<MediaItem[]> {
  const rows = await getDb().select().from(schema.media).orderBy(desc(schema.media.createdAt));
  const filtered = rows.filter(
    (r) => (!opts.kind || kindOf(r.mime) === opts.kind) && (!opts.visibility || r.visibility === opts.visibility),
  );
  return Promise.all(filtered.map(toItem));
}

export async function getMedia(id: string): Promise<MediaItem | null> {
  if (!z.uuid().safeParse(id).success) return null;
  const [row] = await getDb().select().from(schema.media).where(eq(schema.media.id, id));
  return row ? toItem(row) : null;
}

async function readFile(file: unknown) {
  if (!(file instanceof File) || file.size === 0) return { error: "Choose a file to upload." } as const;
  const bytes = new Uint8Array(await file.arrayBuffer());
  return { bytes, name: file.name, type: file.type } as const;
}

export async function uploadMedia(
  actor: Actor,
  input: { file: unknown; visibility?: unknown; alt?: unknown },
): Promise<Result<{ item: MediaItem }>> {
  assertCan(actor.role, "media.manage");
  const f = await readFile(input.file);
  if ("error" in f) return { ok: false, errors: { file: f.error! }, message: f.error! };
  const check = checkUpload(f.bytes, f.type);
  if (!check.ok) return { ok: false, errors: { file: check.error }, message: check.error };
  const alt = altSchema.safeParse(input.alt ?? "");
  if (!alt.success) return { ok: false, errors: { alt: alt.error.issues[0].message }, message: alt.error.issues[0].message };
  // Default: images public (site images), documents private.
  const vis = visibilitySchema.safeParse(input.visibility || (check.kind === "image" ? "public" : "private"));
  if (!vis.success) return { ok: false, errors: { visibility: "Choose public or private." }, message: "Choose public or private." };

  const id = randomUUID();
  const filename = `${sanitizeFilename(f.name)}.${check.ext}`;
  const key = mediaKey(f.name, check.ext, id);
  await upload({
    key,
    body: f.bytes,
    contentType: check.mime,
    visibility: vis.data,
    ...(vis.data === "public" ? { cacheControl: PUBLIC_CACHE } : {}),
  });
  const [row] = await getDb()
    .insert(schema.media)
    .values({ id, key, visibility: vis.data, mime: check.mime, size: f.bytes.byteLength, alt: alt.data, filename, createdBy: actor.userId })
    .returning();
  await writeAudit({
    action: "media.uploaded",
    entity: "media",
    entityId: id,
    actorUserId: actor.userId,
    ip: actor.ip,
    data: { filename, mime: check.mime, size: f.bytes.byteLength, visibility: vis.data },
  });
  return { ok: true, item: await toItem(row) };
}

/** Replace the file behind a media item (same id, so every reference picks it up). */
export async function replaceMedia(actor: Actor, id: string, file: unknown): Promise<Result<{ item: MediaItem }>> {
  assertCan(actor.role, "media.manage");
  const current = await getMedia(id);
  if (!current) return { ok: false, errors: { _: "Not found." }, message: "This file no longer exists." };
  const f = await readFile(file);
  if ("error" in f) return { ok: false, errors: { file: f.error! }, message: f.error! };
  const check = checkUpload(f.bytes, f.type);
  if (!check.ok) return { ok: false, errors: { file: check.error }, message: check.error };
  if (check.kind !== current.kind) {
    const message = `Replace a ${current.kind} with another ${current.kind}.`;
    return { ok: false, errors: { file: message }, message };
  }
  const filename = `${sanitizeFilename(f.name)}.${check.ext}`;
  const key = mediaKey(f.name, check.ext, id); // new key → caches never serve the old file
  await upload({
    key,
    body: f.bytes,
    contentType: check.mime,
    visibility: current.visibility,
    ...(current.visibility === "public" ? { cacheControl: PUBLIC_CACHE } : {}),
  });
  const [row] = await getDb()
    .update(schema.media)
    .set({ key, mime: check.mime, size: f.bytes.byteLength, filename, updatedAt: new Date() })
    .where(eq(schema.media.id, id))
    .returning();
  await remove(current.key, current.visibility).catch(() => undefined); // old object; the row already points to the new one
  await writeAudit({
    action: "media.replaced",
    entity: "media",
    entityId: id,
    actorUserId: actor.userId,
    ip: actor.ip,
    data: { filename, mime: check.mime, size: f.bytes.byteLength, previous: current.filename },
  });
  return { ok: true, item: await toItem(row) };
}

export async function updateAlt(actor: Actor, id: string, alt: unknown): Promise<Result> {
  assertCan(actor.role, "media.manage");
  const parsed = altSchema.safeParse(alt);
  if (!parsed.success) return { ok: false, errors: { alt: parsed.error.issues[0].message }, message: parsed.error.issues[0].message };
  const rows = await getDb().update(schema.media).set({ alt: parsed.data, updatedAt: new Date() }).where(eq(schema.media.id, id)).returning({ id: schema.media.id });
  if (!rows.length) return { ok: false, errors: { _: "Not found." }, message: "This file no longer exists." };
  await writeAudit({ action: "media.alt_updated", entity: "media", entityId: id, actorUserId: actor.userId, ip: actor.ip, data: { alt: parsed.data } });
  return { ok: true };
}

/** Where a media item is used (published or draft content). */
export async function findReferences(id: string): Promise<string[]> {
  const ref = `%media:${id}%`;
  const db = getDb();
  const [sections, projects] = await Promise.all([
    db
      .select({ key: schema.contentSections.key })
      .from(schema.contentSections)
      .where(sql`${schema.contentSections.data}::text like ${ref} or coalesce(${schema.contentSections.draft}::text, '') like ${ref}`),
    db
      .select({ name: schema.projects.name })
      .from(schema.projects)
      .where(sql`${schema.projects.screenshots}::text like ${ref} or coalesce(${schema.projects.draft}::text, '') like ${ref}`),
  ]);
  return [...sections.map((s) => `section "${s.key}"`), ...projects.map((p) => `project "${p.name}"`)];
}

export async function deleteMedia(actor: Actor, id: string): Promise<Result> {
  assertCan(actor.role, "media.manage");
  const current = await getMedia(id);
  if (!current) return { ok: false, errors: { _: "Not found." }, message: "This file no longer exists." };
  const usedBy = await findReferences(id);
  if (usedBy.length) {
    const message = `Still used by ${usedBy.join(", ")}. Remove it there first.`;
    return { ok: false, errors: { _: message }, message };
  }
  await remove(current.key, current.visibility);
  await getDb().delete(schema.media).where(eq(schema.media.id, id));
  await writeAudit({
    action: "media.deleted",
    entity: "media",
    entityId: id,
    actorUserId: actor.userId,
    ip: actor.ip,
    data: { filename: current.filename, visibility: current.visibility },
  });
  return { ok: true };
}

/** Thumbnail URLs for every media:<id> reference inside a content value (admin editors). */
export async function previewsFor(value: unknown): Promise<Record<string, string>> {
  const refs = new Set<string>();
  const walk = (v: unknown) => {
    if (typeof v === "string" && v.startsWith("media:")) refs.add(v);
    else if (Array.isArray(v)) v.forEach(walk);
    else if (v && typeof v === "object") Object.values(v).forEach(walk);
  };
  walk(value);
  const out: Record<string, string> = {};
  for (const ref of refs) {
    const item = await getMedia(ref.slice("media:".length));
    if (item) out[ref] = item.url;
  }
  return out;
}
