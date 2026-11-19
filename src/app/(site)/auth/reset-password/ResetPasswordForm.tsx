"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { Field, FormMessage, authErrorMessage, primaryButtonClass } from "@/components/auth/fields";
import { authClient } from "@/lib/auth/client";

const MIN = 12;

export function ResetPasswordForm({ token }: { token: string }) {
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const newPassword = String(form.get("new"));
    if (newPassword !== String(form.get("confirm"))) return setError("The passwords don't match.");
    setBusy(true);
    setError(null);
    const { error } = await authClient.resetPassword({ newPassword, token });
    setBusy(false);
    if (error) {
      return setError(
        error.code === "INVALID_TOKEN" ? "This link has expired or was already used. Request a new one." : authErrorMessage(error),
      );
    }
    setDone(true);
  }

  if (done) {
    return (
      <FormMessage tone="info">
        Password updated and all sessions signed out.{" "}
        <Link href="/auth/sign-in" className="font-semibold text-text underline">
          Sign in
        </Link>
        .
      </FormMessage>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <Field label="New password" name="new" type="password" required minLength={MIN} autoComplete="new-password" hint={`At least ${MIN} characters.`} />
      <Field label="Confirm new password" name="confirm" type="password" required minLength={MIN} autoComplete="new-password" />
      {error && <FormMessage tone="error">{error}</FormMessage>}
      <button type="submit" disabled={busy} className={primaryButtonClass}>
        {busy ? "Saving…" : "Set new password"}
      </button>
    </form>
  );
}
