import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/auth/AuthShell";
import { ResetPasswordForm } from "./ResetPasswordForm";

export const metadata: Metadata = { title: "Reset password" };

export default async function ResetPasswordPage({ searchParams }: PageProps<"/auth/reset-password">) {
  const { token } = await searchParams;
  return (
    <AuthShell title="Reset your password">
      {typeof token === "string" && token ? (
        <ResetPasswordForm token={token} />
      ) : (
        <p className="text-muted">
          This reset link is missing its token.{" "}
          <Link href="/auth/forgot-password" className="font-semibold text-text underline">
            Request a new link
          </Link>
          .
        </p>
      )}
    </AuthShell>
  );
}
