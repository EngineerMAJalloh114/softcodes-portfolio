/**
 * Screenshots for R1b Part 2 (1440 + 390, dark + light) → docs/screenshots/r1b-growth-*.
 * Clearly-labelled sample testimonials and subscribers, a generated photo and a throwaway
 * owner are created and removed afterwards; the public cache is refreshed through a real
 * admin action. For screenshots only, /_next/image requests get the original file (the
 * optimizer can't reach the storage host from this sandbox).
 *   APP_URL=http://localhost:3100 npx tsx --conditions=react-server scripts/screenshots-r1b-growth.ts
 */
import { randomBytes } from "node:crypto";
import { readFileSync } from "node:fs";
import { deflateSync } from "node:zlib";
import { like } from "drizzle-orm";
import { scriptDb, schema } from "./db/client";
import { APP, SESSION_COOKIE, createSignedInUser, deleteUsers, type TestUser } from "./lib/test-users";

process.env.DB_DRIVER ??= "neon-http";

type Locator = { first(): Locator; click(): Promise<void>; fill(v: string): Promise<void>; check(): Promise<void>; waitFor(o?: object): Promise<void>; locator(s: string): Locator; scrollIntoViewIfNeeded(): Promise<void> };
type Page = {
  route(p: string, h: (r: { request(): { url(): string }; fulfill(o: object): Promise<void> }) => Promise<void>): Promise<void>;
  goto(u: string, o?: object): Promise<unknown>;
  screenshot(o: object): Promise<unknown>;
  waitForTimeout(ms: number): Promise<void>;
  evaluate(fn: () => void): Promise<void>;
  locator(s: string): Locator;
};
type Context = { addCookies(c: object[]): Promise<void>; newPage(): Promise<Page>; close(): Promise<void> };
type Browser = { newContext(o: object): Promise<Context>; close(): Promise<void> };

async function serveOriginals(page: Page) {
  await page.route("**/_next/image**", async (route) => {
    const original = new URL(route.request().url()).searchParams.get("url") ?? "";
    const res = await fetch(original.startsWith("/") ? APP + original : original);
    await route.fulfill({ status: res.status, contentType: res.headers.get("content-type") ?? "image/png", body: Buffer.from(await res.arrayBuffer()) });
  });
}

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

function actionId(name: string): string {
  const manifest = JSON.parse(readFileSync(".next/server/server-reference-manifest.json", "utf8"));
  const entry = Object.entries(manifest.node as Record<string, { exportedName?: string; filename?: string }>).find(([, v]) => v.exportedName === name && (v.filename ?? "").includes("admin/content/actions"));
  return entry![0];
}
async function refresh(owner: TestUser, id: number, published: boolean) {
  await owner.client.raw(`/admin/content/testimonials/${id}`, {
    method: "POST",
    body: JSON.stringify(["testimonials", id, published]),
    headers: { "next-action": actionId("setItemPublishedAction"), accept: "text/x-component", "content-type": "text/plain;charset=UTF-8" },
  });
}

const QUOTES = [
  { quote: "Sample testimonial — the site went live on time and we can update prices ourselves.", name: "Sample Client A", role: "Owner", company: "Sample Guest House", project: "tourism-is-life", rating: "5" },
  { quote: "Sample testimonial — bookings now arrive in one place instead of five WhatsApp chats.", name: "Sample Client B", role: "Manager", company: "Sample Events Co", project: "mehtez-barrie-platform", rating: "" },
  { quote: "Sample testimonial — clear quote, clear timeline, and help after launch.", name: "Sample Client C", role: "Founder", company: "Sample Shop", project: null, rating: "4" },
];

