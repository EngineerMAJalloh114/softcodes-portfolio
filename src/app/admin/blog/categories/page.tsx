import type { Metadata } from "next";
import Link from "next/link";
import { CollectionIndex } from "@/components/admin/collectionPages";

export const metadata: Metadata = { title: "Blog categories" };

export default function BlogCategoriesPage() {
  return (
    <>
      <nav aria-label="Blog sections" className="mb-6 flex gap-2 text-sm font-semibold">
        <Link href="/admin/blog" className="rounded-full border border-border px-4 py-2 text-text hover:border-[var(--border-hover)]">
          Posts
        </Link>
        <span aria-current="page" className="rounded-full border border-text bg-btn-bg px-4 py-2 text-btn-fg">
          Categories
        </span>
      </nav>
      <CollectionIndex collection="postCategories" />
    </>
  );
}
