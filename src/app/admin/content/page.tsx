import type { Metadata } from "next";
import Link from "next/link";
import { StatusPill } from "@/components/admin/ContentEditor";
import { Card, PageHeader } from "@/components/admin/ui";
import { requirePermission } from "@/lib/auth/guard";
import { listCollection, listSections } from "@/lib/content/admin";
import { COLLECTION_DEFS } from "@/lib/content/defs";

export const metadata: Metadata = { title: "Content" };

const fmt = new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" });

/** A-15 / G-14: every public section and list, with draft status. */
export default async function ContentPage() {
  await requirePermission("content.write");
  const [sections, services, stack, faqs, packages, testimonials] = await Promise.all([
    listSections(),
    listCollection("services"),
    listCollection("stack"),
    listCollection("faqs"),
    listCollection("packages"),
    listCollection("testimonials"),
  ]);
  const lists = [
    { def: COLLECTION_DEFS.services, rows: services },
    { def: COLLECTION_DEFS.stack, rows: stack },
    { def: COLLECTION_DEFS.faqs, rows: faqs },
    { def: COLLECTION_DEFS.testimonials, rows: testimonials },
    { def: COLLECTION_DEFS.packages, rows: packages },
  ];
  return (
    <>
      <PageHeader
        title="Content"
        intro="Edit every section of the public site. Save a draft to preview it privately; publish to make it live — no redeploy needed. Contact email, WhatsApp and location live in Settings."
      />
      <h2 className="mb-3 text-lg font-extrabold text-text">Sections</h2>
      <Card className="mb-10 p-0 sm:p-0">
        <ul className="divide-y divide-border/70">
          {sections.map((s) => (
            <li key={s.key} className="flex flex-wrap items-center gap-3 px-6 py-4">
              <div className="min-w-0 flex-1">
                <Link href={`/admin/content/sections/${s.key}`} className="font-semibold text-text hover:underline">
                  {s.label}
                </Link>
                <p className="mt-0.5 text-sm text-muted">{s.description}</p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <StatusPill published hasDraft={s.hasDraft} />
                {s.updatedAt && <span className="text-xs text-muted">Updated {fmt.format(s.updatedAt)} UTC</span>}
              </div>
            </li>
          ))}
        </ul>
      </Card>
      <h2 className="mb-3 text-lg font-extrabold text-text">Lists</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        {lists.map(({ def, rows }) => (
          <Link key={def.key} href={def.adminPath} className="glow block rounded-2xl border border-border bg-surface p-6">
            <p className="text-lg font-extrabold text-text">{def.label}</p>
            <p className="mt-1 text-sm text-muted">{def.description}</p>
            <p className="mt-3 text-sm font-semibold text-text">
              {rows.filter((r) => r.published).length} published · {rows.filter((r) => !r.published).length} draft
              {rows.some((r) => r.hasDraft) ? " · unpublished changes" : ""}
            </p>
          </Link>
        ))}
        <Link href="/admin/projects" className="glow block rounded-2xl border border-border bg-surface p-6">
          <p className="text-lg font-extrabold text-text">Projects</p>
          <p className="mt-1 text-sm text-muted">{COLLECTION_DEFS.projects.description}</p>
        </Link>
      </div>
    </>
  );
}
