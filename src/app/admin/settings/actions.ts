"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { saveSettings } from "@/lib/admin/settings";
import { clientIp } from "@/lib/auth/audit";
import { requirePermission } from "@/lib/auth/guard";

export type SettingsFormState = {
  status: "idle" | "saved" | "error";
  message?: string;
  fieldErrors?: Record<string, string[]>;
  changed?: string[];
};

/** G-20: save settings. Server-side permission check, Zod validation, audit row. */
export async function saveSettingsAction(_prev: SettingsFormState, formData: FormData): Promise<SettingsFormState> {
  const { user, role } = await requirePermission("settings.write");
  const input = {
    contactEmail: formData.get("contactEmail"),
    whatsapp: formData.get("whatsapp"),
    location: formData.get("location"),
    depositPercent: formData.get("depositPercent"),
    currencies: formData.getAll("currencies"),
  };
  const result = await saveSettings({ userId: user.id, role }, input, { ip: clientIp(await headers()) });
  if (!result.ok) return { status: "error", message: "Please fix the highlighted fields.", fieldErrors: result.fieldErrors };
  revalidatePath("/admin/settings");
  revalidatePath("/admin");
  return {
    status: "saved",
    changed: result.changed,
    message: result.changed.length ? `Saved: ${result.changed.join(", ")}.` : "Saved (no changes).",
  };
}
