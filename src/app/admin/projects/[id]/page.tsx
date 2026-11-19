import type { Metadata } from "next";
import { CollectionItem } from "@/components/admin/collectionPages";

export const metadata: Metadata = { title: "Edit project" };

export default async function ProjectEditPage({ params }: PageProps<"/admin/projects/[id]">) {
  const { id } = await params;
  return <CollectionItem collection="projects" id={id} />;
}
