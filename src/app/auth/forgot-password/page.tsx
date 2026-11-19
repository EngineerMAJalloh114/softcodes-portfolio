import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/AuthShell";
import { ForgotPasswordForm } from "./ForgotPasswordForm";

export const metadata: Metadata = { title: "Forgot password" };

export default function ForgotPasswordPage() {
  return (
    <AuthShell title="Forgot your password?" intro="Enter your email and we'll send a reset link (valid for 1 hour).">
      <ForgotPasswordForm />
    </AuthShell>
  );
}
