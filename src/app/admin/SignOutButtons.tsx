"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { primaryButtonClass } from "@/components/auth/fields";
import { authClient } from "@/lib/auth/client";

export function SignOutButtons() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function signOut(everywhere: boolean) {
    setBusy(true);
    if (everywhere) await authClient.revokeSessions();
    await authClient.signOut();
    router.replace("/auth/sign-in");
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <button type="button" disabled={busy} onClick={() => signOut(false)} className={primaryButtonClass}>
        Sign out
      </button>
      <button
        type="button"
        disabled={busy}
        onClick={() => signOut(true)}
        className="inline-flex w-full items-center justify-center rounded-full border border-border px-6 py-3 text-sm font-semibold text-text transition duration-300 hover:border-[var(--border-hover)] disabled:opacity-60"
      >
        Sign out everywhere
      </button>
      <p className="text-center text-sm">
        <Link href="/auth/change-password" className="font-semibold text-muted hover:text-text">
          Change password
        </Link>
      </p>
    </div>
  );
}
