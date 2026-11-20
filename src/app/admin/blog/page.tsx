import type { Metadata } from "next";
import Link from "next/link";
import { CollectionIndex } from "@/components/admin/collectionPages";

export const metadata: Metadata = { title: "Blog" };

/** M-05 blog posts (content.write: owner, admin). */
export default function BlogAdminPage() {
  return (
    <>
      <nav aria-label="Blog sections" className="mb-6 flex gap-2 text-sm font-semibold">
        <span aria-current="page" className="rounded-full border border-text bg-btn-bg px-4 py-2 text-btn-fg">
          Posts
        </span>
        <Link href="/admin/blog/categories" className="rounded-full border border-border px-4 py-2 text-text hover:border-[var(--border-hover)]">
          Categories
        </Link>
      </nav>
      <CollectionIndex collection="posts" />
    </>
  );
}
