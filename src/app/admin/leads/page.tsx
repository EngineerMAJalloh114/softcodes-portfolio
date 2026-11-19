import type { Metadata } from "next";
import { ComingSoon } from "@/components/admin/ui";
import { requirePermission } from "@/lib/auth/guard";

export const metadata: Metadata = { title: "Leads" };

export default async function LeadsPage() {
  await requirePermission("leads.view");
  return <ComingSoon title="Leads" release="T7" body="Quote requests and enquiries will arrive here." />;
}
