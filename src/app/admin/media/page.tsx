import type { Metadata } from "next";
import { ComingSoon } from "@/components/admin/ui";
import { requirePermission } from "@/lib/auth/guard";

export const metadata: Metadata = { title: "Media" };

export default async function MediaPage() {
  await requirePermission("media.manage");
  return <ComingSoon title="Media" release="T5" body="Upload and manage images and files." />;
}
