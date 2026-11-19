import { z } from "zod";

/**
 * Quote request (M-03) — validation (K-15), budget ranges, reference numbers and the
 * spam rules (K-14). Pure module (no server imports): shared by the server action, the
 * form, the admin inbox and the tests.
 */

export const LEAD_STATUSES = ["new", "contacted", "quoted", "won", "lost", "spam"] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];
export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  new: "New",
  contacted: "Contacted",
  quoted: "Quoted",
  won: "Won",
  lost: "Lost",
  spam: "Spam",
};

export const LEAD_CURRENCIES = ["USD", "SLE"] as const; // DEC-25
export type LeadCurrency = (typeof LEAD_CURRENCIES)[number];

/** Budget ranges per currency (SLE ≈ USD × 23, rounded; same rate as the DEC-38 prices). */
export const BUDGETS = {
  USD: [
    { key: "lt500", label: "Under $500" },
    { key: "500-1500", label: "$500 – $1,500" },
    { key: "1500-5000", label: "$1,500 – $5,000" },
    { key: "gt5000", label: "Over $5,000" },
    { key: "unsure", label: "Not sure yet" },
  ],
  SLE: [
    { key: "lt500", label: "Under Le 11,500" },
    { key: "500-1500", label: "Le 11,500 – Le 34,500" },
    { key: "1500-5000", label: "Le 34,500 – Le 115,000" },
    { key: "gt5000", label: "Over Le 115,000" },
    { key: "unsure", label: "Not sure yet" },
  ],
} as const satisfies Record<LeadCurrency, readonly { key: string; label: string }[]>;
export const BUDGET_KEYS = ["lt500", "500-1500", "1500-5000", "gt5000", "unsure"] as const;

export function budgetLabel(key: string | null, currency: string | null): string {
  if (!key) return "—";
  const list = BUDGETS[(currency === "SLE" ? "SLE" : "USD") as LeadCurrency];
  return list.find((b) => b.key === key)?.label ?? key;
}

/** How they found us (J-04: source captured on every lead). */
export const LEAD_SOURCES = [
  { key: "search", label: "Google or another search engine" },
  { key: "social", label: "Social media" },
  { key: "referral", label: "A friend or colleague" },
  { key: "whatsapp", label: "WhatsApp" },
  { key: "portfolio", label: "Saw a project I built" },
  { key: "other", label: "Something else" },
] as const;
export const SOURCE_KEYS = LEAD_SOURCES.map((s) => s.key) as [string, ...string[]];
export const sourceLabel = (key: string) => LEAD_SOURCES.find((s) => s.key === key)?.label ?? key;

export const OTHER_PROJECT = "other";

/* ------------------------------------------------------------------ */
/* Validation                                                          */
/* ------------------------------------------------------------------ */

const optionalText = (max: number, message: string) =>
  z
    .string()
    .trim()
    .max(max, message)
    .transform((v) => (v === "" ? null : v))
    .nullable()
    .optional()
    .transform((v) => v ?? null);

/** `projectTypes` are the published package slugs; "other" is always allowed. */
export function leadSchema(projectTypes: readonly string[]) {
  const allowed = new Set([...projectTypes, OTHER_PROJECT]);
  return z.object({
    name: z.string().trim().min(2, "Please enter your name.").max(100, "That name is too long."),
    email: z.string().trim().toLowerCase().pipe(z.email("Enter a valid email address.").max(254)),
    phone: optionalText(30, "That number is too long.").refine((v) => v === null || /^\+?[0-9][0-9 ()-]{5,28}$/.test(v), {
      message: "Use digits, spaces or +, e.g. +232 76 000 000.",
    }),
    company: optionalText(120, "That name is too long."),
    projectType: z.string().refine((v) => allowed.has(v), "Choose a project type."),
    budgetCurrency: z.enum(LEAD_CURRENCIES, { error: "Choose a currency." }),
    budget: z.enum(BUDGET_KEYS, { error: "Choose a budget range." }),
    deadline: optionalText(60, "Keep the deadline short, e.g. “End of March”."),
    message: z
      .string()
      .trim()
      .min(20, "Tell me a little more (at least 20 characters).")
      .max(5000, "Please keep it under 5,000 characters."),
    source: z.enum(SOURCE_KEYS, { error: "Tell me how you found us." }),
  });
}
export type LeadInput = z.output<ReturnType<typeof leadSchema>>;

/* ------------------------------------------------------------------ */
/* Reference numbers                                                   */
/* ------------------------------------------------------------------ */

/** SC-LEAD-2026-0001 — one sequence per year. */
export function formatLeadReference(year: number, n: number): string {
  return `SC-LEAD-${year}-${String(n).padStart(4, "0")}`;
}
export const LEAD_REFERENCE_RE = /^SC-LEAD-\d{4}-\d{4,}$/;

/* ------------------------------------------------------------------ */
/* Spam protection (K-14) — no third-party captcha                     */
/* ------------------------------------------------------------------ */

export const SPAM_RULES = {
  /** Name of the hidden field real people never fill in. */
  honeypotField: "website",
  /** A human can't read and fill the form faster than this. */
  minFillMs: 3_000,
  /** The form timestamp expires (stale tab or replayed request). */
  maxFillMs: 24 * 60 * 60 * 1000,
  /** Per IP address. */
  rateLimit: { max: 3, windowMs: 10 * 60 * 1000 },
} as const;

export type SpamVerdict = { ok: true } | { ok: false; reason: "honeypot" | "too_fast" | "expired" | "bad_token" };

/** Checks the honeypot and the time the form took to fill (the token is the render time). */
export function spamCheck(input: { honeypot: unknown; startedAt: unknown; now?: number }): SpamVerdict {
  if (typeof input.honeypot === "string" && input.honeypot.trim() !== "") return { ok: false, reason: "honeypot" };
  const started = Number(input.startedAt);
  if (!Number.isFinite(started) || started <= 0) return { ok: false, reason: "bad_token" };
  const elapsed = (input.now ?? Date.now()) - started;
  if (elapsed < SPAM_RULES.minFillMs) return { ok: false, reason: "too_fast" };
  if (elapsed > SPAM_RULES.maxFillMs) return { ok: false, reason: "expired" };
  return { ok: true };
}

/** Admin inbox filters, parsed leniently from URL params. */
export const leadFiltersSchema = z.object({
  status: z.enum(LEAD_STATUSES).optional(),
  q: z.string().trim().max(100).optional(),
  page: z.coerce.number().int().min(1).max(10_000).default(1),
});
export type LeadFilters = z.output<typeof leadFiltersSchema>;
export function parseLeadFilters(params: Record<string, string | string[] | undefined>): LeadFilters {
  const one = (k: string) => {
    const v = params[k];
    const s = (Array.isArray(v) ? v[0] : v)?.trim();
    return s ? s : undefined;
  };
  const status = leadFiltersSchema.shape.status.safeParse(one("status"));
  const q = leadFiltersSchema.shape.q.safeParse(one("q"));
  const page = leadFiltersSchema.shape.page.safeParse(one("page") ?? 1);
  return {
    status: status.success ? status.data : undefined,
    q: q.success ? q.data : undefined,
    page: page.success ? page.data : 1,
  };
}

export const noteSchema = z.string().trim().min(1, "Write a note first.").max(2000, "Keep notes under 2,000 characters.");
