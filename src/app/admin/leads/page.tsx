import type { Metadata } from "next";
import Link from "next/link";
import { Card, EmptyState, PageHeader } from "@/components/admin/ui";
import { inputClass } from "@/components/auth/fields";
import { requirePermission } from "@/lib/auth/guard";
import { LEAD_STATUSES, LEAD_STATUS_LABELS, budgetLabel, parseLeadFilters, type LeadFilters } from "@/lib/leads/schema";
import { listLeads, projectTypeOptions } from "@/lib/leads/service";

export const metadata: Metadata = { title: "Leads" };

function hrefFor(filters: LeadFilters, overrides: Partial<LeadFilters> = {}) {
  const f = { ...filters, ...overrides };
  const q = new URLSearchParams();
  if (f.status) q.set("status", f.status);
  if (f.q) q.set("q", f.q);
  if (f.page > 1) q.set("page", String(f.page));
  const s = q.toString();
  return `/admin/leads${s ? `?${s}` : ""}`;
}

const dateFmt = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "UTC" });

/** Leads inbox (M-03, T7a): owner, admin, staff (leads.read). */
export default async function LeadsPage({ searchParams }: PageProps<"/admin/leads">) {
  const { user, role } = await requirePermission("leads.read");
  const filters = parseLeadFilters(await searchParams);
  const [result, types] = await Promise.all([listLeads({ userId: user.id, role }, filters), projectTypeOptions()]);
  const typeName = (slug: string | null) => (slug ? (types.find((t) => t.slug === slug)?.name ?? "Other") : "—");
  const filtered = Boolean(filters.status || filters.q);
  const all = Object.values(result.counts).reduce((a, b) => a + b, 0);
  const chip = (active: boolean) =>
    `inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
      active ? "border-text bg-btn-bg text-btn-fg" : "border-border text-muted hover:text-text"
    }`;

  return (
    <>
      <PageHeader
        title="Leads"
        intro="Quote requests from the contact form, newest first. Open one to read it, change its status or add internal notes."
      />

      <nav aria-label="Filter by status" className="mb-4 flex flex-wrap gap-2">
        <Link href={hrefFor(filters, { status: undefined, page: 1 })} className={chip(!filters.status)} aria-current={!filters.status ? "true" : undefined}>
          All <span className="tabular-nums opacity-70">{all}</span>
        </Link>
        {LEAD_STATUSES.map((s) => (
          <Link
            key={s}
            href={hrefFor(filters, { status: s, page: 1 })}
            className={chip(filters.status === s)}
            aria-current={filters.status === s ? "true" : undefined}
            data-status-filter={s}
          >
            {LEAD_STATUS_LABELS[s]} <span className="tabular-nums opacity-70">{result.counts[s]}</span>
          </Link>
        ))}
      </nav>

      <Card className="mb-6">
        <form method="get" className="flex flex-col gap-3 sm:flex-row sm:items-end">
          {filters.status && <input type="hidden" name="status" value={filters.status} />}
          <label className="block flex-1 text-xs font-semibold uppercase tracking-[0.15em] text-muted">
            Search
            <input name="q" defaultValue={filters.q ?? ""} placeholder="Name, email, company or reference" className={inputClass} />
          </label>
          <div className="flex gap-2">
            <button type="submit" className="inline-flex h-12 items-center rounded-full bg-btn-bg px-6 text-sm font-semibold text-btn-fg hover:bg-btn-bg/85">
              Search
            </button>
            {filtered && (
              <Link href="/admin/leads" className="inline-flex h-12 items-center rounded-full border border-border px-5 text-sm font-semibold text-text hover:border-[var(--border-hover)]">
                Clear
              </Link>
            )}
          </div>
        </form>
      </Card>

      <Card>
        <p className="mb-4 text-sm text-muted" aria-live="polite">
          {result.total.toLocaleString("en")} {result.total === 1 ? "lead" : "leads"}
          {filtered ? " match" : ""} · page {result.page} of {result.pages}
        </p>
        {result.rows.length ? (
          <ul className="divide-y divide-border">
            {result.rows.map((l) => (
              <li key={l.id} data-lead-row={l.reference}>
                <Link href={`/admin/leads/${l.id}`} className="group grid gap-1 py-4 sm:grid-cols-[1.4fr_1fr_auto] sm:items-center sm:gap-6">
                  <span className="min-w-0">
                    <span className="flex items-center gap-2">
                      {l.unread && <span className="h-2 w-2 shrink-0 rounded-full bg-text" aria-label="Unread" />}
                      <span className="truncate font-semibold text-text group-hover:underline">{l.name}</span>
                      {l.company && <span className="truncate text-sm text-muted">· {l.company}</span>}
                    </span>
                    <span className="mt-1 block font-mono text-xs text-muted">{l.reference}</span>
                  </span>
                  <span className="text-sm text-muted">
                    {typeName(l.projectType)} · {budgetLabel(l.budget, l.budgetCurrency)}
                    <span className="block text-xs">{dateFmt.format(l.createdAt)} UTC</span>
                  </span>
                  <span className="justify-self-start rounded-full border border-border px-3 py-1 text-xs font-semibold uppercase tracking-wider text-text sm:justify-self-end">
                    {LEAD_STATUS_LABELS[l.status]}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            title={filtered ? "Nothing here" : "No leads yet"}
            body={filtered ? "No leads match these filters." : "Quote requests from the contact form will arrive here."}
          />
        )}
        {result.pages > 1 && (
          <nav aria-label="Pagination" className="mt-6 flex items-center justify-between gap-4 text-sm font-semibold">
            {result.page > 1 ? (
              <Link href={hrefFor(filters, { page: result.page - 1 })} rel="prev" className="text-text hover:underline">
                ← Newer
              </Link>
            ) : (
              <span />
            )}
            {result.page < result.pages && (
              <Link href={hrefFor(filters, { page: result.page + 1 })} rel="next" className="text-text hover:underline">
                Older →
              </Link>
            )}
          </nav>
        )}
      </Card>
    </>
  );
}
