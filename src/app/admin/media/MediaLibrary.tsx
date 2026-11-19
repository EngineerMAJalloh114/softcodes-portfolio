"use client";

/* eslint-disable @next/next/no-img-element -- private items use short-lived signed URLs */
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";
import { EmptyStateClient } from "@/components/admin/EmptyStateClient";
import { useToast } from "@/components/admin/toast";
import { inputClass } from "@/components/auth/fields";
import { ACCEPT_ATTR } from "@/lib/content/media-rules";
import type { MediaItem } from "@/lib/content/media";
import { deleteMediaAction, replaceMediaAction, updateAltAction, uploadMediaAction } from "./actions";

const small =
  "inline-flex h-9 items-center rounded-full border border-border px-3 text-xs font-semibold text-text hover:border-[var(--border-hover)] disabled:opacity-40";
const size = (n: number) => (n < 1024 * 1024 ? `${Math.round(n / 1024)} KB` : `${(n / 1024 / 1024).toFixed(1)} MB`);

export function MediaLibrary({ items }: { items: MediaItem[] }) {
  const router = useRouter();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  async function onUpload(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    try {
      const r = await uploadMediaAction(new FormData(e.currentTarget));
      if (r.ok) {
        toast("success", "Uploaded.");
        formRef.current?.reset();
        router.refresh();
      } else toast("error", r.message);
    } catch {
      toast("error", "Upload failed. Check the file size (max 15 MB) and try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-8">
      <form ref={formRef} onSubmit={onUpload} className="rounded-2xl border border-border bg-surface p-5 sm:p-7" aria-label="Upload a file">
        <div className="grid gap-4 sm:grid-cols-[2fr_1fr] lg:grid-cols-[2fr_1fr_2fr_auto] lg:items-end">
          <label className="block text-sm font-semibold text-text">
            File
            <input name="file" type="file" required accept={ACCEPT_ATTR} className={`${inputClass} py-2.5`} />
          </label>
          <label className="block text-sm font-semibold text-text">
            Visibility
            <select name="visibility" defaultValue="" className={inputClass}>
              <option value="">Auto (images public, PDFs private)</option>
              <option value="public">Public — usable on the site</option>
              <option value="private">Private — admin only</option>
            </select>
          </label>
          <label className="block text-sm font-semibold text-text">
            Alt text (describe the image)
            <input name="alt" maxLength={300} className={inputClass} />
          </label>
          <button
            type="submit"
            disabled={busy}
            className="inline-flex h-12 items-center justify-center rounded-full bg-btn-bg px-6 text-sm font-semibold text-btn-fg hover:bg-btn-bg/85 disabled:opacity-60"
          >
            {busy ? "Uploading…" : "Upload"}
          </button>
        </div>
      </form>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-border bg-surface">
          <EmptyStateClient title="No files yet" body="Upload an image or PDF to start the library." />
        </div>
      ) : (
        <ul className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((m) => (
            <MediaCard key={`${m.id}-${m.key}`} item={m} onChanged={() => router.refresh()} />
          ))}
        </ul>
      )}
    </div>
  );
}

function MediaCard({ item, onChanged }: { item: MediaItem; onChanged: () => void }) {
  const toast = useToast();
  const [alt, setAlt] = useState(item.alt);
  const [busy, setBusy] = useState(false);
  const replaceRef = useRef<HTMLInputElement>(null);

  async function run(label: string, fn: () => Promise<{ ok: boolean; message?: string }>) {
    setBusy(true);
    try {
      const r = await fn();
      if (r.ok) {
        toast("success", label);
        onChanged();
      } else toast("error", r.message ?? "Something went wrong.");
    } catch {
      toast("error", "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <li className="overflow-hidden rounded-2xl border border-border bg-surface" data-media={item.filename}>
      <div className="relative aspect-[4/3] bg-bg">
        {item.kind === "image" ? (
          item.visibility === "public" ? (
            // Admin thumbnails load straight from the public bucket (no optimisation needed here).
            <Image src={item.url} alt={item.alt} fill unoptimized sizes="(min-width: 1280px) 33vw, (min-width: 640px) 50vw, 100vw" className="object-cover" />
          ) : (
            <img src={item.url} alt={item.alt} className="h-full w-full object-cover" />
          )
        ) : (
          <a href={item.url} target="_blank" rel="noopener" className="flex h-full flex-col items-center justify-center gap-2 text-text">
            <span className="rounded-xl border border-border px-4 py-3 text-2xl font-extrabold">PDF</span>
            <span className="text-xs font-semibold underline">Open</span>
          </a>
        )}
        <span className="absolute left-3 top-3 rounded-full bg-btn-bg px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider text-btn-fg">
          {item.visibility}
        </span>
      </div>
      <div className="space-y-3 p-4">
        <div>
          <p className="truncate text-sm font-semibold text-text" title={item.filename}>
            {item.filename}
          </p>
          <p className="text-xs text-muted">
            {item.mime} · {size(item.size)}
          </p>
        </div>
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            run("Alt text saved.", () => updateAltAction(item.id, alt));
          }}
        >
          <label className="sr-only" htmlFor={`alt-${item.id}`}>
            Alt text for {item.filename}
          </label>
          <input id={`alt-${item.id}`} value={alt} maxLength={300} onChange={(e) => setAlt(e.target.value)} placeholder="Alt text" className={`${inputClass} mt-0 h-9 py-1 text-sm`} />
          <button type="submit" className={small} disabled={busy || alt === item.alt}>
            Save
          </button>
        </form>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className={small}
            onClick={() => navigator.clipboard?.writeText(item.ref).then(() => toast("success", `Copied ${item.ref}`))}
          >
            Copy reference
          </button>
          <button type="button" className={small} disabled={busy} onClick={() => replaceRef.current?.click()}>
            Replace
          </button>
          <input
            ref={replaceRef}
            type="file"
            accept={ACCEPT_ATTR}
            className="hidden"
            aria-label={`Replace ${item.filename}`}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const fd = new FormData();
              fd.set("id", item.id);
              fd.set("file", file);
              run("Replaced — every page using it now shows the new file.", () => replaceMediaAction(fd));
              e.target.value = "";
            }}
          />
          <button
            type="button"
            className={small}
            disabled={busy}
            onClick={() => {
              if (window.confirm(`Delete ${item.filename}? This can't be undone.`)) run("Deleted.", () => deleteMediaAction(item.id));
            }}
          >
            Delete
          </button>
        </div>
      </div>
    </li>
  );
}
