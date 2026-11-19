import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/AuthShell";
import { requireSignedIn } from "@/lib/auth/guard";
import { ChangePasswordForm } from "./ChangePasswordForm";

export const metadata: Metadata = { title: "Change password" };

export default async function ChangePasswordPage() {
  const session = await requireSignedIn();
  const forced = Boolean(session.user.mustChangePassword);
  return (
    <AuthShell
      title={forced ? "Choose a new password" : "Change password"}
      intro={
        forced
          ? "You signed in with a temporary password. Replace it before continuing."
          : "Other sessions are signed out when you change your password."
      }
    >
      <ChangePasswordForm />
    </AuthShell>
  );
}
