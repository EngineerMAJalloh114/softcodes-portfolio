"use client";

import { useRouter } from "next/navigation";
import QRCode from "qrcode";
import { useState, type FormEvent } from "react";
import { Field, FormMessage, authErrorMessage, primaryButtonClass } from "@/components/auth/fields";
import { authClient } from "@/lib/auth/client";

type Enrolment = { totpURI: string; secret: string; backupCodes: string[]; qr: string };

export function SetupMfa() {
  const router = useRouter();
  const [enrolment, setEnrolment] = useState<Enrolment | null>(null);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onPassword(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const password = String(new FormData(e.currentTarget).get("password"));
    const { data, error } = await authClient.twoFactor.enable({ password });
    if (error || !data || data.method !== "totp") {
      setBusy(false);
      return setError(authErrorMessage(error));
    }
    const secret = new URL(data.totpURI).searchParams.get("secret") ?? "";
    const qr = await QRCode.toDataURL(data.totpURI, { margin: 1, width: 220 });
    setEnrolment({ totpURI: data.totpURI, secret, backupCodes: data.backupCodes, qr });
    setBusy(false);
  }

  async function onVerify(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const code = String(new FormData(e.currentTarget).get("code")).replace(/\s+/g, "");
    const { error } = await authClient.twoFactor.verifyTotp({ code });
    setBusy(false);
    if (error) return setError(error.status === 429 ? authErrorMessage(error) : "That code didn't work. Check the time on your phone and try again.");
    router.replace("/admin");
    router.refresh();
  }

  if (!enrolment) {
    return (
      <form onSubmit={onPassword} className="space-y-6">
        <Field label="Confirm your password" name="password" type="password" required autoComplete="current-password" />
        {error && <FormMessage tone="error">{error}</FormMessage>}
        <button type="submit" disabled={busy} className={primaryButtonClass}>
          {busy ? "Starting…" : "Continue"}
        </button>
      </form>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-extrabold text-text">1. Scan this QR code</h2>
        {/* eslint-disable-next-line @next/next/no-img-element -- generated data URL */}
        <img src={enrolment.qr} alt="QR code for your authenticator app" width={220} height={220} className="mt-4 rounded-xl bg-surface" />
        <p className="mt-3 text-sm text-muted">
          Can&apos;t scan? Enter this key manually:{" "}
          <code className="break-all font-semibold text-text">{enrolment.secret}</code>
        </p>
      </div>

      <div>
        <h2 className="text-lg font-extrabold text-text">2. Save your recovery codes</h2>
        <p className="mt-2 text-sm text-muted">
          Shown only once. Each code signs you in once if you lose your phone. Store them somewhere safe.
        </p>
        <ul className="mt-4 grid grid-cols-2 gap-2 rounded-xl border border-border bg-bg p-4 font-mono text-sm text-text">
          {enrolment.backupCodes.map((c) => (
            <li key={c}>{c}</li>
          ))}
        </ul>
        <label className="mt-4 flex items-center gap-3 text-sm font-semibold text-text">
          <input type="checkbox" checked={saved} onChange={(e) => setSaved(e.target.checked)} className="h-4 w-4" />
          I&apos;ve saved my recovery codes
        </label>
      </div>

      <form onSubmit={onVerify} className="space-y-6">
        <h2 className="text-lg font-extrabold text-text">3. Enter a code to finish</h2>
        <Field label="Authenticator code" name="code" required inputMode="numeric" autoComplete="one-time-code" />
        {error && <FormMessage tone="error">{error}</FormMessage>}
        <button type="submit" disabled={busy || !saved} className={primaryButtonClass}>
          {busy ? "Verifying…" : "Turn on two-factor"}
        </button>
      </form>
    </div>
  );
}
