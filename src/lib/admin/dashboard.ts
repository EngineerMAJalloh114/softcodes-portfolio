import "server-only";
import { count, eq } from "drizzle-orm";
import { getDb, schema } from "@/db";

/** Counts for the owner dashboard (G-01). Content items = sections + services + stack items. */
export async function dashboardCounts() {
  const db = getDb();
  const total = async (table: Parameters<ReturnType<typeof db.select>["from"]>[0]) =>
    Number((await db.select({ n: count() }).from(table))[0]?.n ?? 0);
  const newLeads = async () =>
    Number((await db.select({ n: count() }).from(schema.leads).where(eq(schema.leads.status, "new")))[0]?.n ?? 0);
  const [leads, projects, sections, services, stack, media, fresh] = await Promise.all([
    total(schema.leads),
    total(schema.projects),
    total(schema.contentSections),
    total(schema.services),
    total(schema.stackItems),
    total(schema.media),
    newLeads(),
  ]);
  return { leads, newLeads: fresh, projects, media, contentItems: sections + services + stack, content: { sections, services, stack } };
}
