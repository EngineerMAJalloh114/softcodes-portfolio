import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/AuthShell";
import { getSession } from "@/lib/auth/guard";
import { SignInForm } from "./SignInForm";

export const metadata: Metadata = { title: "Sign in" };

export default async function SignInPage({ searchParams }: PageProps<"/auth/sign-in">) {
  if (await getSession()) redirect("/admin");
  const { error } = await searchParams;
  return (
    <AuthShell title="Sign in" intro="Owner and admin access to the Soft CODES admin.">
      <SignInForm forbidden={error === "forbidden"} />
    </AuthShell>
  );
}
