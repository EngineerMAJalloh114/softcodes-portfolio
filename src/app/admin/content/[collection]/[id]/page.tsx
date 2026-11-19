import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CollectionItem } from "@/components/admin/collectionPages";

export const metadata: Metadata = { title: "Edit item" };

export default async function CollectionItemPage({ params }: PageProps<"/admin/content/[collection]/[id]">) {
  const { collection, id } = await params;
  if (collection !== "services" && collection !== "stack" && collection !== "faqs") notFound();
  return <CollectionItem collection={collection} id={id} />;
}
