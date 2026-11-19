"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  createItemAction,
  deleteItemAction,
  discardItemDraftAction,
  discardSectionDraftAction,
  saveItemAction,
  saveSectionAction,
  setItemPublishedAction,
} from "@/app/admin/content/actions";
import type { Field } from "@/lib/content/fields";
import { FieldsEditor } from "./FieldEditor";
import { useToast } from "./toast";
import { useUnsavedChanges } from "./useUnsavedChanges";

type Target =
  | { type: "section"; key: string }
  | { type: "item"; collection: string; id: number | null; adminBase: string };

type ActionResult = { ok: true; id?: number } | { ok: false; errors: Record<string, string>; message: string };

const btn = "inline-flex h-11 items-center justify-center rounded-full px-5 text-sm font-semibold transition duration-300 disabled:opacity-50";
const primary = `${btn} bg-btn-bg text-btn-fg hover:bg-btn-bg/85`;
const secondary = `${btn} border border-border text-text hover:border-[var(--border-hover)]`;

export function StatusPill({ published, hasDraft }: { published: boolean; hasDraft: boolean }) {
  const label = !published ? "Draft — not public" : hasDraft ? "Published · unpublished changes" : "Published";
  return (
    <span
      data-status={!published ? "draft" : hasDraft ? "changes" : "published"}
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${
        published ? "border-border text-text" : "border-text bg-btn-bg text-btn-fg"
      }`}
    >
      <span aria-hidden className={`h-1.5 w-1.5 rounded-full ${published ? "bg-text" : "bg-btn-fg"}`} />
      {label}
    </span>
  );
}

export function ContentEditor({
  target,
  title,
  description,
  fields,
  initial,
  published,
  hasDraft,
  previewPath,
  backHref,
  previews,
}: {
  target: Target;
  title: string;
  description?: string;
  fields: Field[];
  initial: Record<string, unknown>;
  published: boolean;
  hasDraft: boolean;
  previewPath: string | null;
  backHref: string;
  previews: Record<string, string>;
}) {
  const router = useRouter();
  const toast = useToast();
  const [value, setValue] = useState(initial);
  const [saved, setSaved] = useState(() => JSON.stringify(initial));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const dirty = useMemo(() => JSON.stringify(value) !== saved, [value, saved]);
  useUnsavedChanges(dirty);

  const isNew = target.type === "item" && target.id === null;

  async function run(label: string, fn: () => Promise<ActionResult>, after?: (r: ActionResult & { ok: true }) => void) {
    setBusy(true);
    try {
      const r = await fn();
      if (!r.ok) {
        setErrors(r.errors);
        toast("error", r.message);
        return;
      }
      setErrors({});
      setSaved(JSON.stringify(value));
      toast("success", label);
      if (after) after(r);
      else router.refresh();
    } catch {
      toast("error", "Something went wrong. Your changes were not saved.");
    } finally {
      setBusy(false);
    }
  }

  const save = (publish: boolean) => {
    if (target.type === "section") {
      return run(publish ? "Published — the site is updated." : "Draft saved (not public yet).", () => saveSectionAction(target.key, value, publish));
    }
    if (target.id === null) {
      return run(
        publish ? "Created and published." : "Created as a draft (not public).",
        () => createItemAction(target.collection, value, publish),
        (r) => {
          setSaved(JSON.stringify(value)); // allow navigation without the unsaved warning
          router.replace(`${target.adminBase}/${r.id}`);
        },
      );
    }
    const id = target.id;
    return run(publish ? "Published — the site is updated." : "Draft saved (not public yet).", () => saveItemAction(target.collection, id, value, publish));
  };

  const discard = () => {
    if (!window.confirm("Discard the unpublished changes and go back to the live version?")) return;
    if (target.type === "section") return run("Draft discarded.", () => discardSectionDraftAction(target.key), () => window.location.reload());
    if (target.id !== null) {
      const id = target.id;
      return run("Draft discarded.", () => discardItemDraftAction(target.collection, id), () => window.location.reload());
    }
  };

  const unpublish = () => {
    if (target.type !== "item" || target.id === null) return;
    const id = target.id;
    return run("Unpublished — removed from the site.", () => setItemPublishedAction(target.collection, id, false));
  };

  const remove = () => {
    if (target.type !== "item" || target.id === null) return;
    if (!window.confirm(`Delete "${title}" permanently? This can't be undone.`)) return;
    const id = target.id;
    return run("Deleted.", () => deleteItemAction(target.collection, id), () => {
      setSaved(JSON.stringify(value));
      router.replace(target.adminBase);
    });
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        save(false);
      }}
      noValidate
      className="space-y-6"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link href={backHref} className="text-sm font-semibold text-muted hover:text-text">
            ← Back
          </Link>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-text">{title}</h1>
          {description && <p className="mt-2 max-w-2xl text-muted">{description}</p>}
        </div>
        {!isNew && <StatusPill published={published} hasDraft={hasDraft} />}
      </div>

      {Object.keys(errors).length > 0 && (
        <p role="alert" className="rounded-xl border border-text px-4 py-3 text-sm font-semibold text-text">
          ⚠ Please fix: {Object.values(errors).slice(0, 3).join(" · ")}
          {Object.keys(errors).length > 3 ? ` (+${Object.keys(errors).length - 3} more)` : ""}
        </p>
      )}

      <div className="rounded-2xl border border-border bg-surface p-5 sm:p-7">
        <FieldsEditor fields={fields} value={value} onChange={setValue} errors={errors} previews={previews} />
      </div>

      <div className="sticky bottom-0 z-10 -mx-4 flex flex-wrap items-center gap-3 border-t border-border bg-bg/95 px-4 py-4 backdrop-blur sm:-mx-8 sm:px-8 lg:-mx-10 lg:px-10">
        <span className="mr-auto text-sm font-semibold text-muted" aria-live="polite">
          {dirty ? "Unsaved changes" : "All changes saved"}
        </span>
        {!isNew && previewPath && (
          <a
            href={`/api/preview?path=${encodeURIComponent(previewPath)}`}
            target="_blank"
            rel="noopener"
            className={secondary}
            title={dirty ? "Save a draft first — preview shows saved drafts" : "Open the page with unpublished changes"}
          >
            Preview draft
          </a>
        )}
        {!isNew && hasDraft && (
          <button type="button" className={secondary} disabled={busy} onClick={discard}>
            Discard draft
          </button>
        )}
        {target.type === "item" && !isNew && published && (
          <button type="button" className={secondary} disabled={busy} onClick={unpublish}>
            Unpublish
          </button>
        )}
        {target.type === "item" && !isNew && (
          <button type="button" className={secondary} disabled={busy} onClick={remove}>
            Delete
          </button>
        )}
        <button type="submit" className={secondary} disabled={busy}>
          {isNew ? "Create as draft" : "Save draft"}
        </button>
        <button type="button" className={primary} disabled={busy} onClick={() => save(true)}>
          {isNew ? "Create and publish" : "Publish"}
        </button>
      </div>
    </form>
  );
}
