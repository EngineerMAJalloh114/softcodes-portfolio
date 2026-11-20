import type { Metadata } from "next";
import Link from "next/link";
import { Card, EmptyState, PageHeader } from "@/components/admin/ui";
import { requirePermission } from "@/lib/auth/guard";
import { SUBSCRIBER_STATUSES, SUBSCRIBER_STATUS_LABELS, parseStatusFilter } from "@/lib/newsletter/schema";
import { listSubscribers } from "@/lib/newsletter/service";

export const metadata: Metadata = { title: "Subscribers" };

const dateFmt = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "UTC" });

/** M-13 newsletter subscribers (owner + admin: subscribers.manage). */
export default async function SubscribersPage({ searchParams }: PageProps<"/admin/subscribers">) {
  const { user, role } = await requirePermission("subscribers.manage");
  const sp = await searchParams;
  const status = parseStatusFilter(sp.status);
  const page = Math.max(1, Math.floor(Number(Array.isArray(sp.page) ? sp.page[0] : sp.page)) || 1);
  const result = await listSubscribers({ userId: user.id, role }, { status, page });
  const all = Object.values(result.counts).reduce((a, b) => a + b, 0);
  const chip = (active: boolean) =>
    `inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${active ? "border-text bg-btn-bg text-btn-fg" : "border-border text-muted hover:text-text"}`;
  const href = (s?: string, p = 1) => {
    const q = new URLSearchParams();
    if (s) q.set("status", s);
    if (p > 1) q.set("page", String(p));
    const str = q.toString();
    return `/admin/subscribers${str ? `?${str}` : ""}`;
  };

  return (
    <>
      <PageHeader
        title="Subscribers"
        intro="Newsletter signups. They stay “Pending” until email sending is set up (T7b); then each gets a confirmation email, and only “Confirmed” subscribers receive newsletters (DEC-43)."
        actions={
          <a
            href={`/admin/subscribers/export${status ? `?status=${status}` : ""}`}
            data-export
            className="inline-flex h-11 items-center rounded-full bg-btn-bg px-5 text-sm font-semibold text-btn-fg hover:bg-btn-bg/85"
          >
            Export CSV
          </a>
        }
      />
      <nav aria-label="Filter by status" className="mb-6 flex flex-wrap gap-2">
        <Link href={href()} className={chip(!status)}>
          All <span className="tabular-nums opacity-70">{all}</span>
        </Link>
        {SUBSCRIBER_STATUSES.map((s) => (
          <Link key={s} href={href(s)} className={chip(status === s)} data-status-filter={s}>
            {SUBSCRIBER_STATUS_LABELS[s]} <span className="tabular-nums opacity-70">{result.counts[s]}</span>
          </Link>
        ))}
      </nav>
      <Card>
        {result.rows.length ? (
          <ul className="divide-y divide-border">
            {result.rows.map((r) => (
              <li key={r.id} data-subscriber={r.email} className="grid gap-1 py-3 sm:grid-cols-[1.5fr_auto_auto] sm:items-center sm:gap-6">
                <span className="min-w-0 truncate font-semibold text-text">{r.email}</span>
                <span className="text-xs text-muted">
                  {r.source} · {dateFmt.format(r.createdAt)} UTC
                </span>
                <span className="justify-self-start rounded-full border border-border px-3 py-1 text-xs font-semibold uppercase tracking-wider text-text sm:justify-self-end">
                  {SUBSCRIBER_STATUS_LABELS[r.status]}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState title="No subscribers yet" body="Signups from the footer and the blog will appear here." />
        )}
        {result.pages > 1 && (
          <nav aria-label="Pagination" className="mt-6 flex justify-between text-sm font-semibold">
            {result.page > 1 ? <Link href={href(status, result.page - 1)}>← Newer</Link> : <span />}
            {result.page < result.pages && <Link href={href(status, result.page + 1)}>Older →</Link>}
          </nav>
        )}
      </Card>
    </>
  );
}
