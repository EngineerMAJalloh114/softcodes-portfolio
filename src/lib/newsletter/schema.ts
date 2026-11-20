import { z } from "zod";

/**
 * Newsletter signup (M-13) — validation (K-15), spam rules (K-14) and CSV export. Pure module.
 * DEC-43: signups are stored as "pending"; once Resend is live (T7b) each gets a double
 * opt-in email and only "confirmed" subscribers receive newsletters.
 */

export const SUBSCRIBER_STATUSES = ["pending", "confirmed", "unsubscribed"] as const;
export type SubscriberStatus = (typeof SUBSCRIBER_STATUSES)[number];
export const SUBSCRIBER_STATUS_LABELS: Record<SubscriberStatus, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  unsubscribed: "Unsubscribed",
};

export const SIGNUP_SOURCES = ["footer", "blog"] as const;

/** Honeypot + minimum fill time as for the quote form; its own per-IP limit. */
export const NEWSLETTER_RULES = {
  honeypotField: "website",
  rateLimit: { max: 5, windowMs: 10 * 60 * 1000 },
} as const;

export const signupSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email("Enter a valid email address.").max(254, "That address is too long.")),
  consent: z.preprocess((v) => v === true || v === "on" || v === "true", z.literal(true, { error: "Please tick the box to agree." })),
  source: z.enum(SIGNUP_SOURCES).catch("footer"),
});
export type SignupInput = z.output<typeof signupSchema>;

/** Unsubscribe / confirm tokens: 32 random bytes, base64url (43 characters). */
export const TOKEN_RE = /^[A-Za-z0-9_-]{43}$/;

export function parseStatusFilter(v: unknown): SubscriberStatus | undefined {
  const s = Array.isArray(v) ? v[0] : v;
  return typeof s === "string" && (SUBSCRIBER_STATUSES as readonly string[]).includes(s) ? (s as SubscriberStatus) : undefined;
}

/* ------------------------------------------------------------------ */
/* CSV export                                                          */
/* ------------------------------------------------------------------ */

/**
 * One CSV cell: quoted when needed, and defused against spreadsheet formula injection —
 * a value starting with = + - @ (or a tab/CR) is prefixed with ' so Excel/Sheets show it as text.
 */
export function csvCell(value: unknown): string {
  let s = value instanceof Date ? value.toISOString() : value == null ? "" : String(value);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",\r\n]/.test(s) || s !== s.trim() ? `"${s.replace(/"/g, '""')}"` : s;
}

export type CsvSubscriber = {
  email: string;
  status: string;
  source: string;
  consentAt: Date;
  consentText: string;
  createdAt: Date;
  confirmedAt: Date | null;
  unsubscribedAt: Date | null;
};

export const CSV_HEADER = ["email", "status", "source", "consent_at", "consent_text", "signed_up_at", "confirmed_at", "unsubscribed_at"];

export function subscribersCsv(rows: CsvSubscriber[]): string {
  const lines = [CSV_HEADER.join(",")];
  for (const r of rows) {
    lines.push([r.email, r.status, r.source, r.consentAt, r.consentText, r.createdAt, r.confirmedAt, r.unsubscribedAt].map(csvCell).join(","));
  }
  return `${lines.join("\r\n")}\r\n`;
}
