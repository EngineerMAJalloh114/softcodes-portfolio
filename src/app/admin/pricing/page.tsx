import type { Metadata } from "next";
import { CollectionIndex } from "@/components/admin/collectionPages";

export const metadata: Metadata = { title: "Pricing" };

/** G-06 pricing management: packages with 'from' prices in USD + SLE (DEC-38). */
export default function PricingAdminPage() {
  return <CollectionIndex collection="packages" />;
}
