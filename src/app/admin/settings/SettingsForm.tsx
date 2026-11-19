"use client";

import { useActionState } from "react";
import { FormMessage, inputClass, primaryButtonClass } from "@/components/auth/fields";
import { CURRENCIES, type Settings } from "@/lib/admin/settings-schema";
import { saveSettingsAction, type SettingsFormState } from "./actions";

function FieldError({ errors }: { errors?: string[] }) {
  return errors?.length ? (
    <span role="alert" className="mt-2 block text-sm font-semibold text-text">
      ⚠ {errors[0]}
    </span>
  ) : null;
}

const label = "block text-sm font-semibold text-text";
const fieldset = "rounded-2xl border border-border bg-surface p-6";
const legend = "px-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted";

export function SettingsForm({ initial }: { initial: Settings }) {
  const [state, action, pending] = useActionState<SettingsFormState, FormData>(saveSettingsAction, { status: "idle" });
  const e = state.fieldErrors ?? {};

  return (
    <form action={action} className="space-y-6" noValidate>
      <fieldset className={fieldset}>
        <legend className={legend}>Site contact details</legend>
        <div className="grid gap-5 sm:grid-cols-2">
          <label className={label}>
            Email
            <input name="contactEmail" type="email" required defaultValue={initial.contactEmail} className={inputClass} aria-invalid={!!e.contactEmail} />
            <FieldError errors={e.contactEmail} />
          </label>
          <label className={label}>
            WhatsApp number
            <input name="whatsapp" required defaultValue={initial.whatsapp} className={inputClass} inputMode="tel" aria-invalid={!!e.whatsapp} />
            <FieldError errors={e.whatsapp} />
          </label>
          <label className={`${label} sm:col-span-2`}>
            Location
            <input name="location" required defaultValue={initial.location} className={inputClass} aria-invalid={!!e.location} />
            <FieldError errors={e.location} />
          </label>
        </div>
      </fieldset>

      <fieldset className={fieldset}>
        <legend className={legend}>Payments &amp; pricing</legend>
        <div className="grid gap-5 sm:grid-cols-2">
          <label className={label}>
            Default deposit (%)
            <input
              name="depositPercent"
              type="number"
              min={0}
              max={100}
              step={1}
              required
              defaultValue={initial.depositPercent}
              className={inputClass}
              aria-invalid={!!e.depositPercent}
            />
            <span className="mt-2 block text-xs font-normal text-muted">
              Default 50%. The deposit policy is still an open decision (DEC-O8).
            </span>
            <FieldError errors={e.depositPercent} />
          </label>
          <div>
            <p className={label} id="currencies-label">
              Currencies shown
            </p>
            <div role="group" aria-labelledby="currencies-label" className="mt-3 flex flex-wrap gap-4">
              {CURRENCIES.map((c) => (
                <label key={c} className="flex items-center gap-2 text-sm font-semibold text-text">
                  <input type="checkbox" name="currencies" value={c} defaultChecked={initial.currencies.includes(c)} className="h-4 w-4" />
                  {c === "USD" ? "USD (US dollar)" : "SLE (Sierra Leonean leone)"}
                </label>
              ))}
            </div>
            <span className="mt-2 block text-xs font-normal text-muted">USD + SLE (DEC-25).</span>
            <FieldError errors={e.currencies} />
          </div>
        </div>
      </fieldset>

      {state.message && <FormMessage tone={state.status === "error" ? "error" : "info"}>{state.message}</FormMessage>}

      <div className="flex justify-end">
        <button type="submit" disabled={pending} className={`${primaryButtonClass} sm:w-auto sm:px-8`}>
          {pending ? "Saving…" : "Save settings"}
        </button>
      </div>
    </form>
  );
}
