import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { describe, it } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { TestimonialList } from "../src/components/Testimonials";
import * as seed from "../src/content/site";
import { can } from "../src/lib/auth/permissions";
import { collectionSchema, sectionSchema } from "../src/lib/content/defs";
import { applyProjectFilters, filterOptions, parseProjectFilters, projectsHref } from "../src/lib/content/project-filters";
import { CSV_HEADER, TOKEN_RE, csvCell, parseStatusFilter, signupSchema, subscribersCsv } from "../src/lib/newsletter/schema";

describe("testimonials (A-16, DEC-44)", () => {
  const base = { quote: "Great work, delivered on time.", name: "Aminata K.", role: "Owner", company: "Sweet Salone", photo: null, project: "tourism-is-life", rating: "5" };
  it("validates; rating is optional (\"\") or 1–5; project is a slug or empty", () => {
    assert.ok(collectionSchema("testimonials").safeParse(base).success);
    assert.ok(collectionSchema("testimonials").safeParse({ ...base, rating: "", project: null, role: "", company: "" }).success);
    assert.equal(collectionSchema("testimonials").safeParse({ ...base, rating: "6" }).success, false);
    assert.equal(collectionSchema("testimonials").safeParse({ ...base, quote: "" }).success, false);
    assert.equal(collectionSchema("testimonials").safeParse({ ...base, project: "<x>" }).success, false);
  });
  it("renders the quote with no Review/rating structured data", () => {
    const html = renderToStaticMarkup(
      createElement(TestimonialList, { items: [{ id: 1, quote: "Great <b>work</b>", name: "A", role: "Owner", company: "Co", photo: null, project: null, rating: 4 }] }),
    );
    assert.ok(html.includes("Great &lt;b&gt;work&lt;/b&gt;"));
    assert.ok(html.includes('aria-label="Rated 4 out of 5"'));
    for (const banned of ["application/ld+json", "itemprop", "itemtype", "schema.org", "Review", "AggregateRating"]) assert.ok(!html.includes(banned), banned);
  });
  it("no testimonials are seeded (real quotes only); section labels validate", () => {
    assert.equal("testimonials" in seed, false);
    assert.ok(sectionSchema("testimonials").safeParse(seed.testimonialsSection).success);
  });
});

describe("project filters (M-11)", () => {
  const projects = seed.projects;
  it("options come from the projects themselves", () => {
    const { types, tags } = filterOptions(projects);
    assert.deepEqual(types, ["website", "platform", "app"]);
    assert.ok(tags.includes("Payments"));
  });
  it("URL → filter: unknown values ignored, tags case-insensitive", () => {
    assert.deepEqual(parseProjectFilters({ type: "website" }, projects), { type: "website", tag: null });
    assert.deepEqual(parseProjectFilters({ type: "spaceship", tag: "<script>" }, projects), { type: null, tag: null });
    assert.deepEqual(parseProjectFilters({ tag: "payments" }, projects), { type: null, tag: "Payments" });
    assert.deepEqual(parseProjectFilters({ type: ["app", "website"] }, projects), { type: "app", tag: null });
  });
  it("filtering and links", () => {
    assert.deepEqual(applyProjectFilters(projects, { type: "app", tag: null }).map((p) => p.type), ["app", "app"]);
    assert.equal(applyProjectFilters(projects, { type: "website", tag: "Payments" }).length, 0); // → empty state
    assert.equal(projectsHref({ type: "app", tag: "Africa-first" }), "/projects?type=app&tag=Africa-first");
    assert.equal(projectsHref({}), "/projects");
  });
});

describe("newsletter (M-13, DEC-43, K-14)", () => {
  it("signup: normalised email + explicit consent", () => {
    assert.deepEqual(signupSchema.parse({ email: "  Me@Example.COM ", consent: "on", source: "blog" }), { email: "me@example.com", consent: true, source: "blog" });
    const r = signupSchema.safeParse({ email: "nope", consent: null });
    assert.equal(r.success, false);
    assert.deepEqual(new Set(r.error!.issues.map((i) => i.path[0])), new Set(["email", "consent"]));
    assert.equal(signupSchema.parse({ email: "a@b.co", consent: "on", source: "evil" }).source, "footer");
  });
  it("tokens are 32 random bytes, base64url", () => {
    assert.match(randomBytes(32).toString("base64url"), TOKEN_RE);
    assert.equal(TOKEN_RE.test("short"), false);
    assert.equal(TOKEN_RE.test("x".repeat(42) + "/"), false);
  });
  it("status filter", () => {
    assert.equal(parseStatusFilter("pending"), "pending");
    assert.equal(parseStatusFilter(["confirmed"]), "confirmed");
    assert.equal(parseStatusFilter("deleted"), undefined);
  });
  it("CSV cells are quoted and defused against formula injection", () => {
    assert.equal(csvCell("plain"), "plain");
    assert.equal(csvCell('a,"b"'), '"a,""b"""');
    assert.equal(csvCell("line\nbreak"), '"line\nbreak"');
    for (const evil of ["=HYPERLINK(\"http://x\")", "+1+1", "-2", "@SUM(A1)"]) assert.ok(csvCell(evil).replace(/^"/, "").startsWith("'"), evil);
    assert.equal(csvCell(null), "");
    assert.equal(csvCell(new Date("2026-11-20T10:00:00Z")), "2026-11-20T10:00:00.000Z");
  });
  it("CSV export has a header and one line per subscriber", () => {
    const at = new Date("2026-11-20T10:00:00Z");
    const csv = subscribersCsv([{ email: "a@b.co", status: "pending", source: "footer", consentAt: at, consentText: "I agree, really", createdAt: at, confirmedAt: null, unsubscribedAt: null }]);
    const lines = csv.trim().split("\r\n");
    assert.equal(lines[0], CSV_HEADER.join(","));
    assert.equal(lines[1], '"a@b.co",pending,footer,2026-11-20T10:00:00.000Z,"I agree, really",2026-11-20T10:00:00.000Z,,'.replace('"a@b.co"', "a@b.co"));
  });
  it("only owner and admin manage subscribers (personal data)", () => {
    assert.ok(can("owner", "subscribers.manage") && can("admin", "subscribers.manage"));
    assert.equal(can("staff", "subscribers.manage"), false);
    assert.equal(can("client", "subscribers.manage"), false);
  });
  it("newsletter labels validate", () => {
    assert.ok(sectionSchema("newsletter").safeParse(seed.newsletter).success);
  });
});
