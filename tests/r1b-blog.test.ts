import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { RichText } from "../src/components/blog/RichText";
import * as seed from "../src/content/site";
import { articleJsonLd, blogHref, livePosts, paginate, parseBlogQuery, relatedPosts, rssFeed } from "../src/lib/blog/posts";
import { imageRefs, plainText, readingMinutes, resolveDocImages, safeHref, sanitizeDoc, type RichDoc } from "../src/lib/blog/richtext";
import { collectionSchema, sectionSchema } from "../src/lib/content/defs";
import type { BlogPost } from "../src/lib/content/types";

const MEDIA = "media:8f14e45f-ceea-4e7a-9a8b-1c2d3e4f5a6b";
const p = (text: string, marks?: unknown[]) => ({ type: "paragraph", content: [{ type: "text", text, ...(marks ? { marks } : {}) }] });
const html = (doc: unknown) => renderToStaticMarkup(createElement(RichText, { doc }));

describe("rich text sanitiser (DEC-42, K-15)", () => {
  it("keeps the allowed structure", () => {
    const doc = {
      type: "doc",
      content: [
        { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Hi" }] },
        p("bold", [{ type: "bold" }, { type: "italic" }]),
        { type: "bulletList", content: [{ type: "listItem", content: [p("one")] }] },
        { type: "orderedList", attrs: { start: 3 }, content: [{ type: "listItem", content: [p("three")] }] },
        { type: "blockquote", content: [p("quote")] },
        { type: "codeBlock", attrs: { language: "ts" }, content: [{ type: "text", text: "const a = 1 < 2;" }] },
        { type: "horizontalRule" },
        { type: "image", attrs: { ref: MEDIA, src: "https://x.neon.tech/public-assets/a.png", alt: "A" } },
        p("link", [{ type: "link", attrs: { href: "https://example.com" } }]),
      ],
    };
    assert.deepEqual(sanitizeDoc(doc), doc);
  });

  it("drops <script>, iframes, raw HTML and unknown nodes (with their content)", () => {
    const out = sanitizeDoc({
      type: "doc",
      content: [
        { type: "script", content: [{ type: "text", text: "alert(1)" }] },
        { type: "iframe", attrs: { src: "https://evil.example" } },
        { type: "html", text: "<img src=x onerror=alert(1)>" },
        p("safe"),
      ],
    });
    assert.deepEqual(out, { type: "doc", content: [p("safe")] });
    assert.ok(!JSON.stringify(out).includes("alert"));
  });

  it("strips event handlers and any attribute not on the allowlist", () => {
    const out = sanitizeDoc({
      type: "doc",
      content: [
        { type: "image", attrs: { ref: MEDIA, src: "https://x.neon.tech/a.png", alt: "x", onerror: "alert(1)", style: "x" } },
        { type: "paragraph", attrs: { onclick: "alert(1)", class: "x" }, content: [{ type: "text", text: "t", onmouseover: "alert(1)" }] },
      ],
    });
    const s = JSON.stringify(out);
    for (const bad of ["onerror", "onclick", "onmouseover", "style", "class"]) assert.ok(!s.includes(bad), bad);
    const rendered = html(out);
    assert.ok(!/onerror|onclick|alert/.test(rendered), rendered);
  });

  it("removes javascript:, data: and obfuscated links but keeps the text", () => {
    for (const href of ["javascript:alert(1)", "JaVaScRiPt:alert(1)", " javascript:alert(1)", "java\tscript:alert(1)", "data:text/html;base64,PHNjcmlwdD4=", "vbscript:x", "//evil.example"]) {
      const out = sanitizeDoc({ type: "doc", content: [p("click", [{ type: "link", attrs: { href } }])] });
      assert.deepEqual(out.content[0], p("click"), href);
      assert.equal(safeHref(href), null, href);
    }
    for (const ok of ["https://example.com/a?b=1", "http://example.com", "/contact", "#top", "mailto:a@b.co"]) assert.equal(safeHref(ok), ok);
  });

  it("images only from the media library", () => {
    const out = sanitizeDoc({
      type: "doc",
      content: [
        { type: "image", attrs: { src: "https://evil.example/x.png", alt: "x" } },
        { type: "image", attrs: { ref: "media:not-a-uuid", src: "javascript:alert(1)" } },
        { type: "image", attrs: { ref: MEDIA, src: "javascript:alert(1)", alt: "ok" } },
      ],
    });
    assert.deepEqual(out.content, [{ type: "image", attrs: { ref: MEDIA, src: "", alt: "ok" } }]);
  });

  it("h1 becomes h2 (the title is the page's h1); bad input → empty document", () => {
    assert.equal((sanitizeDoc({ type: "doc", content: [{ type: "heading", attrs: { level: 1 }, content: [] }] }).content[0] as { attrs: { level: number } }).attrs.level, 2);
    for (const bad of [null, "nope", 42, { type: "nope" }, "{broken json"]) assert.deepEqual(sanitizeDoc(bad), { type: "doc", content: [{ type: "paragraph" }] });
  });

  it("survives deep nesting and huge documents", () => {
    let node: unknown = p("deep");
    for (let i = 0; i < 100; i++) node = { type: "blockquote", content: [node] };
    assert.doesNotThrow(() => sanitizeDoc({ type: "doc", content: [node] }));
    const many = { type: "doc", content: Array.from({ length: 30_000 }, () => p("x")) };
    assert.ok(sanitizeDoc(many).content.length <= 20_000);
  });

  it("renders to safe HTML (React escapes text; links get rel)", () => {
    const out = html({
      type: "doc",
      content: [p("<script>alert(1)</script>"), p("ext", [{ type: "link", attrs: { href: "https://example.com" } }]), p("int", [{ type: "link", attrs: { href: "/contact" } }])],
    });
    assert.ok(!out.includes("<script>"), out);
    assert.ok(out.includes("&lt;script&gt;"));
    assert.match(out, /<a href="https:\/\/example.com" target="_blank" rel="noopener noreferrer nofollow">ext<\/a>/);
    assert.match(out, /<a href="\/contact">int<\/a>/);
  });
});

describe("derived values", () => {
  const doc = sanitizeDoc({ type: "doc", content: [p("word ".repeat(450).trim()), { type: "image", attrs: { ref: MEDIA, src: "", alt: "Alt" } }] });
  it("reading time ≈ words / 200, at least 1", () => {
    assert.equal(readingMinutes(doc), 2);
    assert.equal(readingMinutes(sanitizeDoc({ type: "doc", content: [p("hi")] })), 1);
    assert.ok(plainText(doc).startsWith("word word"));
  });
  it("image refs are collected and re-resolved (missing → removed)", () => {
    assert.deepEqual(imageRefs(doc), [MEDIA]);
    const resolved = resolveDocImages(doc, () => "https://cdn.example/a.png");
    assert.equal((resolved.content[1] as { attrs: { src: string } }).attrs.src, "https://cdn.example/a.png");
    assert.equal(resolveDocImages(doc, () => null).content.length, 1);
  });
});

const post = (slug: string, o: Partial<BlogPost> = {}): BlogPost => ({
  slug,
  title: slug,
  excerpt: `About ${slug}`,
  coverImage: null,
  category: null,
  tags: [],
  body: sanitizeDoc(null) as RichDoc,
  seoTitle: "",
  seoDescription: "",
  publishedAt: "2026-11-01",
  featured: false,
  readingMinutes: 1,
  updatedAt: "2026-11-01T00:00:00.000Z",
  ...o,
});

describe("blog listing (M-05)", () => {
  const now = new Date("2026-11-20T12:00:00Z");
  const posts = [
    post("old", { publishedAt: "2026-10-01" }),
    post("new", { publishedAt: "2026-11-19" }),
    post("future", { publishedAt: "2026-12-01" }),
    post("pinned", { publishedAt: "2026-09-01", featured: true }),
    post("draft", { publishedAt: null, isDraft: true }),
  ];
  it("live = published and dated today or earlier; featured first, then newest", () => {
    assert.deepEqual(livePosts(posts, { now }).map((x) => x.slug), ["pinned", "new", "old"]);
  });
  it("preview shows drafts and scheduled posts", () => {
    assert.equal(livePosts(posts, { now, preview: true }).length, 5);
  });
  it("pagination clamps the page", () => {
    const items = Array.from({ length: 20 }, (_, i) => i);
    assert.deepEqual(paginate(items, 3, 9), { items: [18, 19], page: 3, pages: 3 });
    assert.equal(paginate(items, 99, 9).page, 3);
    assert.equal(paginate([], 2, 9).pages, 1);
  });
  it("category filter + page come from the URL; unknown values ignored", () => {
    assert.deepEqual(parseBlogQuery({ category: "guides", page: "2" }, ["guides"]), { category: "guides", page: 2 });
    assert.deepEqual(parseBlogQuery({ category: "<x>", page: "-3" }, ["guides"]), { category: null, page: 1 });
    assert.equal(blogHref({ category: "guides", page: 2 }), "/blog?category=guides&page=2");
    assert.equal(blogHref({ category: null, page: 1 }), "/blog");
  });
  it("related: same category, then shared tags", () => {
    const a = post("a", { category: "guides", tags: ["seo"] });
    const all = [a, post("b", { tags: ["seo"] }), post("c", { category: "guides" }), post("d")];
    assert.deepEqual(relatedPosts(a, all, 2).map((x) => x.slug), ["c", "b"]);
  });
});

describe("RSS + Article structured data", () => {
  it("RSS lists only the posts given, escaped", () => {
    const xml = rssFeed({
      siteUrl: "https://softcodes.example/",
      title: "Blog & news",
      description: "<desc>",
      posts: [post("one", { title: "A & B <c>", category: "guides" })],
      categoryName: () => "Guides",
    });
    assert.ok(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>'));
    assert.ok(xml.includes("<title>A &amp; B &lt;c&gt;</title>"));
    assert.ok(xml.includes("<link>https://softcodes.example/blog/one</link>"));
    assert.ok(xml.includes("<category>Guides</category>"));
    assert.ok(xml.includes("<description>&lt;desc&gt;</description>"));
    assert.equal((xml.match(/<item>/g) ?? []).length, 1);
  });
  it("BlogPosting with dates, author and image", () => {
    const ld = articleJsonLd(post("one", { coverImage: "https://x/a.png", tags: ["a", "b"] }), { siteUrl: "https://s.example", author: "M", publisher: "Soft CODES", logo: "https://s.example/l.png" });
    assert.equal(ld["@type"], "BlogPosting");
    assert.equal(ld.datePublished, "2026-11-01");
    assert.deepEqual(ld.image, ["https://x/a.png"]);
    assert.equal(ld.url, "https://s.example/blog/one");
    assert.equal(ld.keywords, "a, b");
  });
});

describe("admin field validation", () => {
  const base = { ...seed.welcomePost };
  it("the seeded welcome post validates (it is seeded as a draft — DEC-21)", () => {
    const r = collectionSchema("posts").safeParse(base);
    assert.ok(r.success, JSON.stringify(r.error?.issues));
  });
  it("empty body, bad slug, bad date and bad category are refused", () => {
    const r = collectionSchema("posts").safeParse({ ...base, body: { type: "doc", content: [{ type: "paragraph" }] }, slug: "Bad Slug", publishedAt: "20/11/2026", category: "<x>" });
    assert.equal(r.success, false);
    const fields = new Set(r.error!.issues.map((i) => i.path[0]));
    for (const f of ["body", "slug", "publishedAt", "category"]) assert.ok(fields.has(f), f);
  });
  it("a hostile body is cleaned on save, not stored as-is", () => {
    const r = collectionSchema("posts").parse({ ...base, body: { type: "doc", content: [{ type: "script", text: "x" }, p("ok", [{ type: "link", attrs: { href: "javascript:alert(1)" } }])] } });
    assert.deepEqual(r.body, { type: "doc", content: [p("ok")] });
  });
  it("categories and the blog section validate; nav has Blog", () => {
    for (const c of seed.postCategories) assert.ok(collectionSchema("postCategories").safeParse(c).success);
    assert.ok(sectionSchema("blog").safeParse(seed.blog).success);
    assert.ok(seed.nav.links.some((l) => l.href === "/blog"));
  });
});
