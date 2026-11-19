"use server";

import { revalidatePath, updateTag } from "next/cache";
import { headers } from "next/headers";
import { z } from "zod";
import { clientIp } from "@/lib/auth/audit";
import { requirePermission } from "@/lib/auth/guard";
import type { Actor } from "@/lib/content/admin";
import { CONTENT_TAG } from "@/lib/content/load";
import * as media from "@/lib/content/media";

/** Media library actions (M-09): media.manage (owner, admin), audited (K-16). */

async function actor(permission: "media.manage" | "content.write" = "media.manage"): Promise<Actor> {
  const { user, role } = await requirePermission(permission);
  return { userId: user.id, role, ip: clientIp(await headers()) };
}

function refresh() {
  updateTag(CONTENT_TAG); // replaced/deleted images change public pages
  revalidatePath("/admin/media");
}

const id = z.uuid();
const badRequest = { ok: false as const, errors: { _: "Invalid request." }, message: "Invalid request." };
const serialise = <T extends { ok: boolean }>(r: T) => JSON.parse(JSON.stringify(r)) as T;

export async function uploadMediaAction(formData: FormData) {
  const a = await actor();
  const result = await media.uploadMedia(a, {
    file: formData.get("file"),
    visibility: formData.get("visibility") ?? undefined,
    alt: formData.get("alt") ?? "",
  });
  if (result.ok) refresh();
  return serialise(result);
}

export async function replaceMediaAction(formData: FormData) {
  const a = await actor();
  const i = id.safeParse(formData.get("id"));
  if (!i.success) return badRequest;
  const result = await media.replaceMedia(a, i.data, formData.get("file"));
  if (result.ok) refresh();
  return serialise(result);
}

export async function updateAltAction(mediaId: string, alt: string) {
  const a = await actor();
  const i = id.safeParse(mediaId);
  if (!i.success) return badRequest;
  const result = await media.updateAlt(a, i.data, alt);
  if (result.ok) refresh();
  return result;
}

export async function deleteMediaAction(mediaId: string) {
  const a = await actor();
  const i = id.safeParse(mediaId);
  if (!i.success) return badRequest;
  const result = await media.deleteMedia(a, i.data);
  if (result.ok) refresh();
  return result;
}

/** Public images for the picker in content forms (needs content.write). */
export async function listPickerImagesAction() {
  await actor("content.write");
  const items = await media.listMedia({ kind: "image", visibility: "public" });
  return items.map((m) => ({ ref: m.ref, url: m.url, alt: m.alt, filename: m.filename }));
}
