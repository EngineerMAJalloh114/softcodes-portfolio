import type { AuditRow } from "@/lib/admin/audit-log";

const fmt = new Intl.DateTimeFormat("en-GB", {
  dateStyle: "medium",
  timeStyle: "medium",
  timeZone: "UTC",
});

function summary(data: unknown): string {
  if (!data || typeof data !== "object") return "";
  const d = data as Record<string, unknown>;
  if (d.changes && typeof d.changes === "object") return `changed: ${Object.keys(d.changes as object).join(", ") || "nothing"}`;
  return Object.entries(d)
    .slice(0, 3)
    .map(([k, v]) => `${k}: ${typeof v === "object" ? JSON.stringify(v) : String(v)}`)
    .join(" · ");
}

const actorLabel = (r: AuditRow) => r.actorEmail ?? (r.actorUserId ? "deleted user" : "system");

/** Read-only audit table (G-01 dashboard, G-19 viewer). Times shown in UTC. Cards below md. */
export function AuditTable({ rows }: { rows: AuditRow[] }) {
  return (
    <>
    <ul className="divide-y divide-border/60 md:hidden">
      {rows.map((r) => (
        <li key={r.id} className="py-3 text-sm">
          <p className="font-semibold text-text">
            <code className="break-all">{r.action}</code>
          </p>
          <p className="mt-1 text-muted tabular-nums">{fmt.format(new Date(r.at))} UTC</p>
          <p className="mt-1 break-all text-text">{actorLabel(r)}</p>
          {(summary(r.data) || r.ip) && (
            <p className="mt-1 break-all text-xs text-muted">
              {summary(r.data)}
              {r.ip ? `${summary(r.data) ? " · " : ""}IP ${r.ip}` : ""}
            </p>
          )}
        </li>
      ))}
    </ul>
    <div className="hidden overflow-x-auto md:block">
      <table className="w-full min-w-[640px] text-left text-sm">
        <caption className="sr-only">Audit events, newest first</caption>
        <thead>
          <tr className="border-b border-border text-xs uppercase tracking-[0.15em] text-muted">
            <th scope="col" className="py-3 pr-4 font-semibold">When (UTC)</th>
            <th scope="col" className="py-3 pr-4 font-semibold">Action</th>
            <th scope="col" className="py-3 pr-4 font-semibold">Actor</th>
            <th scope="col" className="py-3 pr-4 font-semibold">Details</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-b border-border/60 align-top last:border-0">
              <td className="whitespace-nowrap py-3 pr-4 text-muted tabular-nums">{fmt.format(new Date(r.at))}</td>
              <td className="py-3 pr-4 font-semibold text-text">
                <code>{r.action}</code>
              </td>
              <td className="py-3 pr-4 text-text">
                {r.actorEmail ?? <span className="text-muted">{actorLabel(r)}</span>}
              </td>
              <td className="py-3 pr-4 text-muted">
                <span className="line-clamp-2 break-all">{summary(r.data)}</span>
                {r.ip && <span className="block text-xs">IP {r.ip}</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    </>
  );
}
