import type { Metadata } from "next";
import { CollectionItem } from "@/components/admin/collectionPages";

export const metadata: Metadata = { title: "Edit package" };

export default async function PackageEditPage({ params }: PageProps<"/admin/pricing/[id]">) {
  const { id } = await params;
  return <CollectionItem collection="packages" id={id} />;
}
