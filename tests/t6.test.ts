import assert from "node:assert/strict";
import { describe, it } from "node:test";
import * as seed from "../src/content/site";
import { COLLECTION_DEFS, collectionSchema, sectionSchema } from "../src/lib/content/defs";
import { faqJsonLd, jsonLdString } from "../src/lib/content/faq-jsonld";
import { ctaSchema, formatMajor, objectSchema, parseMoney } from "../src/lib/content/fields";
import { formatPrice } from "../src/lib/content/money";
import { HIRE_MESSAGE, WHATSAPP_HOST_RE, ctaHref, whatsappDigits, whatsappUrl } from "../src/lib/content/whatsapp";

describe("DEC-37 WhatsApp links come from the Settings number", () => {
  it("builds wa.me links from the display number", () => {
    assert.equal(whatsappDigits("+232 32 829 316"), "23232829316");
    assert.equal(whatsappUrl("+232 32 829 316"), "https://wa.me/23232829316");
    assert.equal(whatsappUrl("+232 77 000 111", HIRE_MESSAGE), `https://wa.me/23277000111?text=${encodeURIComponent(HIRE_MESSAGE)}`);
  });
  it("CTA of kind whatsapp ignores any typed href and uses the Settings number", () => {
    assert.equal(ctaHref({ label: "Hire", kind: "whatsapp", href: "https://wa.me/999" }, "+232 77 000 111"), whatsappUrl("+232 77 000 111", HIRE_MESSAGE));
    assert.equal(ctaHref({ label: "Projects", kind: "url", href: "/projects" }, "+232 77 000 111"), "/projects");
  });
  it("hand-typed WhatsApp links are refused in every link field", () => {
    for (const bad of ["https://wa.me/23232829316", "https://api.whatsapp.com/send?phone=1", "https://chat.whatsapp.com/abc"]) {
      assert.ok(WHATSAPP_HOST_RE.test(bad), bad);
      const href = objectSchema([{ name: "href", label: "Link", type: "href" }]).safeParse({ href: bad });
      assert.equal(href.success, false, bad);
      assert.match(href.error!.issues[0].message, /DEC-37/);
      const cta = ctaSchema("Button").safeParse({ label: "x", kind: "url", href: bad });
      assert.equal(cta.success, false, bad);
    }
  });
  it("CTA validation per link type", () => {
    assert.deepEqual(ctaSchema("B").parse({ label: "Hire", kind: "whatsapp", href: "anything" }), { label: "Hire", kind: "whatsapp", href: "" });
    assert.ok(ctaSchema("B").safeParse({ label: "x", kind: "anchor", href: "/#services" }).success);
    assert.ok(ctaSchema("B").safeParse({ label: "x", kind: "anchor", href: "#stack" }).success);
    assert.equal(ctaSchema("B").safeParse({ label: "x", kind: "anchor", href: "/projects" }).success, false);
    assert.ok(ctaSchema("B").safeParse({ label: "x", kind: "url", href: "https://example.com" }).success);
    assert.equal(ctaSchema("B").safeParse({ label: "x", kind: "url", href: "javascript:alert(1)" }).success, false);
    assert.equal(ctaSchema("B").safeParse({ label: "", kind: "url", href: "/" }).success, false);
  });
  it("the seeded hero uses a WhatsApp CTA, not a typed link", () => {
    assert.equal(seed.hero.secondaryCta.kind, "whatsapp");
    assert.ok(!JSON.stringify(sectionSchema("hero").parse(seed.hero)).includes("wa.me"));
  });
});

describe("pricing (A-08, DEC-25, DEC-38)", () => {
  const DEC38: Record<string, [number, number, string]> = {
    landing: [150, 3_500, ""],
    "business-site": [400, 9_200, ""],
    "site-admin": [900, 20_700, ""],
    "ecommerce-booking": [1_200, 27_600, ""],
    "web-app-platform": [2_500, 57_500, ""],
    "ui-brand": [150, 3_500, ""],
    maintenance: [25, 575, "/month"],
  };
  it("seeded packages match the approved DEC-38 prices exactly (minor units)", () => {
    assert.deepEqual(seed.packages.map((p) => p.slug).sort(), Object.keys(DEC38).sort());
    for (const p of seed.packages) {
      const [usd, sle, unit] = DEC38[p.slug];
      assert.equal(p.priceUsdMinor, usd * 100, `${p.slug} USD`);
      assert.equal(p.priceSleMinor, sle * 100, `${p.slug} SLE`);
      assert.equal(p.unit, unit, `${p.slug} unit`);
    }
  });
  it("every seeded package validates and round-trips", () => {
    for (const p of seed.packages) assert.deepEqual(collectionSchema("packages").parse(p), p);
  });
  it("money: typed major units ↔ stored minor units", () => {
    assert.equal(parseMoney("3,500"), 350_000);
    assert.equal(parseMoney("Le 3,500"), 350_000);
    assert.equal(parseMoney("$25.50"), 2_550);
    assert.equal(parseMoney("1.234"), null);
    assert.equal(parseMoney("abc"), null);
    assert.equal(formatMajor(350_000), "3,500");
    assert.equal(formatMajor(2_550), "25.50");
  });
  it("prices are formatted per currency", () => {
    assert.equal(formatPrice(150_00, "USD"), "$150");
    assert.equal(formatPrice(3_500_00, "SLE"), "Le 3,500");
    assert.equal(formatPrice(57_500_00, "SLE"), "Le 57,500");
  });
  it("money fields reject negative or fractional cents", () => {
    const s = objectSchema(COLLECTION_DEFS.packages.fields.filter((f) => f.type === "money"));
    assert.equal(s.safeParse({ priceUsdMinor: -1, priceSleMinor: 0 }).success, false);
    assert.equal(s.safeParse({ priceUsdMinor: 1.5, priceSleMinor: 0 }).success, false);
  });
});

describe("FAQs (A-09)", () => {
  it("8 seeded FAQs cover the agreed topics and validate", () => {
    assert.equal(seed.faqs.length, 8);
    const text = seed.faqs.map((f) => `${f.question} ${f.answer}`).join(" ").toLowerCase();
    for (const topic of ["start", "deposit", "how long", "owns", "revisions", "hosting", "after launch", "pay"]) assert.ok(text.includes(topic), topic);
    for (const f of seed.faqs) assert.deepEqual(collectionSchema("faqs").parse(f), f);
  });
  it("FAQPage structured data", () => {
    const ld = faqJsonLd([{ question: "Q?", answer: "A." }]);
    assert.equal(ld["@type"], "FAQPage");
    assert.deepEqual(ld.mainEntity[0], { "@type": "Question", name: "Q?", acceptedAnswer: { "@type": "Answer", text: "A." } });
  });
  it("structured data can't break out of its <script> tag", () => {
    const s = jsonLdString(faqJsonLd([{ question: "</script><script>alert(1)</script>", answer: "x" }]));
    assert.ok(!s.includes("</script>"));
  });
});
