import { headers } from "next/headers";
import { clientIp } from "@/lib/auth/audit";
import { checkPermission } from "@/lib/auth/guard";
import { parseStatusFilter } from "@/lib/newsletter/schema";
import { exportSubscribers } from "@/lib/newsletter/service";

/** CSV export of subscribers (subscribers.manage). Every export writes an audit row. */
export async function GET(request: Request) {
  const ctx = await checkPermission("subscribers.manage");
  if (!ctx) return new Response("Forbidden", { status: 403 });
  const status = parseStatusFilter(new URL(request.url).searchParams.get("status"));
  const { csv } = await exportSubscribers({ userId: ctx.user.id, role: ctx.role, ip: clientIp(await headers()) }, status);
  const day = new Date().toISOString().slice(0, 10);
  return new Response(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="subscribers-${status ?? "all"}-${day}.csv"`,
      "cache-control": "no-store",
    },
  });
}
