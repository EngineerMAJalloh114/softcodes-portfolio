"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Field, FormMessage, authErrorMessage, primaryButtonClass } from "@/components/auth/fields";
import { authClient } from "@/lib/auth/client";

export function SignInForm({ forbidden }: { forbidden: boolean }) {
  const router = useRouter();
  const [step, setStep] = useState<"password" | "mfa">("password");
  const [useRecovery, setUseRecovery] = useState(false);
  const [error, setError] = useState<string | null>(forbidden ? "This account can't access the admin." : null);
  const [busy, setBusy] = useState(false);

  async function onPassword(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const form = new FormData(e.currentTarget);
    const { data, error } = await authClient.signIn.email({
      email: String(form.get("email")),
      password: String(form.get("password")),
    });
    setBusy(false);
    if (error) return setError(error.status === 401 ? "Wrong email or password." : authErrorMessage(error));
    if (data && "twoFactorRedirect" in data && data.twoFactorRedirect) return setStep("mfa");
    router.replace("/admin");
    router.refresh();
  }

  async function onCode(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const code = String(new FormData(e.currentTarget).get("code")).replace(/\s+/g, "");
    const { error } = useRecovery
      ? await authClient.twoFactor.verifyBackupCode({ code })
      : await authClient.twoFactor.verifyTotp({ code });
    setBusy(false);
    if (error) return setError(error.status === 429 ? authErrorMessage(error) : "That code didn't work. Try again.");
    router.replace("/admin");
    router.refresh();
  }

  if (step === "mfa") {
    return (
      <form onSubmit={onCode} className="space-y-6">
        <Field
          key={useRecovery ? "recovery" : "totp"}
          label={useRecovery ? "Recovery code" : "Authenticator code"}
          name="code"
          required
          autoFocus
          autoComplete="one-time-code"
          inputMode={useRecovery ? "text" : "numeric"}
          hint={useRecovery ? "Each recovery code works once." : "The 6-digit code from your authenticator app."}
        />
        {error && <FormMessage tone="error">{error}</FormMessage>}
        <button type="submit" disabled={busy} className={primaryButtonClass}>
          {busy ? "Checking…" : "Verify"}
        </button>
        <button
          type="button"
          onClick={() => setUseRecovery((v) => !v)}
          className="w-full text-sm font-semibold text-muted underline-offset-4 hover:text-text hover:underline"
        >
          {useRecovery ? "Use authenticator code instead" : "Use a recovery code instead"}
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={onPassword} className="space-y-6">
      <Field label="Email" name="email" type="email" required autoComplete="email" />
      <Field label="Password" name="password" type="password" required autoComplete="current-password" />
      {error && <FormMessage tone="error">{error}</FormMessage>}
      <button type="submit" disabled={busy} className={primaryButtonClass}>
        {busy ? "Signing in…" : "Sign in"}
      </button>
      <p className="text-center text-sm">
        <Link href="/auth/forgot-password" className="font-semibold text-muted hover:text-text">
          Forgot your password?
        </Link>
      </p>
    </form>
  );
}
