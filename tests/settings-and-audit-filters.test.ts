import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { dateRange, parseAuditFilters } from "../src/lib/admin/audit-filters";
import { DEFAULT_SETTINGS, settingsSchema, whatsappUrl } from "../src/lib/admin/settings-schema";

describe("settings validation (G-20, K-15)", () => {
  const valid = { contactEmail: "a@b.co", whatsapp: "+232 32 829 316", location: "Freetown, Sierra Leone", depositPercent: "50", currencies: ["SLE", "USD"] };

  it("accepts valid input, coerces deposit, orders currencies", () => {
    const r = settingsSchema.parse(valid);
    assert.equal(r.depositPercent, 50);
    assert.deepEqual(r.currencies, ["USD", "SLE"]);
  });
  it("defaults: deposit 50%, USD + SLE", () => {
    assert.equal(DEFAULT_SETTINGS.depositPercent, 50);
    assert.deepEqual(DEFAULT_SETTINGS.currencies, ["USD", "SLE"]);
    assert.ok(settingsSchema.safeParse(DEFAULT_SETTINGS).success);
  });
  for (const [name, patch, field] of [
    ["bad email", { contactEmail: "not-an-email" }, "contactEmail"],
    ["deposit > 100", { depositPercent: "150" }, "depositPercent"],
    ["deposit < 0", { depositPercent: "-1" }, "depositPercent"],
    ["deposit not whole", { depositPercent: "12.5" }, "depositPercent"],
    ["no currency", { currencies: [] }, "currencies"],
    ["unknown currency", { currencies: ["EUR"] }, "currencies"],
    ["letters in WhatsApp", { whatsapp: "call me" }, "whatsapp"],
    ["empty location", { location: " " }, "location"],
  ] as const) {
    it(`rejects ${name}`, () => {
      const r = settingsSchema.safeParse({ ...valid, ...patch });
      assert.equal(r.success, false);
      assert.ok(r.error!.flatten().fieldErrors[field as keyof typeof valid]?.length);
    });
  }
  it("builds wa.me links from the display number", () => {
    assert.equal(whatsappUrl("+232 32 829 316"), "https://wa.me/23232829316");
  });
});

describe("audit log filters (G-19)", () => {
  it("parses valid filters", () => {
    assert.deepEqual(parseAuditFilters({ actor: "u1", action: "auth.sign_in", from: "2026-01-01", to: "2026-01-31", page: "3" }), {
      actor: "u1",
      action: "auth.sign_in",
      from: "2026-01-01",
      to: "2026-01-31",
      page: 3,
    });
  });
  it("drops invalid values instead of failing", () => {
    const f = parseAuditFilters({ action: "DROP TABLE;", from: "yesterday", to: "2026-13-45", page: "-2" });
    assert.deepEqual(f, { page: 1 });
  });
  it("date range is inclusive of the whole 'to' day (UTC)", () => {
    const { start, end } = dateRange("2026-01-01", "2026-01-01");
    assert.equal(start!.toISOString(), "2026-01-01T00:00:00.000Z");
    assert.equal(end!.toISOString(), "2026-01-02T00:00:00.000Z");
  });
});
