"use client";

import { useState, type FormEvent } from "react";
import type { SiteContent } from "@/lib/content/types";

const field =
  "mt-2 w-full rounded-xl border border-field bg-bg px-4 py-3 text-text placeholder:text-muted/70 transition-colors duration-300 focus:border-text focus:outline-none focus-visible:outline-2 focus-visible:outline-text";

/** No backend: builds a mailto: link with the form contents and opens the user's mail app. */
export function ContactForm({ contact, contactSection }: Pick<SiteContent, "contact" | "contactSection">) {
  const f = contactSection.form;
  const [opened, setOpened] = useState(false);

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const name = String(data.get("name") ?? "").trim();
    const email = String(data.get("email") ?? "").trim();
    const message = String(data.get("message") ?? "").trim();
    const subject = `${f.subjectPrefix} ${name}`;
    const body = `${message}\n\n— ${name}${email ? ` (${email})` : ""}`;
    window.location.href = `mailto:${contact.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    setOpened(true);
  }

  return (
    <form
      onSubmit={onSubmit}
      action={`mailto:${contact.email}`}
      method="post"
      encType="text/plain"
      className="rounded-2xl border border-border bg-surface p-7 sm:p-10"
    >
      <div className="grid gap-6 sm:grid-cols-2">
        <label className="block text-sm font-semibold text-text">
          {f.nameLabel}
          <input name="name" required autoComplete="name" className={field} />
        </label>
        <label className="block text-sm font-semibold text-text">
          {f.emailLabel}
          <input name="email" type="email" required autoComplete="email" className={field} />
        </label>
      </div>
      <label className="mt-6 block text-sm font-semibold text-text">
        {f.messageLabel}
        <textarea name="message" required rows={6} className={`${field} resize-y`} />
      </label>
      <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted" aria-live="polite">
          {opened ? `If nothing opened, email ${contact.email} directly.` : f.note}
        </p>
        <button
          type="submit"
          className="inline-flex shrink-0 items-center justify-center rounded-full bg-btn-bg px-6 py-3 text-sm font-semibold text-btn-fg transition duration-300 hover:bg-btn-bg/85 hover:shadow-[0_0_40px_-8px_var(--glow-strong)]"
        >
          {f.submitLabel}
        </button>
      </div>
    </form>
  );
}
