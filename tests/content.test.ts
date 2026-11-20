import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { COLLECTION_DEFS, SECTION_DEFS, SECTION_KEYS, collectionSchema, sectionSchema } from "../src/lib/content/defs";
import { HREF_RE, emptyObject, isImageRef, mediaIdFromRef, objectSchema } from "../src/lib/content/fields";
import { checkUpload, mediaKey, sanitizeFilename, sniffMime } from "../src/lib/content/media-rules";
import { safePath } from "../src/lib/content/paths";
import { seedContent } from "../src/lib/content/seed-content";

const seed = seedContent();
const sectionSeed: Record<string, unknown> = {
  hero: seed.hero,
  about: seed.about,
  person: (({ location, ...rest }) => (void location, rest))(seed.person), // location lives in Settings
  services_section: { eyebrow: seed.services.eyebrow, heading: seed.services.heading },
  process: seed.process,
  pricing: seed.pricing,
  blog: seed.blog,
  projects_section: seed.projectsSection,
  stack_section: { eyebrow: seed.stack.eyebrow, heading: seed.stack.heading },
  contact_section: seed.contactSection,
  soft_codes: seed.softCodes,
  nav: seed.nav,
  footer: seed.footer,
  site: (({ url, ...rest }) => (void url, rest))(seed.site), // URL is deployment config
  pages: seed.pages,
};

describe("content field specs (A-15, K-15)", () => {
  for (const key of SECTION_KEYS) {
    it(`section "${key}": the spec covers every seeded field (nothing stripped on save)`, () => {
      assert.deepEqual(sectionSchema(key).parse(sectionSeed[key]), sectionSeed[key]);
    });
  }
  it("every seeded project validates and round-trips", () => {
    for (const p of seed.projects) {
      const { isDraft, ...project } = p;
      void isDraft;
      assert.deepEqual(collectionSchema("projects").parse(project), project);
    }
  });
  it("services and stack items validate", () => {
    for (const s of seed.services.items) assert.ok(collectionSchema("services").safeParse(s).success);
    for (const name of seed.stack.items) assert.ok(collectionSchema("stack").safeParse({ name }).success);
  });
  it("rejects bad input with messages", () => {
    const r = sectionSchema("hero").safeParse({ ...seed.hero, pitch: "", primaryCta: { label: "x", kind: "url", href: "javascript:alert(1)" } });
    assert.equal(r.success, false);
    const paths = r.error!.issues.map((i) => i.path.join("."));
    assert.ok(paths.includes("pitch") && paths.includes("primaryCta.href"));
  });
  it("rejects bad project slugs and unknown status/type", () => {
    const base = { ...emptyObject(COLLECTION_DEFS.projects.fields), name: "A", tagline: "t", summary: "s", kind: "k", problem: "p", solution: "s" };
    for (const [patch, field] of [[{ slug: "Bad Slug" }, "slug"], [{ slug: "ok", status: "Done" }, "status"], [{ slug: "ok", status: "Live", type: "game" }, "type"]] as const) {
      const r = collectionSchema("projects").safeParse({ ...base, status: "Live", type: "website", ...patch });
      assert.equal(r.success, false);
      assert.ok(r.error!.issues.some((i) => i.path[0] === field), field);
    }
  });
  it("links: allows site paths, anchors, https, mailto, tel; blocks javascript: and //host", () => {
    for (const ok of ["/projects", "/#about", "#stack", "https://wa.me/1", "mailto:a@b.co", "tel:+232 32"]) assert.ok(HREF_RE.test(ok), ok);
    for (const bad of ["javascript:alert(1)", "//evil.com", "http://insecure.com", "data:text/html,x"]) assert.ok(!HREF_RE.test(bad), bad);
  });
  it("image refs: media:<uuid>, /public paths, https URLs only", () => {
    const id = "6f1c1b4e-8d2a-4c3b-9e1f-2a3b4c5d6e7f";
    assert.ok(isImageRef(`media:${id}`) && isImageRef("/brand/me.jpg") && isImageRef("https://x.y/a.png"));
    assert.ok(!isImageRef("javascript:x") && !isImageRef("media:not-a-uuid") && !isImageRef("//x.y/a.png"));
    assert.equal(mediaIdFromRef(`media:${id}`), id);
    const img = objectSchema([{ name: "src", label: "Image", type: "image" }]);
    assert.deepEqual(img.parse({ src: "" }), { src: null });
  });
  it("every section has a label, description and preview path", () => {
    for (const d of Object.values(SECTION_DEFS)) assert.ok(d.label && d.description && d.path.startsWith("/"));
  });
});

const bytes = (...b: number[]) => new Uint8Array([...b, ...new Array(16).fill(0)]);
const PNG = bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a);
const JPG = bytes(0xff, 0xd8, 0xff, 0xe0);
const PDF = new TextEncoder().encode("%PDF-1.7\n%âãÏÓ\n1 0 obj");
const WEBP = new TextEncoder().encode("RIFF\0\0\0\0WEBPVP8 ");
const SVG = new TextEncoder().encode('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>');

describe("media rules (M-09)", () => {
  it("sniffs real types from bytes", () => {
    assert.equal(sniffMime(PNG), "image/png");
    assert.equal(sniffMime(JPG), "image/jpeg");
    assert.equal(sniffMime(PDF), "application/pdf");
    assert.equal(sniffMime(WEBP), "image/webp");
    assert.equal(sniffMime(SVG), null);
  });
  it("rejects SVG, empty files, and type mismatches", () => {
    assert.equal(checkUpload(SVG, "image/svg+xml").ok, false);
    assert.equal(checkUpload(new Uint8Array(), "image/png").ok, false);
    const mismatch = checkUpload(PDF, "image/png");
    assert.equal(mismatch.ok, false);
    assert.match((mismatch as { error: string }).error, /don't match/);
    assert.equal(checkUpload(new TextEncoder().encode("just text pretending to be a png!!"), "image/png").ok, false);
  });
  it("enforces size limits (images 5 MB, PDF 15 MB)", () => {
    const big = new Uint8Array(5 * 1024 * 1024 + 1);
    big.set(PNG);
    assert.match((checkUpload(big, "image/png") as { error: string }).error, /at most 5 MB/);
    const bigPdf = new Uint8Array(6 * 1024 * 1024);
    bigPdf.set(PDF);
    assert.equal(checkUpload(bigPdf, "application/pdf").ok, true);
  });
  it("accepts a valid upload and reports its kind", () => {
    assert.deepEqual(checkUpload(JPG, "image/jpeg"), { ok: true, mime: "image/jpeg", kind: "image", ext: "jpg" });
    assert.equal((checkUpload(PDF, "application/octet-stream") as { kind: string }).kind, "document");
  });
  it("sanitises names and builds unique storage keys", () => {
    assert.equal(sanitizeFilename("../../Évil Name (1).PNG"), "evil-name-1");
    assert.equal(sanitizeFilename("....png"), "file");
    const k = mediaKey("Hero Shot.png", "png", "6f1c1b4e-8d2a-4c3b-9e1f-2a3b4c5d6e7f", new Date("2026-11-19T00:00:00Z"));
    assert.match(k, /^media\/2026\/11\/6f1c1b4e-[a-z0-9]+-hero-shot\.png$/);
  });
});

describe("preview redirect paths", () => {
  it("only same-site paths", () => {
    assert.equal(safePath("/projects/x"), "/projects/x");
    for (const bad of ["//evil.com", "https://evil.com", "\\\\evil", "/\\evil", null, ""]) assert.equal(safePath(bad), "/");
  });
});
