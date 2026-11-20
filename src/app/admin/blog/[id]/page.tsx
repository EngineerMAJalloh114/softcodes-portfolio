import type { Metadata } from "next";
import { CollectionItem } from "@/components/admin/collectionPages";

export const metadata: Metadata = { title: "Edit post" };

export default async function PostEditPage({ params }: PageProps<"/admin/blog/[id]">) {
  const { id } = await params;
  return <CollectionItem collection="posts" id={id} />;
}
