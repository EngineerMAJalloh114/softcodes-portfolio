"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Field, FormMessage, authErrorMessage, primaryButtonClass } from "@/components/auth/fields";
import { authClient } from "@/lib/auth/client";

const MIN = 12;

export function ChangePasswordForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const currentPassword = String(form.get("current"));
    const newPassword = String(form.get("new"));
    if (newPassword !== String(form.get("confirm"))) return setError("The new passwords don't match.");
    if (newPassword === currentPassword) return setError("Choose a password different from the current one.");
    setBusy(true);
    setError(null);
    const { error } = await authClient.changePassword({ currentPassword, newPassword, revokeOtherSessions: true });
    setBusy(false);
    if (error) return setError(authErrorMessage(error));
    router.replace("/admin");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <Field label="Current password" name="current" type="password" required autoComplete="current-password" />
      <Field
        label="New password"
        name="new"
        type="password"
        required
        minLength={MIN}
        autoComplete="new-password"
        hint={`At least ${MIN} characters.`}
      />
      <Field label="Confirm new password" name="confirm" type="password" required minLength={MIN} autoComplete="new-password" />
      {error && <FormMessage tone="error">{error}</FormMessage>}
      <button type="submit" disabled={busy} className={primaryButtonClass}>
        {busy ? "Saving…" : "Save new password"}
      </button>
    </form>
  );
}
