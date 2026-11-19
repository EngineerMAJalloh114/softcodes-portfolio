import "server-only";
import { getDb, schema } from "@/db";

export type AuditAction =
  | "auth.sign_in"
  | "auth.sign_in_failed"
  | "auth.mfa_challenge"
  | "auth.mfa_failed"
  | "auth.mfa_enabled"
  | "auth.sign_out"
  | "auth.sign_out_everywhere"
  | "auth.password_changed"
  | "auth.password_reset_requested"
  | "auth.password_reset";

/** Append a row to the audit log (K-16). Never throws: auditing must not break auth. */
export async function audit(entry: {
  action: AuditAction;
  userId?: string | null;
  data?: Record<string, unknown>;
  ip?: string | null;
}) {
  try {
    await getDb()
      .insert(schema.auditLog)
      .values({
        action: entry.action,
        entity: "user",
        entityId: entry.userId ?? null,
        actorUserId: entry.userId ?? null,
        data: entry.data ?? null,
        ip: entry.ip ?? null,
      });
  } catch (e) {
    console.error("[audit] failed to write audit row", entry.action, e);
  }
}

export function clientIp(headers: Headers | undefined | null): string | null {
  const fwd = headers?.get("x-forwarded-for");
  return fwd ? fwd.split(",")[0].trim() : (headers?.get("x-real-ip") ?? null);
}
