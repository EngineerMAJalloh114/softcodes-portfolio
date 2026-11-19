"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Card } from "@/components/admin/ui";
import { useToast } from "@/components/admin/toast";
import { inputClass } from "@/components/auth/fields";
import { LEAD_STATUSES, LEAD_STATUS_LABELS, type LeadStatus } from "@/lib/leads/schema";
import { addLeadNoteAction, setLeadStatusAction } from "../actions";

/** Status change + note form for one lead (leads.write). */
export function LeadActions({ id, status, canWrite }: { id: string; status: LeadStatus; canWrite: boolean }) {
  const router = useRouter();
  const toast = useToast();
  const [pending, start] = useTransition();
  const [note, setNote] = useState("");

  if (!canWrite) return null;

  const run = (fn: () => Promise<{ ok: boolean; message?: string }>, success: string, after?: () => void) =>
    start(async () => {
      try {
        const r = await fn();
        if (r.ok) {
          toast("success", success);
          after?.();
          router.refresh();
        } else toast("error", r.message ?? "Something went wrong.");
      } catch {
        toast("error", "Something went wrong.");
      }
    });

  return (
    <Card>
      <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">Status</h2>
      <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Lead status">
        {LEAD_STATUSES.map((s) => (
          <button
            key={s}
            type="button"
            disabled={pending || s === status}
            aria-pressed={s === status}
            data-set-status={s}
            onClick={() => run(() => setLeadStatusAction(id, s), `Status: ${LEAD_STATUS_LABELS[s]}`)}
            className={`rounded-full border px-4 py-2 text-sm font-semibold transition-colors disabled:cursor-default ${
              s === status ? "border-text bg-btn-bg text-btn-fg" : "border-border text-text hover:border-[var(--border-hover)] disabled:opacity-60"
            }`}
          >
            {LEAD_STATUS_LABELS[s]}
          </button>
        ))}
      </div>

      <form
        className="mt-8"
        onSubmit={(e) => {
          e.preventDefault();
          run(() => addLeadNoteAction(id, note), "Note added", () => setNote(""));
        }}
      >
        <label className="block text-xs font-semibold uppercase tracking-[0.2em] text-muted">
          Add an internal note
          <textarea
            name="note"
            rows={3}
            maxLength={2000}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className={`${inputClass} resize-y normal-case tracking-normal`}
          />
        </label>
        <button
          type="submit"
          disabled={pending || !note.trim()}
          className="mt-3 inline-flex items-center rounded-full bg-btn-bg px-5 py-2.5 text-sm font-semibold text-btn-fg hover:bg-btn-bg/85 disabled:opacity-60"
        >
          Add note
        </button>
      </form>
    </Card>
  );
}
