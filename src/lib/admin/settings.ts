import "server-only";
import { eq, inArray, sql } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { assertCan, type Role } from "@/lib/auth/permissions";
import { DEFAULT_SETTINGS, SETTING_KEYS, settingsSchema, type Settings } from "./settings-schema";

const KEYS = Object.values(SETTING_KEYS);

/** Current settings, falling back to defaults for anything not saved yet. */
export async function getSettings(): Promise<Settings> {
  const rows = await getDb()
    .select({ key: schema.settings.key, value: schema.settings.value })
    .from(schema.settings)
    .where(inArray(schema.settings.key, KEYS));
  const byKey = new Map(rows.map((r) => [r.key, r.value]));
  const contact = (byKey.get(SETTING_KEYS.contact) ?? {}) as Partial<
    Pick<Settings, "contactEmail" | "whatsapp" | "location">
  >;
  const merged = {
    contactEmail: contact.contactEmail ?? DEFAULT_SETTINGS.contactEmail,
    whatsapp: contact.whatsapp ?? DEFAULT_SETTINGS.whatsapp,
    location: contact.location ?? DEFAULT_SETTINGS.location,
    depositPercent: byKey.get(SETTING_KEYS.depositPercent) ?? DEFAULT_SETTINGS.depositPercent,
    currencies: byKey.get(SETTING_KEYS.currencies) ?? DEFAULT_SETTINGS.currencies,
    whatsappButton: byKey.get(SETTING_KEYS.whatsappButton) ?? DEFAULT_SETTINGS.whatsappButton,
    // Stored as { mediaId } (settings.value is NOT NULL, and "no CV" is a valid choice).
    cvMediaId: (byKey.get(SETTING_KEYS.cvMediaId) as { mediaId?: string | null } | undefined)?.mediaId ?? DEFAULT_SETTINGS.cvMediaId,
  };
  const parsed = settingsSchema.safeParse(merged);
  return parsed.success ? parsed.data : DEFAULT_SETTINGS;
}

export type SaveSettingsResult =
  | { ok: true; changed: string[] }
  | { ok: false; fieldErrors: Record<string, string[]> };

/**
 * Validate (K-15), authorise (K-05, deny by default), save, and audit (K-16).
 * Every save writes one audit row with the before/after of each changed field.
 */
export async function saveSettings(
  actor: { userId: string; role: Role },
  input: unknown,
  meta: { ip?: string | null } = {},
): Promise<SaveSettingsResult> {
  assertCan(actor.role, "settings.write");

  const parsed = settingsSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]> };
  }
  const next = parsed.data;
  const db = getDb();
  if (next.cvMediaId) {
    // The CV must be a public PDF (visitors download it without signing in).
    const [file] = await db
      .select({ mime: schema.media.mime, visibility: schema.media.visibility })
      .from(schema.media)
      .where(eq(schema.media.id, next.cvMediaId));
    if (!file || file.mime !== "application/pdf" || file.visibility !== "public") {
      return { ok: false, fieldErrors: { cvMediaId: ["Choose a public PDF from the media library."] } };
    }
  }
  const prev = await getSettings();

  const changes: Record<string, { from: unknown; to: unknown }> = {};
  for (const k of Object.keys(next) as (keyof Settings)[]) {
    if (JSON.stringify(prev[k]) !== JSON.stringify(next[k])) changes[k] = { from: prev[k], to: next[k] };
  }

  const rows = [
    {
      key: SETTING_KEYS.contact,
      value: { contactEmail: next.contactEmail, whatsapp: next.whatsapp, location: next.location },
    },
    { key: SETTING_KEYS.depositPercent, value: next.depositPercent },
    { key: SETTING_KEYS.currencies, value: next.currencies },
    { key: SETTING_KEYS.whatsappButton, value: next.whatsappButton },
    { key: SETTING_KEYS.cvMediaId, value: { mediaId: next.cvMediaId } },
  ];
  await db
    .insert(schema.settings)
    .values(rows.map((r) => ({ ...r, updatedBy: actor.userId })))
    .onConflictDoUpdate({
      target: schema.settings.key,
      set: { value: sql`excluded.value`, updatedBy: actor.userId, updatedAt: sql`now()` },
    });

  await db.insert(schema.auditLog).values({
    action: "settings.updated",
    entity: "settings",
    entityId: null,
    actorUserId: actor.userId,
    data: { changes },
    ip: meta.ip ?? null,
  });

  return { ok: true, changed: Object.keys(changes) };
}
