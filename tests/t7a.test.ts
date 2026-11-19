import assert from "node:assert/strict";
import { describe, it } from "node:test";
import * as seed from "../src/content/site";
import { DEFAULT_SETTINGS, settingsSchema } from "../src/lib/admin/settings-schema";
import { can } from "../src/lib/auth/permissions";
import { sectionSchema } from "../src/lib/content/defs";
import { mergeSeed } from "../src/lib/content/merge";
import {
  BUDGETS,
  BUDGET_KEYS,
  LEAD_REFERENCE_RE,
  LEAD_STATUSES,
  SPAM_RULES,
  budgetLabel,
  formatLeadReference,
  leadSchema,
  parseLeadFilters,
  spamCheck,
} from "../src/lib/leads/schema";

const TYPES = seed.packages.map((p) => p.slug);
const valid = {
  name: "Aminata Kamara",
  email: "Aminata@Example.com ",
  phone: "+232 76 123 456",
  company: "",
  projectType: "business-site",
  budgetCurrency: "SLE",
  budget: "500-1500",
  deadline: "End of March",
  message: "We need a website for our guest house with a booking enquiry form.",
  source: "referral",
};

describe("quote request validation (M-03, K-15)", () => {
  it("accepts a valid request and normalises it", () => {
    const r = leadSchema(TYPES).parse(valid);
    assert.equal(r.email, "aminata@example.com");
    assert.equal(r.company, null); // empty optional → null
    assert.equal(r.budgetCurrency, "SLE");
  });
  it("project type must be a published package or “other”", () => {
    assert.ok(leadSchema(TYPES).safeParse({ ...valid, projectType: "other" }).success);
    assert.equal(leadSchema(TYPES).safeParse({ ...valid, projectType: "hacked" }).success, false);
    assert.equal(leadSchema([]).safeParse(valid).success, false); // unpublished package
  });
  it("rejects bad input with a message per field", () => {
    const r = leadSchema(TYPES).safeParse({ name: "A", email: "nope", phone: "call me", projectType: "", budgetCurrency: "EUR", budget: "lots", message: "hi", source: "" });
    assert.equal(r.success, false);
    const fields = new Set(r.error!.issues.map((i) => i.path[0]));
    for (const f of ["name", "email", "phone", "projectType", "budgetCurrency", "budget", "message", "source"]) assert.ok(fields.has(f), f);
  });
  it("caps lengths", () => {
    assert.equal(leadSchema(TYPES).safeParse({ ...valid, message: "x".repeat(5001) }).success, false);
    assert.equal(leadSchema(TYPES).safeParse({ ...valid, deadline: "x".repeat(61) }).success, false);
  });
  it("budget ranges exist in both currencies with the same keys", () => {
    for (const c of ["USD", "SLE"] as const) assert.deepEqual(BUDGETS[c].map((b) => b.key), [...BUDGET_KEYS]);
    assert.equal(budgetLabel("500-1500", "USD"), "$500 – $1,500");
    assert.equal(budgetLabel("500-1500", "SLE"), "Le 11,500 – Le 34,500");
  });
});

describe("reference numbers", () => {
  it("SC-LEAD-YYYY-NNNN", () => {
    assert.equal(formatLeadReference(2026, 1), "SC-LEAD-2026-0001");
    assert.equal(formatLeadReference(2026, 12345), "SC-LEAD-2026-12345");
    assert.match(formatLeadReference(2027, 42), LEAD_REFERENCE_RE);
  });
});

