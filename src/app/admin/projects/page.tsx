import type { Metadata } from "next";
import { ComingSoon } from "@/components/admin/ui";
import { requirePermission } from "@/lib/auth/guard";

export const metadata: Metadata = { title: "Projects" };

export default async function ProjectsPage() {
  await requirePermission("projects.manage");
  return <ComingSoon title="Projects" release="T5" body="Add, edit and publish projects and case studies." />;
}
