/**
 * Screenshots of the T5 admin pages (1440 + 390, dark + light) → docs/screenshots/admin-t5-*.
 * Throwaway owner + one sample image (both removed afterwards).
 *   APP_URL=http://localhost:3000 npx tsx --conditions=react-server scripts/screenshots-t5.ts
 */
import { deflateSync } from "node:zlib";
import { eq } from "drizzle-orm";
import { scriptDb, schema } from "./db/client";
import { APP, SESSION_COOKIE, createSignedInUser, deleteUsers } from "./lib/test-users";

process.env.DB_DRIVER ??= "neon-http";

type Page = { goto(u: string, o?: object): Promise<unknown>; screenshot(o: object): Promise<unknown> };
type Context = { addCookies(c: object[]): Promise<void>; newPage(): Promise<Page>; close(): Promise<void> };
type Browser = { newContext(o: object): Promise<Context>; close(): Promise<void> };

/** Gradient PNG (dusk → mist) as a stand-in screenshot. */
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

async function main() {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { chromium } = require("playwright") as { chromium: { launch(): Promise<Browser> } };
  const { uploadMedia, deleteMedia } = await import("../src/lib/content/media");
  const owner = await createSignedInUser("owner", { tag: "shots" });
  const actor = { userId: owner.id, role: "owner" as const };
  const up = await uploadMedia(actor, {
    file: new File([new Uint8Array(samplePng(480, 300))], "sample-screenshot.png", { type: "image/png" }),
    alt: "Sample screenshot",
  });
  const mediaId = up.ok ? up.item.id : null;
  const [project] = await scriptDb().select({ id: schema.projects.id }).from(schema.projects).where(eq(schema.projects.slug, "tourism-is-life"));
  const pages = [
    ["content", "/admin/content"],
    ["section-hero", "/admin/content/sections/hero"],
    ["projects", "/admin/projects"],
    ["project-edit", `/admin/projects/${project.id}`],
    ["media", "/admin/media"],
  ] as const;
  const browser = await chromium.launch();
  try {
    for (const scheme of ["dark", "light"] as const) {
      for (const width of [1440, 390]) {
        const ctx = await browser.newContext({ viewport: { width, height: 900 }, colorScheme: scheme, reducedMotion: "reduce", deviceScaleFactor: 1 });
        await ctx.addCookies([{ name: SESSION_COOKIE, value: owner.client.jar.get(SESSION_COOKIE)!, domain: new URL(APP).hostname, path: "/", httpOnly: true, secure: true, sameSite: "Lax" }]);
        const page = await ctx.newPage();
        for (const [name, path] of pages) {
          await page.goto(APP + path, { waitUntil: "networkidle" });
          await page.screenshot({ path: `docs/screenshots/admin-t5-${name}-${width}-${scheme}.png`, fullPage: name !== "project-edit" && name !== "section-hero" });
        }
        await ctx.close();
        console.log(`shot ${scheme} ${width}`);
      }
    }
  } finally {
    await browser.close();
    if (mediaId) await deleteMedia(actor, mediaId);
    await deleteUsers([owner.id]);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
