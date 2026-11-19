import type { Metadata } from "next";
import { ComingSoon } from "@/components/admin/ui";
import { requirePermission } from "@/lib/auth/guard";

export const metadata: Metadata = { title: "Content" };

export default async function ContentPage() {
  await requirePermission("content.manage");
  return <ComingSoon title="Content" release="T5" body="Edit every public section of the site here." />;
}