describe("spam protection (K-14)", () => {
  const now = 1_800_000_000_000;
  it("honeypot filled → refused", () => {
    assert.deepEqual(spamCheck({ honeypot: "http://spam", startedAt: now - 60_000, now }), { ok: false, reason: "honeypot" });
  });
  it("faster than a person can type → refused", () => {
    assert.deepEqual(spamCheck({ honeypot: "", startedAt: now - 500, now }), { ok: false, reason: "too_fast" });
  });
  it("missing/forged or stale timestamp → refused", () => {
    assert.equal(spamCheck({ honeypot: "", startedAt: "", now }).ok, false);
    assert.equal(spamCheck({ honeypot: "", startedAt: "abc", now }).ok, false);
    assert.deepEqual(spamCheck({ honeypot: "", startedAt: now - SPAM_RULES.maxFillMs - 1, now }), { ok: false, reason: "expired" });
  });
  it("a real visitor passes", () => {
    assert.deepEqual(spamCheck({ honeypot: "", startedAt: now - 45_000, now }), { ok: true });
    assert.deepEqual(spamCheck({ honeypot: null, startedAt: String(now - SPAM_RULES.minFillMs), now }), { ok: true });
  });
  it("rate limit: 3 per 10 minutes per IP", () => {
    assert.deepEqual(SPAM_RULES.rateLimit, { max: 3, windowMs: 600_000 });
  });
});

describe("leads inbox", () => {
  it("statuses", () => assert.deepEqual([...LEAD_STATUSES], ["new", "contacted", "quoted", "won", "lost", "spam"]));
  it("filters are parsed leniently", () => {
    assert.deepEqual(parseLeadFilters({ status: "quoted", q: " ami ", page: "2" }), { status: "quoted", q: "ami", page: 2 });
    assert.deepEqual(parseLeadFilters({ status: "bogus", page: "-1" }), { status: undefined, q: undefined, page: 1 });
  });
  it("owner, admin and staff read and write leads; clients can't (DEC-36)", () => {
    for (const r of ["owner", "admin", "staff"]) for (const p of ["leads.read", "leads.write"] as const) assert.ok(can(r, p), `${r} ${p}`);
    assert.equal(can("client", "leads.read"), false);
    assert.equal(can("staff", "content.write"), false);
  });
});

describe("settings: WhatsApp button (M-06) and CV file (M-04)", () => {
  const base = { contactEmail: "a@b.co", whatsapp: "+232 32 829 316", location: "Freetown", depositPercent: "50", currencies: ["USD"] };
  it("defaults: button on, no CV", () => {
    assert.equal(DEFAULT_SETTINGS.whatsappButton, true);
    assert.equal(DEFAULT_SETTINGS.cvMediaId, null);
  });
  it("checkbox and file id from the form", () => {
    const on = settingsSchema.parse({ ...base, whatsappButton: "on", cvMediaId: "8f14e45f-ceea-4e7a-9a8b-1c2d3e4f5a6b" });
    assert.equal(on.whatsappButton, true);
    assert.equal(on.cvMediaId, "8f14e45f-ceea-4e7a-9a8b-1c2d3e4f5a6b");
    const off = settingsSchema.parse({ ...base, whatsappButton: null, cvMediaId: "" });
    assert.equal(off.whatsappButton, false);
    assert.equal(off.cvMediaId, null);
    assert.equal(settingsSchema.safeParse({ ...base, cvMediaId: "not-an-id" }).success, false);
  });
});

describe("contact form labels", () => {
  it("seeded labels validate, and stored sections get new labels from the seed", () => {
    assert.ok(sectionSchema("contact_section").safeParse(seed.contactSection).success);
    const stored = { ...seed.contactSection, form: { nameLabel: "Name", submitLabel: "Go" } };
    const merged = mergeSeed(seed.contactSection, stored) as typeof seed.contactSection;
    assert.equal(merged.form.nameLabel, "Name"); // owner edit kept
    assert.equal(merged.form.budgetLabel, seed.contactSection.form.budgetLabel); // new label filled in
    assert.equal(merged.form.submitLabel, "Go");
  });
  it("arrays are replaced, not merged", () => {
    assert.deepEqual(mergeSeed({ a: [1, 2] }, { a: [3] }), { a: [3] });
  });
});
