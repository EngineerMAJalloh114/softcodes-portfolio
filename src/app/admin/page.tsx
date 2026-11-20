import type { Metadata } from "next";
import Link from "next/link";
import { AuditTable } from "@/components/admin/AuditTable";
import { Card, EmptyState, PageHeader, StatCard } from "@/components/admin/ui";
import { queryAuditLog } from "@/lib/admin/audit-log";
import { dashboardCounts } from "@/lib/admin/dashboard";
import { requirePermission } from "@/lib/auth/guard";
import { can } from "@/lib/auth/permissions";

export const metadata: Metadata = { title: "Dashboard" };

/** G-01 Owner dashboard. */
export default async function DashboardPage() {
  const { user, role } = await requirePermission("dashboard.view");
  const showAudit = can(role, "audit.view");
  const [counts, latest] = await Promise.all([
    dashboardCounts(),
    showAudit ? queryAuditLog({ page: 1 }, 10) : Promise.resolve(null),
  ]);

  return (
    <>
      <PageHeader title="Dashboard" intro={<>Welcome back, {user.name.split(" ")[0] || user.email}.</>} />

      <section aria-label="Totals" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="New leads"
          value={counts.newLeads}
          hint={`${counts.leads.toLocaleString("en")} ${counts.leads === 1 ? "lead" : "leads"} in total`}
          href="/admin/leads?status=new"
        />
        <StatCard label="Projects" value={counts.projects} />
        <StatCard
          label="Content items"
          value={counts.contentItems}
          hint={`${counts.content.sections} sections · ${counts.content.services} services · ${counts.content.stack} stack`}
        />
        <StatCard label="Media" value={counts.media} hint={counts.media ? undefined : "Upload files in Media"} />
      </section>

      {counts.leads === 0 && (
        <Card className="mt-6">
          <EmptyState compact title="No leads yet" body="Quote requests from the contact form will show up in Leads." />
        </Card>
      )}

      {showAudit && latest && (
        <section aria-labelledby="latest-activity" className="mt-10">
          <div className="mb-4 flex items-end justify-between gap-4">
            <h2 id="latest-activity" className="text-xl font-extrabold tracking-tight text-text">
              Latest activity
            </h2>
            <Link href="/admin/audit" className="text-sm font-semibold text-muted hover:text-text">
              View full audit log →
            </Link>
          </div>
          <Card>
            {latest.rows.length ? (
              <AuditTable rows={latest.rows} />
            ) : (
              <EmptyState title="No activity yet" body="Sign-ins and changes will be listed here." />
            )}
          </Card>
        </section>
      )}
    </>
  );
}
