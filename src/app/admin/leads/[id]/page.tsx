import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, PageHeader } from "@/components/admin/ui";
import { requirePermission } from "@/lib/auth/guard";
import { can } from "@/lib/auth/permissions";
import { LEAD_STATUS_LABELS, budgetLabel, sourceLabel, type LeadStatus } from "@/lib/leads/schema";
import { getLead, projectTypeOptions } from "@/lib/leads/service";
import { LeadActions } from "./LeadActions";

export const metadata: Metadata = { title: "Lead" };

const dateFmt = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "UTC" });

function describe(action: string, data: unknown): string {
  const d = (data ?? {}) as Record<string, unknown>;
  if (action === "lead.created") return "Received from the website form";
  if (action === "lead.status_changed")
    return `Status: ${LEAD_STATUS_LABELS[d.from as LeadStatus] ?? d.from} → ${LEAD_STATUS_LABELS[d.to as LeadStatus] ?? d.to}`;
  if (action === "lead.note_added") return "Note added";
  return action;
}

/** Lead detail (T7a). Read: leads.read; status and notes: leads.write. Opening marks it read. */
export default async function LeadPage({ params }: PageProps<"/admin/leads/[id]">) {
  const { user, role } = await requirePermission("leads.read");
  const { id } = await params;
  const [data, types] = await Promise.all([getLead({ userId: user.id, role }, id), projectTypeOptions()]);
  if (!data) notFound();
  const { lead, notes, history } = data;
  const typeName = lead.projectType ? (types.find((t) => t.slug === lead.projectType)?.name ?? "Other") : "—";
  const rows: [string, React.ReactNode][] = [
    ["Email", <a key="e" href={`mailto:${lead.email}?subject=${encodeURIComponent(`Your quote request ${lead.reference}`)}`} className="font-semibold text-text underline">{lead.email}</a>],
    ["Phone / WhatsApp", lead.phone ?? "—"],
    ["Company", lead.company ?? "—"],
    ["Project type", typeName],
    ["Budget", budgetLabel(lead.budget, lead.budgetCurrency)],
    ["Deadline", lead.deadline ?? "—"],
    ["Found us via", sourceLabel(lead.source)],
    ["Received", `${dateFmt.format(lead.createdAt)} UTC`],
  ];

  return (
    <>
      <Link href="/admin/leads" className="mb-4 inline-flex text-sm font-semibold text-muted hover:text-text">
        ← All leads
      </Link>
      <PageHeader
        title={lead.name}
        intro={
          <span className="font-mono" data-lead-reference>
            {lead.reference}
          </span>
        }
        actions={
          <span data-lead-status={lead.status} className="rounded-full border border-border px-3 py-1 text-xs font-semibold uppercase tracking-wider text-text">
            {LEAD_STATUS_LABELS[lead.status]}
          </span>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-6">
          <Card>
            <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">Project details</h2>
            <p className="mt-4 whitespace-pre-wrap leading-relaxed text-text">{lead.message}</p>
          </Card>
          <Card>
            <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
              {rows.map(([k, v]) => (
                <div key={k}>
                  <dt className="text-xs font-semibold uppercase tracking-[0.15em] text-muted">{k}</dt>
                  <dd className="mt-1 break-words text-text">{v}</dd>
                </div>
              ))}
            </dl>
          </Card>
        </div>

        <div className="space-y-6">
          <LeadActions id={lead.id} status={lead.status} canWrite={can(role, "leads.write")} />

          <Card>
            <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">Internal notes</h2>
            {notes.length ? (
              <ul className="mt-4 space-y-4" data-lead-notes>
                {notes.map((n) => (
                  <li key={n.id} className="rounded-xl border border-border p-4">
                    <p className="whitespace-pre-wrap text-sm text-text">{n.body}</p>
                    <p className="mt-2 text-xs text-muted">
                      {n.author ?? "Deleted user"} · {dateFmt.format(n.createdAt)} UTC
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 text-sm text-muted">No notes yet. Notes are only visible to the team.</p>
            )}
          </Card>

          <Card>
            <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">History</h2>
            <ol className="mt-4 space-y-3 text-sm">
              {history.map((h, i) => (
                <li key={i}>
                  <span className="text-text">{describe(h.action, h.data)}</span>
                  <span className="block text-xs text-muted">
                    {h.actor ?? "Website"} · {dateFmt.format(h.at)} UTC
                  </span>
                </li>
              ))}
            </ol>
          </Card>
        </div>
      </div>
    </>
  );
}
