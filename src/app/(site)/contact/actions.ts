"use server";

import { headers } from "next/headers";
import { clientIp } from "@/lib/auth/audit";
import { SPAM_RULES, spamCheck } from "@/lib/leads/schema";
import { submitLead } from "@/lib/leads/service";

export type QuoteFormState = {
  status: "idle" | "sent" | "error";
  reference?: string;
  message?: string;
  fieldErrors?: Record<string, string[]>;
  /** Why the request was refused (spam rules / rate limit) — shown as a general message. */
  code?: "invalid" | "spam" | "rate_limited" | "unavailable";
};

const FIELDS = ["name", "email", "phone", "company", "projectType", "budgetCurrency", "budget", "deadline", "message", "source"] as const;

/**
 * M-03 quote request. Public: no sign-in. Spam protection (K-14) without a third-party
 * captcha: hidden honeypot field, minimum fill time, per-IP rate limit.
 */
export async function submitQuoteAction(_prev: QuoteFormState, formData: FormData): Promise<QuoteFormState> {
  const verdict = spamCheck({ honeypot: formData.get(SPAM_RULES.honeypotField), startedAt: formData.get("startedAt") });
  if (!verdict.ok) {
    console.warn(`[leads] submission refused: ${verdict.reason}`);
    return {
      status: "error",
      code: "spam",
      message:
        verdict.reason === "too_fast"
          ? "That was quick! Please check your details and send the form again."
          : "Your request couldn't be sent. Please reload the page and try again, or contact me by email or WhatsApp.",
    };
  }
  if (!process.env.DATABASE_URL) {
    return { status: "error", code: "unavailable", message: "The form is unavailable right now. Please contact me by email or WhatsApp." };
  }

  const input = Object.fromEntries(FIELDS.map((f) => [f, formData.get(f) ?? ""]));
  const result = await submitLead(input, { ip: clientIp(await headers()) });
  if (result.ok) return { status: "sent", reference: result.reference };
  if (result.reason === "rate_limited") {
    return {
      status: "error",
      code: "rate_limited",
      message: "You've sent several requests in a short time. Please wait a few minutes, or contact me by email or WhatsApp.",
    };
  }
  return { status: "error", code: "invalid", message: "Please fix the highlighted fields.", fieldErrors: result.fieldErrors };
}
