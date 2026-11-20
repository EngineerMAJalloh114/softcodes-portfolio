import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CollectionIndex } from "@/components/admin/collectionPages";

export const metadata: Metadata = { title: "Content list" };

/** /admin/content/services and /admin/content/stack (projects live at /admin/projects). */
export default async function CollectionPage({ params }: PageProps<"/admin/content/[collection]">) {
  const { collection } = await params;
  if (collection !== "services" && collection !== "stack" && collection !== "faqs" && collection !== "testimonials") notFound();
  return <CollectionIndex collection={collection} />;
}
