import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/AuthShell";
import { requireSignedIn } from "@/lib/auth/guard";
import { SetupMfa } from "./SetupMfa";

export const metadata: Metadata = { title: "Set up two-factor authentication" };

export default async function SetupMfaPage() {
  const session = await requireSignedIn();
  if (session.user.mustChangePassword) redirect("/auth/change-password");
  if (session.user.twoFactorEnabled) redirect("/admin");
  return (
    <AuthShell
      title="Set up two-factor authentication"
      intro="Admin access needs an authenticator app (Google Authenticator, 1Password, Authy, …)."
    >
      <SetupMfa />
    </AuthShell>
  );
}
