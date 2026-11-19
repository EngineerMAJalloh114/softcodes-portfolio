import type { Metadata } from "next";
import Link from "next/link";
import { AuditTable } from "@/components/admin/AuditTable";
import { Card, EmptyState, PageHeader } from "@/components/admin/ui";
import { inputClass } from "@/components/auth/fields";
import { SYSTEM_ACTOR, parseAuditFilters, type AuditFilters } from "@/lib/admin/audit-filters";
import { listAuditActions, listAuditActors, queryAuditLog } from "@/lib/admin/audit-log";
import { requirePermission } from "@/lib/auth/guard";

export const metadata: Metadata = { title: "Audit log" };

function hrefFor(filters: AuditFilters, page: number) {
  const q = new URLSearchParams();
  for (const k of ["actor", "action", "from", "to"] as const) if (filters[k]) q.set(k, filters[k]!);
  if (page > 1) q.set("page", String(page));
  const s = q.toString();
  return `/admin/audit${s ? `?${s}` : ""}`;
}

/** G-19 Audit log viewer — read-only, owner/admin only (audit.view). */
export default async function AuditLogPage({ searchParams }: PageProps<"/admin/audit">) {
  await requirePermission("audit.view");
  const filters = parseAuditFilters(await searchParams);
  const [result, actions, actors] = await Promise.all([queryAuditLog(filters), listAuditActions(), listAuditActors()]);
  const filtered = Boolean(filters.actor || filters.action || filters.from || filters.to);
  const label = "block text-xs font-semibold uppercase tracking-[0.15em] text-muted";

  return (
    <>
      <PageHeader
        title="Audit log"
        intro="Every sign-in, security event and admin change, newest first. Read-only: entries can't be edited or deleted."
      />

      <Card className="mb-6">
        <form method="get" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-[1fr_1fr_auto_auto_auto] xl:items-end">
          <label className={label}>
            Actor
            <select name="actor" defaultValue={filters.actor ?? ""} className={inputClass}>
              <option value="">Anyone</option>
              <option value={SYSTEM_ACTOR}>System / anonymous</option>
              {actors.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.email}
                </option>
              ))}
            </select>
          </label>
          <label className={label}>
            Action
            <select name="action" defaultValue={filters.action ?? ""} className={inputClass}>
              <option value="">Any action</option>
              {actions.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </label>
          <label className={label}>
            From
            <input type="date" name="from" defaultValue={filters.from ?? ""} className={inputClass} />
          </label>
          <label className={label}>
            To
            <input type="date" name="to" defaultValue={filters.to ?? ""} className={inputClass} />
          </label>
          <div className="flex gap-2 sm:col-span-2 xl:col-span-1">
            <button
              type="submit"
              className="inline-flex h-12 items-center rounded-full bg-btn-bg px-6 text-sm font-semibold text-btn-fg hover:bg-btn-bg/85"
            >
              Filter
            </button>
            {filtered && (
              <Link
                href="/admin/audit"
                className="inline-flex h-12 items-center rounded-full border border-border px-5 text-sm font-semibold text-text hover:border-[var(--border-hover)]"
              >
                Clear
              </Link>
            )}
          </div>
        </form>
      </Card>

      <Card>
        <p className="mb-4 text-sm text-muted" aria-live="polite">
          {result.total.toLocaleString("en")} {result.total === 1 ? "entry" : "entries"}
          {filtered ? " match these filters" : ""} · page {result.page} of {result.pages}
        </p>
        {result.rows.length ? (
          <AuditTable rows={result.rows} />
        ) : (
          <EmptyState title="Nothing here" body={filtered ? "No entries match these filters." : "No audit entries yet."} />
        )}
        {result.pages > 1 && (
          <nav aria-label="Pagination" className="mt-6 flex items-center justify-between gap-4 text-sm font-semibold">
            {result.page > 1 ? (
              <Link href={hrefFor(filters, result.page - 1)} rel="prev" className="text-text hover:underline">
                ← Newer
              </Link>
            ) : (
              <span />
            )}
            {result.page < result.pages && (
              <Link href={hrefFor(filters, result.page + 1)} rel="next" className="text-text hover:underline">
                Older →
              </Link>
            )}
          </nav>
        )}
      </Card>
    </>
  );
}