async function main() {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { chromium } = require("playwright") as { chromium: { launch(): Promise<Browser> } };
  const db = scriptDb();
  const owner = await createSignedInUser("owner", { tag: "shots" });
  const actor = { userId: owner.id, role: "owner" as const };
  const { uploadMedia, deleteMedia } = await import("../src/lib/content/media");
  const photo = await uploadMedia(actor, { file: new File([new Uint8Array(samplePng(160, 160))], "sample-photo.png", { type: "image/png" }), alt: "" });
  if (!photo.ok) throw new Error("upload failed");
  const browser = await chromium.launch();
  const cookie = { name: SESSION_COOKIE, value: owner.client.jar.get(SESSION_COOKIE)!, domain: new URL(APP).hostname, path: "/", httpOnly: true, secure: true, sameSite: "Lax" };
  const shot = (page: Page, name: string, width: number, scheme: string, fullPage = true) => page.screenshot({ path: `docs/screenshots/r1b-growth-${name}-${width}-${scheme}.png`, fullPage });
  let ids: number[] = [];
  let unsubToken = "";
  try {
    ids = (
      await db
        .insert(schema.testimonials)
        .values(QUOTES.map((q, i) => ({ ...q, photo: i === 1 ? null : photo.item.ref, sortOrder: 100 + i, published: true })))
        .returning({ id: schema.testimonials.id })
    ).map((r) => r.id);
    await refresh(owner, ids[0], true);
    const consentText = "I agree to receive the Soft CODES newsletter by email. I can unsubscribe at any time.";
    const subs = ["shots-a", "shots-b", "shots-c", "shots-d"].map((n, i) => ({
      email: `${n}@example.com`,
      status: (["pending", "pending", "confirmed", "unsubscribed"] as const)[i],
      consentAt: new Date(Date.now() - i * 86_400_000),
      consentText,
      source: i % 2 ? "blog" : "footer",
      unsubscribeToken: randomBytes(32).toString("base64url"),
    }));
    await db.insert(schema.newsletterSubscribers).values(subs);
    unsubToken = subs[0].unsubscribeToken;

    for (const scheme of ["dark", "light"] as const) {
      for (const width of [1440, 390]) {
        const opts = { viewport: { width, height: 900 }, colorScheme: scheme, reducedMotion: "reduce", deviceScaleFactor: 1, extraHTTPHeaders: { "x-forwarded-for": `10.55.${width % 250}.${scheme === "dark" ? 1 : 2}` } };
        const pub = await browser.newContext(opts);
        const pg = await pub.newPage();
        await serveOriginals(pg);
        await pg.goto(`${APP}/`, { waitUntil: "networkidle" });
        await pg.evaluate(() => document.getElementById("testimonials")?.scrollIntoView());
        await pg.waitForTimeout(300);
        await shot(pg, "home-testimonials", width, scheme, false);
        await pg.goto(`${APP}/projects/tourism-is-life`, { waitUntil: "networkidle" });
        await pg.evaluate(() => document.querySelector("[data-testimonials]")?.scrollIntoView({ block: "center" }));
        await pg.waitForTimeout(300);
        await shot(pg, "case-study-testimonial", width, scheme, false);
        await pg.goto(`${APP}/projects?type=app`, { waitUntil: "networkidle" });
        await shot(pg, "projects-filter", width, scheme);
        await pg.goto(`${APP}/projects?type=website&tag=Payments`, { waitUntil: "networkidle" });
        await shot(pg, "projects-empty", width, scheme, false);
        await pg.goto(`${APP}/blog`, { waitUntil: "networkidle" });
        await shot(pg, "blog-newsletter", width, scheme);
        await pg.goto(`${APP}/about`, { waitUntil: "networkidle" });
        await pg.waitForTimeout(3200);
        const form = pg.locator('[data-newsletter-form="footer"]');
        await form.locator('input[name="email"]').fill(`shots-${scheme}-${width}@example.com`);
        await form.locator('input[name="consent"]').check();
        await form.locator("button[type=submit]").click();
        await pg.locator("[data-newsletter-sent]").waitFor({ timeout: 15_000 });
        await pg.evaluate(() => document.querySelector("[data-newsletter-sent]")?.scrollIntoView({ block: "center" }));
        await shot(pg, "footer-signup-success", width, scheme, false);
        await pg.goto(`${APP}/newsletter/unsubscribe?token=${unsubToken}`, { waitUntil: "networkidle" });
        await shot(pg, "unsubscribe", width, scheme, false);
        await pub.close();

        const adm = await browser.newContext(opts);
        await adm.addCookies([cookie]);
        const a = await adm.newPage();
        await serveOriginals(a);
        await a.goto(`${APP}/admin/subscribers`, { waitUntil: "networkidle" });
        await shot(a, "admin-subscribers", width, scheme);
        await a.goto(`${APP}/admin/content/testimonials`, { waitUntil: "networkidle" });
        await shot(a, "admin-testimonials", width, scheme);
        await a.goto(`${APP}/admin/content/testimonials/${ids[0]}`, { waitUntil: "networkidle" });
        await shot(a, "admin-testimonial-edit", width, scheme);
        await adm.close();
        console.log(`shot ${scheme} ${width}`);
      }
    }
  } finally {
    await browser.close();
    // Unpublish through the real action first (refreshes the public cache), then delete.
    for (const id of ids) await refresh(owner, id, false);
    await db.delete(schema.testimonials).where(like(schema.testimonials.name, "Sample Client %"));
    await db.delete(schema.newsletterSubscribers).where(like(schema.newsletterSubscribers.email, "shots-%@example.com"));
    await db.delete(schema.rateLimits).where(like(schema.rateLimits.key, "newsletter:10.55.%"));
    await deleteMedia(actor, photo.item.id).catch((e) => console.error("photo not deleted", e));
    await deleteUsers([owner.id]);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
