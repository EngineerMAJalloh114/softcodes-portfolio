"use client";

import { useState, type FormEvent } from "react";
import { contact, contactSection } from "@/content/site";

const field =
  "mt-2 w-full rounded-xl border border-slate bg-void px-4 py-3 text-mist placeholder:text-dusk transition-colors duration-300 focus:border-mist/70 focus:outline-none focus-visible:outline-2 focus-visible:outline-mist";

/** No backend: builds a mailto: link with the form contents and opens the user's mail app. */
export function ContactForm() {
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
      className="rounded-2xl border border-slate bg-night p-7 sm:p-10"
    >
      <div className="grid gap-6 sm:grid-cols-2">
        <label className="block text-sm font-semibold text-mist">
          {f.nameLabel}
          <input name="name" required autoComplete="name" className={field} />
        </label>
        <label className="block text-sm font-semibold text-mist">
          {f.emailLabel}
          <input name="email" type="email" required autoComplete="email" className={field} />
        </label>
      </div>
      <label className="mt-6 block text-sm font-semibold text-mist">
        {f.messageLabel}
        <textarea name="message" required rows={6} className={`${field} resize-y`} />
      </label>
      <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted" aria-live="polite">
          {opened ? `If nothing opened, email ${contact.email} directly.` : f.note}
        </p>
        <button
          type="submit"
          className="inline-flex shrink-0 items-center justify-center rounded-full bg-mist px-6 py-3 text-sm font-semibold text-void transition duration-300 hover:bg-white hover:shadow-[0_0_40px_-8px_rgba(199,208,217,0.55)]"
        >
          {f.submitLabel}
        </button>
      </div>
    </form>
  );
}
