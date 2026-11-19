"use client";

import { useState, type FormEvent } from "react";
import { Field, FormMessage, authErrorMessage, primaryButtonClass } from "@/components/auth/fields";
import { authClient } from "@/lib/auth/client";

export function ForgotPasswordForm() {
  const [state, setState] = useState<{ tone: "error" | "info"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    const email = String(new FormData(e.currentTarget).get("email"));
    const { error } = await authClient.requestPasswordReset({ email, redirectTo: "/auth/reset-password" });
    setBusy(false);
    setState(
      error
        ? { tone: "error", text: authErrorMessage(error) }
        : { tone: "info", text: "If that email has an account, a reset link is on its way." },
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <Field label="Email" name="email" type="email" required autoComplete="email" />
      {state && <FormMessage tone={state.tone}>{state.text}</FormMessage>}
      <button type="submit" disabled={busy} className={primaryButtonClass}>
        {busy ? "Sending…" : "Send reset link"}
      </button>
    </form>
  );
}
