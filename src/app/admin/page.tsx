import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/AuthShell";
import { requireAdmin } from "@/lib/auth/guard";
import { SignOutButtons } from "./SignOutButtons";

export const metadata: Metadata = { title: "Admin" };

/** Protected placeholder. The admin UI itself is T4. */
export default async function AdminPage() {
  const { session, role } = await requireAdmin();
  return (
    <AuthShell
      title="Admin"
      intro={
        <>
          Signed in as <span className="font-semibold text-text">{session.user.email}</span> ({role}), with
          two-factor authentication on. The admin panel arrives in the next release.
        </>
      }
    >
      <SignOutButtons />
    </AuthShell>
  );
}
