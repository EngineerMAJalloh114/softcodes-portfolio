/**
 * Screenshots for R1b Part 1 — blog (1440 + 390, dark + light) → docs/screenshots/r1b-blog-*.
 * Sample posts (published, with a generated cover image) and a throwaway owner are created
 * and removed afterwards; the public cache is refreshed through a real admin action.
 *   APP_URL=http://localhost:3100 npx tsx --conditions=react-server scripts/screenshots-r1b-blog.ts
 */
import { readFileSync } from "node:fs";
import { deflateSync } from "node:zlib";
import { eq, like } from "drizzle-orm";
import { scriptDb, schema } from "./db/client";
import { APP, SESSION_COOKIE, createSignedInUser, deleteUsers, type TestUser } from "./lib/test-users";

process.env.DB_DRIVER ??= "neon-http";

type Page = { route(p: string, h: (r: { request(): { url(): string }; fulfill(o: object): Promise<void> }) => Promise<void>): Promise<void>; goto(u: string, o?: object): Promise<unknown>; screenshot(o: object): Promise<unknown>; waitForTimeout(ms: number): Promise<void>; evaluate(fn: () => void): Promise<void> };
type Context = { addCookies(c: object[]): Promise<void>; newPage(): Promise<Page>; close(): Promise<void> };

/**
 * The image optimizer can't reach the storage host from this sandbox (DNS), so for the
 * screenshots only, /_next/image requests are answered with the original file.
 */
async function serveOriginals(page: Page) {
  await page.route("**/_next/image**", async (route) => {
    const original = new URL(route.request().url()).searchParams.get("url") ?? "";
    const res = await fetch(original.startsWith("/") ? APP + original : original);
    await route.fulfill({ status: res.status, contentType: res.headers.get("content-type") ?? "image/png", body: Buffer.from(await res.arrayBuffer()) });
  });
}
type Browser = { newContext(o: object): Promise<Context>; close(): Promise<void> };

/** Gradient PNG (dusk → mist) as a stand-in cover image. */
function samplePng(w: number, h: number): Buffer {
  const t = Array.from({ length: 256 }, (_, n) => {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    return c >>> 0;
  });
  const crc = (b: Buffer) => {
    let c = 0xffffffff;
    for (const x of b) c = t[(c ^ x) & 0xff] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
  };
  const chunk = (type: string, data: Buffer) => {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length);
    const td = Buffer.concat([Buffer.from(type), data]);
    const c = Buffer.alloc(4);
    c.writeUInt32BE(crc(td));
    return Buffer.concat([len, td, c]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  const rows: Buffer[] = [];
  for (let y = 0; y < h; y++) {
    const row = [0];
    for (let x = 0; x < w; x++) {
      const k = (x + y) / (w + h);
      row.push(Math.round(53 + 146 * k), Math.round(58 + 150 * k), Math.round(62 + 155 * k));
    }
    rows.push(Buffer.from(row));
  }
  return Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), chunk("IHDR", ihdr), chunk("IDAT", deflateSync(Buffer.concat(rows))), chunk("IEND", Buffer.alloc(0))]);
}

