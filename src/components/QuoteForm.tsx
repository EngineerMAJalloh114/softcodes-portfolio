"use client";

import { startTransition, useActionState, useEffect, useRef } from "react";
import { submitQuoteAction, type QuoteFormState } from "@/app/(site)/contact/actions";
import { BUDGETS, LEAD_CURRENCIES, LEAD_SOURCES, OTHER_PROJECT, SPAM_RULES } from "@/lib/leads/schema";
import type { SiteContent } from "@/lib/content/types";
import { applyCurrency, useCurrency, type Currency } from "./pricing/CurrencyToggle";

const field =
  "mt-2 w-full rounded-xl border border-field bg-bg px-4 py-3 text-text placeholder:text-muted/70 transition-colors duration-300 focus:border-text focus:outline-none focus-visible:outline-2 focus-visible:outline-text aria-[invalid=true]:border-text";
const labelClass = "block text-sm font-semibold text-text";

function FieldError({ id, errors }: { id: string; errors?: string[] }) {
  return errors?.length ? (
    <span id={id} role="alert" className="mt-2 block text-sm font-semibold text-text">
      ⚠ {errors[0]}
    </span>
  ) : null;
}

type Props = Pick<SiteContent, "contact" | "contactSection" | "packages">;

/**
 * Quote request form (M-03). Stored in the leads table via a server action; the owner is
 * notified in the admin (email once Resend is set up — T7b). Spam protection (K-14):
 * honeypot field + minimum fill time + per-IP rate limit (server side).
 */
