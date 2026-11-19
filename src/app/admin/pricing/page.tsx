import type { Metadata } from "next";
import { ComingSoon } from "@/components/admin/ui";
import { requirePermission } from "@/lib/auth/guard";

export const metadata: Metadata = { title: "Pricing" };

export default async function PricingPage() {
  await requirePermission("pricing.manage");
  return <ComingSoon title="Pricing" release="T6" body="Manage 'from' prices in USD and SLE." />;
}