const p = (text: string, marks?: unknown[]) => ({ type: "paragraph", content: [{ type: "text", text, ...(marks ? { marks } : {}) }] });
const SAMPLE_BODY = (imageRef: string, imageSrc: string) => ({
  type: "doc",
  content: [
    p("Most small businesses in Freetown don't need a complicated website. They need one that loads fast on a phone, says clearly what they do, and lets customers get in touch in one tap."),
    { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Start with the one thing visitors came for" }] },
    p("Before choosing colours or fonts, write down the single action you want a visitor to take.", [{ type: "bold" }]),
    {
      type: "bulletList",
      content: ["A clear headline that says what you do", "A WhatsApp button that's always in reach", "Prices, or at least a ‘from’ price"].map((t) => ({ type: "listItem", content: [p(t)] })),
    },
    { type: "image", attrs: { ref: imageRef, src: imageSrc, alt: "Sample illustration" } },
    { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Keep it easy to change" }] },
    p("If updating your opening hours needs a developer, the site will soon be out of date. An admin panel fixes that."),
    { type: "blockquote", content: [p("The best website is the one you can keep up to date yourself.")] },
    { type: "codeBlock", attrs: { language: "bash" }, content: [{ type: "text", text: "npm run build && npm start" }] },
    { type: "paragraph", content: [{ type: "text", text: "Questions? " }, { type: "text", text: "Get in touch", marks: [{ type: "link", attrs: { href: "/contact" } }] }, { type: "text", text: "." }] },
  ],
});

function actionId(name: string): string {
  const manifest = JSON.parse(readFileSync(".next/server/server-reference-manifest.json", "utf8"));
  const entry = Object.entries(manifest.node as Record<string, { exportedName?: string; filename?: string }>).find(([, v]) => v.exportedName === name && (v.filename ?? "").includes("admin/content/actions"));
  return entry![0];
}
/** Re-publish a category through the real admin action: refreshes the public cache (updateTag). */
async function refresh(owner: TestUser, categoryId: number) {
  await owner.client.raw(`/admin/blog/categories/${categoryId}`, {
    method: "POST",
    body: JSON.stringify(["postCategories", categoryId, true]),
    headers: { "next-action": actionId("setItemPublishedAction"), accept: "text/x-component", "content-type": "text/plain;charset=UTF-8" },
  });
}

const SAMPLES = [
  { slug: "shots-simple-website", title: "What a small business website really needs", excerpt: "Fast on a phone, clear about what you do, and one tap to reach you — everything else is optional.", category: "guides", tags: ["websites", "small business"], publishedAt: "2026-11-18", featured: true },
  { slug: "shots-whatsapp-orders", title: "Taking orders on WhatsApp without losing track", excerpt: "A simple flow that turns chats into orders you can actually follow up.", category: "guides", tags: ["whatsapp"], publishedAt: "2026-11-10", featured: false },
  { slug: "shots-soft-codes-update", title: "Soft CODES: what's new this month", excerpt: "New pricing page, FAQs and a quote form that lands straight in the inbox.", category: "updates", tags: ["soft codes"], publishedAt: "2026-11-02", featured: false },
  { slug: "shots-owner-admin", title: "Why every site we build has an admin panel", excerpt: "Owners should be able to change prices, photos and text themselves.", category: "updates", tags: ["admin"], publishedAt: "2026-10-20", featured: false },
];

async function main() {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { chromium } = require("playwright") as { chromium: { launch(): Promise<Browser> } };
  const db = scriptDb();
  const owner = await createSignedInUser("owner", { tag: "shots" });
  const actor = { userId: owner.id, role: "owner" as const };
  const { uploadMedia, deleteMedia } = await import("../src/lib/content/media");
  const { publicUrl } = await import("../src/lib/storage");
  const cover = await uploadMedia(actor, { file: new File([new Uint8Array(samplePng(1200, 675))], "sample-cover.png", { type: "image/png" }), alt: "Sample cover" });
  if (!cover.ok) throw new Error("upload failed");
  const [cat] = await db.select({ id: schema.postCategories.id }).from(schema.postCategories).where(eq(schema.postCategories.slug, "guides"));
  const browser = await chromium.launch();
  const cookie = { name: SESSION_COOKIE, value: owner.client.jar.get(SESSION_COOKIE)!, domain: new URL(APP).hostname, path: "/", httpOnly: true, secure: true, sameSite: "Lax" };
  const shot = (page: Page, name: string, width: number, scheme: string, fullPage = true) => page.screenshot({ path: `docs/screenshots/r1b-blog-${name}-${width}-${scheme}.png`, fullPage });
  try {
    const src = publicUrl(cover.item.key);
    await db.insert(schema.posts).values(
      SAMPLES.map((s, i) => ({ ...s, coverImage: i === 2 ? null : cover.item.ref, body: SAMPLE_BODY(cover.item.ref, src), sortOrder: 100 + i, published: true })),
    );
    await refresh(owner, cat.id);
    const [first] = await db.select({ id: schema.posts.id }).from(schema.posts).where(eq(schema.posts.slug, SAMPLES[0].slug));
    const [welcome] = await db.select({ id: schema.posts.id }).from(schema.posts).where(eq(schema.posts.slug, "welcome"));

    for (const scheme of ["dark", "light"] as const) {
      for (const width of [1440, 390]) {
        const opts = { viewport: { width, height: 900 }, colorScheme: scheme, reducedMotion: "reduce", deviceScaleFactor: 1 };
        const pub = await browser.newContext(opts);
        const pg = await pub.newPage();
        await serveOriginals(pg);
        await pg.goto(`${APP}/blog`, { waitUntil: "networkidle" });
        await shot(pg, "index", width, scheme);
        await pg.goto(`${APP}/blog?category=guides`, { waitUntil: "networkidle" });
        await shot(pg, "category", width, scheme);
        await pg.goto(`${APP}/blog/${SAMPLES[0].slug}`, { waitUntil: "networkidle" });
        await shot(pg, "post", width, scheme);
        await pg.goto(`${APP}/`, { waitUntil: "networkidle" });
        await pg.evaluate(() => document.getElementById("blog")?.scrollIntoView());
        await pg.waitForTimeout(300);
        await shot(pg, "home-teaser", width, scheme, false);
        await pub.close();

        const adm = await browser.newContext(opts);
        await adm.addCookies([cookie]);
        const a = await adm.newPage();
        await serveOriginals(a);
        await a.goto(`${APP}/admin/blog`, { waitUntil: "networkidle" });
        await shot(a, "admin-posts", width, scheme);
        await a.goto(`${APP}/admin/blog/${first.id}`, { waitUntil: "networkidle" });
        await a.evaluate(() => {
          document.querySelector('[role="toolbar"]')?.scrollIntoView({ block: "start" });
          window.scrollBy(0, -90);
        });
        await a.waitForTimeout(300);
        await shot(a, "admin-editor", width, scheme, false);
        await a.goto(`${APP}/admin/blog/${welcome.id}`, { waitUntil: "networkidle" });
        await shot(a, "admin-welcome-draft", width, scheme, false);
        await a.goto(`${APP}/admin/blog/categories`, { waitUntil: "networkidle" });
        await shot(a, "admin-categories", width, scheme);
        await adm.close();
        console.log(`shot ${scheme} ${width}`);
      }
    }
  } finally {
    await browser.close();
    await db.delete(schema.posts).where(like(schema.posts.slug, "shots-%"));
    await refresh(owner, cat.id);
    await deleteMedia(actor, cover.item.id).catch((e) => console.error("cover not deleted", e));
    await deleteUsers([owner.id]);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
