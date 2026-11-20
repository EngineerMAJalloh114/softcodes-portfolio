import type { Metadata } from "next";
import { CollectionItem } from "@/components/admin/collectionPages";

export const metadata: Metadata = { title: "Edit category" };

export default async function CategoryEditPage({ params }: PageProps<"/admin/blog/categories/[id]">) {
  const { id } = await params;
  return <CollectionItem collection="postCategories" id={id} />;
}
