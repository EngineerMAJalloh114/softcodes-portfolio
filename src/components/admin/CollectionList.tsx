"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { moveItemAction, setItemPublishedAction } from "@/app/admin/content/actions";
import { StatusPill } from "./ContentEditor";
import { EmptyStateClient } from "./EmptyStateClient";
import { useToast } from "./toast";

export type ListRow = { id: number; title: string; published: boolean; hasDraft: boolean };

const small =
  "inline-flex h-9 items-center rounded-full border border-border px-3 text-xs font-semibold text-text hover:border-[var(--border-hover)] disabled:opacity-40";

/** Ordered list of a collection with publish/unpublish and reorder controls. */
export function CollectionList({
  collection,
  rows,
  adminBase,
  singular,
}: {
  collection: string;
  rows: ListRow[];
  adminBase: string;
  singular: string;
}) {
  const router = useRouter();
  const toast = useToast();
  const [busy, setBusy] = useState<number | null>(null);

  async function act(id: number, label: string, fn: () => Promise<{ ok: boolean; message?: string }>) {
    setBusy(id);
    try {
      const r = await fn();
      if (r.ok) {
        toast("success", label);
        router.refresh();
      } else toast("error", r.message ?? "Something went wrong.");
    } catch {
      toast("error", "Something went wrong.");
    } finally {
      setBusy(null);
    }
  }

  if (!rows.length) {
    return <EmptyStateClient title={`No ${singular}s yet`} body={`Add the first ${singular} with the button above.`} />;
  }

  return (
    <ol className="divide-y divide-border/70">
      {rows.map((r, i) => (
        <li key={r.id} className="flex flex-wrap items-center gap-3 py-4" data-row={r.title}>
          <div className="min-w-0 basis-full sm:basis-0 sm:flex-1">
            <Link href={`${adminBase}/${r.id}`} className="font-semibold text-text hover:underline">
              {r.title}
            </Link>
            <div className="mt-1.5">
              <StatusPill published={r.published} hasDraft={r.hasDraft} />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" className={small} disabled={i === 0 || busy !== null} aria-label={`Move ${r.title} up`} onClick={() => act(r.id, "Moved up.", () => moveItemAction(collection, r.id, "up"))}>
              ↑
            </button>
            <button type="button" className={small} disabled={i === rows.length - 1 || busy !== null} aria-label={`Move ${r.title} down`} onClick={() => act(r.id, "Moved down.", () => moveItemAction(collection, r.id, "down"))}>
              ↓
            </button>
            <button
              type="button"
              className={small}
              disabled={busy !== null}
              onClick={() =>
                act(r.id, r.published ? "Unpublished." : "Published.", () => setItemPublishedAction(collection, r.id, !r.published))
              }
            >
              {r.published ? "Unpublish" : "Publish"}
            </button>
            <Link href={`${adminBase}/${r.id}`} className={small}>
              Edit
            </Link>
          </div>
        </li>
      ))}
    </ol>
  );
}