export function QuoteForm({ contact, contactSection, packages }: Props) {
  const f = contactSection.form;
  const [state, formAction, pending] = useActionState<QuoteFormState, FormData>(submitQuoteAction, { status: "idle" });
  const currency = useCurrency();
  const startedAt = useRef(0);
  const projectSelect = useRef<HTMLSelectElement>(null);

  useEffect(() => {
    startedAt.current = Date.now();
    // Pre-select the package from /contact?package=<slug> (pricing "Request a quote").
    const pkg = new URLSearchParams(window.location.search).get("package");
    const select = projectSelect.current;
    if (pkg && select && [...select.options].some((o) => o.value === pkg)) select.value = pkg;
  }, []);

  const e = state.fieldErrors ?? {};
  const err = (name: string) => (e[name]?.length ? { "aria-invalid": true, "aria-describedby": `quote-${name}-error` } : {});

  if (state.status === "sent") {
    return (
      <div role="status" data-lead-sent className="rounded-2xl border border-border bg-surface p-7 sm:p-10">
        <h2 className="text-2xl font-extrabold tracking-tight text-text">{f.successTitle}</h2>
        <p className="mt-3 text-muted">{f.successBody}</p>
        <p className="mt-6 text-xs font-semibold uppercase tracking-[0.2em] text-muted">Reference</p>
        <p data-lead-reference className="mt-2 font-mono text-2xl font-bold text-text">
          {state.reference}
        </p>
        <p className="mt-6 text-sm text-muted">
          Need to add something? Email <a className="font-semibold text-text underline" href={`mailto:${contact.email}`}>{contact.email}</a> with
          your reference number.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={(ev) => {
        // onSubmit (not `action`) so React doesn't clear the fields when validation fails.
        ev.preventDefault();
        const data = new FormData(ev.currentTarget);
        data.set("startedAt", String(startedAt.current));
        startTransition(() => formAction(data));
      }}
      noValidate
      data-quote-form
      className="relative rounded-2xl border border-border bg-surface p-7 sm:p-10"
    >
      {/* Honeypot (K-14): hidden from people and assistive tech; bots fill every field. */}
      <div aria-hidden="true" className="absolute -left-[10000px] h-px w-px overflow-hidden">
        <label>
          Leave this empty
          <input name={SPAM_RULES.honeypotField} type="text" tabIndex={-1} autoComplete="off" defaultValue="" />
        </label>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <label className={labelClass}>
          {f.nameLabel}
          <input name="name" required autoComplete="name" maxLength={100} className={field} {...err("name")} />
          <FieldError id="quote-name-error" errors={e.name} />
        </label>
        <label className={labelClass}>
          {f.emailLabel}
          <input name="email" type="email" required autoComplete="email" maxLength={254} className={field} {...err("email")} />
          <FieldError id="quote-email-error" errors={e.email} />
        </label>
        <label className={labelClass}>
          {f.phoneLabel}
          <input name="phone" type="tel" autoComplete="tel" inputMode="tel" maxLength={30} className={field} {...err("phone")} />
          <FieldError id="quote-phone-error" errors={e.phone} />
        </label>
        <label className={labelClass}>
          {f.companyLabel}
          <input name="company" autoComplete="organization" maxLength={120} className={field} {...err("company")} />
          <FieldError id="quote-company-error" errors={e.company} />
        </label>
        <label className={`${labelClass} sm:col-span-2`}>
          {f.projectTypeLabel}
          <select ref={projectSelect} name="projectType" required defaultValue="" className={field} {...err("projectType")}>
            <option value="" disabled>
              Choose one…
            </option>
            {packages.map((p) => (
              <option key={p.slug} value={p.slug}>
                {p.name}
              </option>
            ))}
            <option value={OTHER_PROJECT}>{f.otherProjectLabel}</option>
          </select>
          <FieldError id="quote-projectType-error" errors={e.projectType} />
        </label>
        <div className="sm:col-span-2">
          <span className={labelClass} id="quote-budget-label">
            {f.budgetLabel}
          </span>
          <div className="mt-2 grid gap-3 sm:grid-cols-[auto_1fr]">
            <select
              name="budgetCurrency"
              aria-label="Currency"
              value={currency}
              onChange={(ev) => applyCurrency(ev.target.value as Currency)}
              className={`${field} mt-0 sm:w-36`}
            >
              {LEAD_CURRENCIES.map((c) => (
                <option key={c} value={c}>
                  {c === "USD" ? "USD $" : "SLE Le"}
                </option>
              ))}
            </select>
            <select name="budget" required defaultValue="" aria-labelledby="quote-budget-label" className={`${field} mt-0`} {...err("budget")}>
              <option value="" disabled>
                Choose a range…
              </option>
              {BUDGETS[currency].map((b) => (
                <option key={b.key} value={b.key}>
                  {b.label}
                </option>
              ))}
            </select>
          </div>
          <FieldError id="quote-budget-error" errors={e.budget ?? e.budgetCurrency} />
        </div>
        <label className={labelClass}>
          {f.deadlineLabel}
          <input name="deadline" maxLength={60} placeholder={f.deadlinePlaceholder} className={field} {...err("deadline")} />
          <FieldError id="quote-deadline-error" errors={e.deadline} />
        </label>
        <label className={labelClass}>
          {f.sourceLabel}
          <select name="source" required defaultValue="" className={field} {...err("source")}>
            <option value="" disabled>
              Choose one…
            </option>
            {LEAD_SOURCES.map((s) => (
              <option key={s.key} value={s.key}>
                {s.label}
              </option>
            ))}
          </select>
          <FieldError id="quote-source-error" errors={e.source} />
        </label>
      </div>
      <label className={`${labelClass} mt-6`}>
        {f.messageLabel}
        <textarea name="message" required rows={6} maxLength={5000} className={`${field} resize-y`} {...err("message")} />
        <FieldError id="quote-message-error" errors={e.message} />
      </label>

      {state.status === "error" && state.message && (
        <p role="alert" data-form-error={state.code} className="mt-6 rounded-xl border border-text/60 px-4 py-3 text-sm font-semibold text-text">
          {state.message}
        </p>
      )}

      <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted">{f.note}</p>
        <button
          type="submit"
          disabled={pending}
          className="inline-flex shrink-0 items-center justify-center rounded-full bg-btn-bg px-6 py-3 text-sm font-semibold text-btn-fg transition duration-300 hover:bg-btn-bg/85 hover:shadow-[0_0_40px_-8px_var(--glow-strong)] disabled:cursor-wait disabled:opacity-70"
        >
          {pending ? "Sending…" : f.submitLabel}
        </button>
      </div>
    </form>
  );
}
