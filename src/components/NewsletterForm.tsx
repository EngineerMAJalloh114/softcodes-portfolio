"use client";

import { startTransition, useActionState, useEffect, useRef } from "react";
import { signupAction, type SignupState } from "@/app/(site)/newsletter/actions";
import type { SiteContent } from "@/lib/content/types";
import { NEWSLETTER_RULES } from "@/lib/newsletter/schema";

/**
 * Newsletter signup (M-13): email + consent. Spam protection (K-14): honeypot, minimum fill
 * time, per-IP rate limit on the server. Signups are stored as pending (DEC-43).
 */
export function NewsletterForm({ newsletter, source, compact = false }: { newsletter: SiteContent["newsletter"]; source: "footer" | "blog"; compact?: boolean }) {
  const [state, action, pending] = useActionState<SignupState, FormData>(signupAction, { status: "idle" });
  const startedAt = useRef(0);
  useEffect(() => {
    startedAt.current = Date.now();
  }, []);
  const e = state.fieldErrors ?? {};
  const id = `nl-${source}`;

  if (state.status === "sent") {
    return (
      <div role="status" data-newsletter-sent className="rounded-2xl border border-border bg-surface p-6">
        <p className="font-extrabold text-text">{newsletter.successTitle}</p>
        <p className="mt-2 text-sm text-muted">{newsletter.successBody}</p>
      </div>
    );
  }

  return (
    <form
      noValidate
      data-newsletter-form={source}
      onSubmit={(ev) => {
        ev.preventDefault();
        const data = new FormData(ev.currentTarget);
        data.set("startedAt", String(startedAt.current));
        startTransition(() => action(data));
      }}
      className={`relative rounded-2xl border border-border bg-surface ${compact ? "p-6" : "p-7 sm:p-8"}`}
    >
      <div aria-hidden="true" className="absolute -left-[10000px] h-px w-px overflow-hidden">
        <label>
          Leave this empty
          <input name={NEWSLETTER_RULES.honeypotField} type="text" tabIndex={-1} autoComplete="off" defaultValue="" />
        </label>
      </div>
      <input type="hidden" name="source" value={source} />
      <h2 className="text-lg font-extrabold tracking-tight text-text">{newsletter.heading}</h2>
      <p className="mt-2 text-sm leading-relaxed text-muted">{newsletter.body}</p>
      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <label htmlFor={`${id}-email`} className="sr-only">
          {newsletter.emailLabel}
        </label>
        <input
          id={`${id}-email`}
          name="email"
          type="email"
          autoComplete="email"
          required
          maxLength={254}
          placeholder={newsletter.emailLabel}
          aria-invalid={!!e.email}
          aria-describedby={e.email ? `${id}-email-error` : undefined}
          className="min-w-0 flex-1 rounded-full border border-field bg-bg px-5 py-3 text-sm text-text placeholder:text-muted/70 focus:border-text focus:outline-none focus-visible:outline-2 focus-visible:outline-text"
        />
        <button
          type="submit"
          disabled={pending}
          className="inline-flex shrink-0 items-center justify-center rounded-full bg-btn-bg px-6 py-3 text-sm font-semibold text-btn-fg transition duration-300 hover:bg-btn-bg/85 disabled:opacity-70"
        >
          {pending ? "…" : newsletter.submitLabel}
        </button>
      </div>
      {e.email && (
        <p id={`${id}-email-error`} role="alert" className="mt-2 text-sm font-semibold text-text">
          ⚠ {e.email[0]}
        </p>
      )}
      <label className="mt-4 flex items-start gap-3 text-xs leading-relaxed text-muted">
        <input type="checkbox" name="consent" required className="mt-0.5 h-4 w-4 shrink-0" aria-invalid={!!e.consent} />
        <span>{newsletter.consentLabel}</span>
      </label>
      {e.consent && (
        <p role="alert" className="mt-2 text-sm font-semibold text-text">
          ⚠ {e.consent[0]}
        </p>
      )}
      {state.status === "error" && state.code !== "invalid" && (
        <p role="alert" data-newsletter-error={state.code} className="mt-3 text-sm font-semibold text-text">
          {state.message}
        </p>
      )}
    </form>
  );
}
