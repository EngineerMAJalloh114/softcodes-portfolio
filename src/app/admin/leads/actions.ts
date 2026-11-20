"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { z } from "zod";
import { clientIp } from "@/lib/auth/audit";
import { requirePermission } from "@/lib/auth/guard";
import { addLeadNote, setLeadStatus, type ChangeResult } from "@/lib/leads/service";

/**
 * Leads inbox actions (T7a). Permission leads.write (owner, admin, staff — DEC-36) is
 * checked first (403 otherwise); arguments are validated (K-15); changes are audited (K-16).
 */

const leadId = z.uuid();

async function actor() {
  const { user, role } = await requirePermission("leads.write");
  return { userId: user.id, role, ip: clientIp(await headers()) };
}

export async function setLeadStatusAction(id: unknown, status: unknown): Promise<ChangeResult> {
  const a = await actor();
  const parsed = leadId.safeParse(id);
  if (!parsed.success) return { ok: false, message: "Unknown lead." };
  const result = await setLeadStatus(a, parsed.data, status);
  if (result.ok) revalidatePath("/admin", "layout");
  return result;
}

export async function addLeadNoteAction(id: unknown, body: unknown): Promise<ChangeResult> {
  const a = await actor();
  const parsed = leadId.safeParse(id);
  if (!parsed.success) return { ok: false, message: "Unknown lead." };
  const result = await addLeadNote(a, parsed.data, body);
  if (result.ok) revalidatePath(`/admin/leads/${parsed.data}`);
  return result;
}
