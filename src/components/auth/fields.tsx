import type { InputHTMLAttributes, ReactNode } from "react";

export const inputClass =
  "mt-2 w-full rounded-xl border border-field bg-bg px-4 py-3 text-text transition-colors duration-300 focus:border-text focus:outline-none focus-visible:outline-2 focus-visible:outline-text";

export const primaryButtonClass =
  "inline-flex w-full items-center justify-center rounded-full bg-btn-bg px-6 py-3 text-sm font-semibold text-btn-fg transition duration-300 hover:bg-btn-bg/85 disabled:cursor-not-allowed disabled:opacity-60";

export function Field({
  label,
  hint,
  ...props
}: { label: string; hint?: ReactNode } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block text-sm font-semibold text-text">
      {label}
      <input className={inputClass} {...props} />
      {hint && <span className="mt-2 block text-xs font-normal text-muted">{hint}</span>}
    </label>
  );
}

export function FormMessage({ tone, children }: { tone: "error" | "info"; children: ReactNode }) {
  return (
    <p
      role={tone === "error" ? "alert" : "status"}
      className={`rounded-xl border px-4 py-3 text-sm ${
        tone === "error" ? "border-text/60 font-semibold text-text" : "border-border text-muted"
      }`}
    >
      {tone === "error" && <span aria-hidden>⚠ </span>}
      {children}
    </p>
  );
}

/** Human message for a Better Auth client error. */
export function authErrorMessage(error: { status?: number; message?: string; code?: string } | null | undefined) {
  if (!error) return "Something went wrong. Please try again.";
  if (error.status === 429) return "Too many attempts. Please wait a few minutes and try again.";
  if (error.code === "EMAIL_NOT_CONFIGURED") return error.message ?? "Email is not configured yet.";
  return error.message || "Something went wrong. Please try again.";
}
