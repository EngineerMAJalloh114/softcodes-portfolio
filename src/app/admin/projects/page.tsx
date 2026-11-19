import type { Metadata } from "next";
import { CollectionIndex } from "@/components/admin/collectionPages";

export const metadata: Metadata = { title: "Projects" };

export default function ProjectsAdminPage() {
  return <CollectionIndex collection="projects" />;
}
