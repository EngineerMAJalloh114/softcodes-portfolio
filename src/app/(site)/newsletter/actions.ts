"use server";

import { headers } from "next/headers";
import { clientIp } from "@/lib/auth/audit";
import { getPublishedContent } from "@/lib/content/load";
import { spamCheck } from "@/lib/leads/schema";
import { NEWSLETTER_RULES } from "@/lib/newsletter/schema";
import { subscribe, unsubscribe } from "@/lib/newsletter/service";

export type SignupState = {
  status: "idle" | "sent" | "error";
  message?: string;
  fieldErrors?: Record<string, string[]>;
  code?: "invalid" | "spam" | "rate_limited" | "unavailable";
};

/**
 * M-13 newsletter signup. Public. Spam protection (K-14): honeypot, minimum fill time,
 * per-IP rate limit. Stored as "pending" with the consent text shown on the site (DEC-43).
 */
export async function signupAction(_prev: SignupState, formData: FormData): Promise<SignupState> {
  const verdict = spamCheck({ honeypot: formData.get(NEWSLETTER_RULES.honeypotField), startedAt: formData.get("startedAt") });
  if (!verdict.ok) {
    console.warn(`[newsletter] signup refused: ${verdict.reason}`);
    return { status: "error", code: "spam", message: "Your signup couldn't be sent. Please reload the page and try again." };
  }
  if (!process.env.DATABASE_URL) return { status: "error", code: "unavailable", message: "Signups are unavailable right now." };
  // Consent wording comes from the server, not the browser: what the site actually showed.
  const { newsletter } = await getPublishedContent();
  const result = await subscribe(
    { email: formData.get("email") ?? "", consent: formData.get("consent"), source: formData.get("source") },
    { ip: clientIp(await headers()), consentText: newsletter.consentLabel },
  );
  if (result.ok) return { status: "sent" };
  if (result.reason === "rate_limited") return { status: "error", code: "rate_limited", message: "Too many signups from your connection. Please try again in a few minutes." };
  return { status: "error", code: "invalid", message: "Please fix the highlighted fields.", fieldErrors: result.fieldErrors };
}

export type UnsubscribeState = { status: "idle" | "done" | "invalid" };

export async function unsubscribeAction(_prev: UnsubscribeState, formData: FormData): Promise<UnsubscribeState> {
  const outcome = await unsubscribe(formData.get("token"), { ip: clientIp(await headers()) });
  return { status: outcome };
}
