"use server";

import { revalidatePath, updateTag } from "next/cache";
import { headers } from "next/headers";
import { z } from "zod";
import { clientIp } from "@/lib/auth/audit";
import { requirePermission } from "@/lib/auth/guard";
import * as content from "@/lib/content/admin";
import { COLLECTION_KEYS, SECTION_KEYS } from "@/lib/content/defs";
import { CONTENT_TAG } from "@/lib/content/load";

/**
 * Content server actions (A-15, G-14). Each one: permission check (content.write, 403
 * otherwise) → argument validation (K-15) → service (validates content, audits, K-16) →
 * cache update so the public site shows the change on the next request (no redeploy).
 */

const sectionKey = z.enum(SECTION_KEYS);
const collectionKey = z.enum(COLLECTION_KEYS);
const itemId = z.number().int().positive();

async function actor(): Promise<content.Actor> {
  const { user, role } = await requirePermission("content.write");
  return { userId: user.id, role, ip: clientIp(await headers()) };
}

function refresh() {
  updateTag(CONTENT_TAG); // public pages re-render with fresh data on the next request
  revalidatePath("/admin", "layout");
}

const badRequest = { ok: false as const, errors: { _: "Invalid request." }, message: "Invalid request." };

export async function saveSectionAction(key: string, value: unknown, publish: boolean) {
  const a = await actor();
  const k = sectionKey.safeParse(key);
  if (!k.success || typeof publish !== "boolean") return badRequest;
  const result = await content.saveSection(a, k.data, value, { publish });
  if (result.ok) refresh();
  return result;
}

export async function discardSectionDraftAction(key: string) {
  const a = await actor();
  const k = sectionKey.safeParse(key);
  if (!k.success) return badRequest;
  const result = await content.discardSectionDraft(a, k.data);
  if (result.ok) refresh();
  return result;
}

export async function createItemAction(collection: string, value: unknown, publish: boolean) {
  const a = await actor();
  const c = collectionKey.safeParse(collection);
  if (!c.success || typeof publish !== "boolean") return badRequest;
  const result = await content.createItem(a, c.data, value, { publish });
  if (result.ok) refresh();
  return result;
}

export async function saveItemAction(collection: string, id: number, value: unknown, publish: boolean) {
  const a = await actor();
  const c = collectionKey.safeParse(collection);
  const i = itemId.safeParse(id);
  if (!c.success || !i.success || typeof publish !== "boolean") return badRequest;
  const result = await content.saveItem(a, c.data, i.data, value, { publish });
  if (result.ok) refresh();
  return result;
}

export async function setItemPublishedAction(collection: string, id: number, published: boolean) {
  const a = await actor();
  const c = collectionKey.safeParse(collection);
  const i = itemId.safeParse(id);
  if (!c.success || !i.success || typeof published !== "boolean") return badRequest;
  const result = await content.setItemPublished(a, c.data, i.data, published);
  if (result.ok) refresh();
  return result;
}

export async function discardItemDraftAction(collection: string, id: number) {
  const a = await actor();
  const c = collectionKey.safeParse(collection);
  const i = itemId.safeParse(id);
  if (!c.success || !i.success) return badRequest;
  const result = await content.discardItemDraft(a, c.data, i.data);
  if (result.ok) refresh();
  return result;
}

export async function deleteItemAction(collection: string, id: number) {
  const a = await actor();
  const c = collectionKey.safeParse(collection);
  const i = itemId.safeParse(id);
  if (!c.success || !i.success) return badRequest;
  const result = await content.deleteItem(a, c.data, i.data);
  if (result.ok) refresh();
  return result;
}

export async function moveItemAction(collection: string, id: number, direction: "up" | "down") {
  const a = await actor();
  const c = collectionKey.safeParse(collection);
  const i = itemId.safeParse(id);
  if (!c.success || !i.success || (direction !== "up" && direction !== "down")) return badRequest;
  const result = await content.moveItem(a, c.data, i.data, direction);
  if (result.ok) refresh();
  return result;
}
