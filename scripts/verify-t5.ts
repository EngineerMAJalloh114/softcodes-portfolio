/**
 * T5 proof script — content management + media, driven through the real admin UI in a
 * browser (Playwright, pre-installed in this environment) against a production build:
 *
 *   DB_DRIVER=neon-http npm run build && DB_DRIVER=neon-http npx next start -p 3000 &
 *   APP_URL=http://localhost:3000 npm run content:verify
 *
 * Checks: staff/client denied (pages, server actions, preview); hero edit → draft hidden,
 * preview shows it, publish → public page updates with no redeploy; image upload → media
 * library → used in a new project; draft project hidden until published; audit rows.
 * Throwaway users, project and media are removed at the end; hero text is restored.
 * Behind an HTTPS egress proxy, run with NODE_USE_ENV_PROXY=1.
 */
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { deflateSync } from "node:zlib";
import { and, eq, gte, inArray, sql } from "drizzle-orm";
import { scriptDb, schema } from "./db/client";
import { APP, Client, SESSION_COOKIE, createSignedInUser, deleteUsers, type TestUser } from "./lib/test-users";

process.env.DB_DRIVER ??= "neon-http";

let failures = 0;
function check(name: string, ok: boolean, detail = "") {
  if (!ok) failures++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? `  — ${detail}` : ""}`);
}

/* ---------- Playwright (minimal typing; not a project dependency) ---------- */
type Locator = { first(): Locator; click(): Promise<void>; fill(v: string): Promise<void>; textContent(): Promise<string | null>; count(): Promise<number>; waitFor(o?: object): Promise<void>; setInputFiles(f: object): Promise<void> };
type Page = {
  goto(u: string, o?: object): Promise<{ status(): number } | null>;
  locator(sel: string): Locator;
  getByRole(role: string, o: object): Locator;
  content(): Promise<string>;
  on(event: "dialog", cb: (d: { message(): string; accept(): Promise<void>; dismiss(): Promise<void> }) => void): void;
  removeAllListeners(event: string): void;
  waitForURL(pattern: RegExp, o?: object): Promise<void>;
  url(): string;
  waitForTimeout(ms: number): Promise<void>;
  evaluate<T>(fn: () => T): Promise<T>;
  waitForFunction<A>(fn: (arg: A) => boolean, arg: A, o?: object): Promise<unknown>;
};
type Context = { addCookies(c: object[]): Promise<void>; newPage(): Promise<Page>; close(): Promise<void> };
type Browser = { newContext(o?: object): Promise<Context>; close(): Promise<void> };

async function ownerPage(browser: Browser, user: TestUser) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  await ctx.addCookies([
    { name: SESSION_COOKIE, value: user.client.jar.get(SESSION_COOKIE)!, domain: new URL(APP).hostname, path: "/", httpOnly: true, secure: true, sameSite: "Lax" },
  ]);
  return { ctx, page: await ctx.newPage() };
}

/** Click, then return the text of the toast that click produced (the newest one). */
async function clickToast(page: Page, target: Locator): Promise<string> {
  const before = await page.evaluate(() => document.querySelector("[data-toast]:last-child")?.getAttribute("data-toast-id") ?? "");
  await target.click();
  await page.waitForFunction(
    (prev: string) => {
      const id = document.querySelector("[data-toast]:last-child")?.getAttribute("data-toast-id");
      return !!id && id !== prev;
    },
    before,
    { timeout: 30_000 },
  );
  return (await page.locator("[data-toast]:last-child").textContent()) ?? "";
}

/** Fetch a public page as an anonymous visitor (no cookies, no draft mode). */
async function publicText(path: string) {
  const res = await fetch(APP + path, { redirect: "manual" });
  return { status: res.status, text: (await res.text()).replace(/<!--.*?-->/g, "") };
}

/** A real PNG (solid colour) so next/image can optimise it. */
function png(width: number, height: number, rgb: [number, number, number]): Buffer {
  const crcTable = Array.from({ length: 256 }, (_, n) => {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    return c >>> 0;
  });
  const crc = (buf: Buffer) => {
    let c = 0xffffffff;
    for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8);
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
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // truecolour
  const row = Buffer.concat([Buffer.from([0]), Buffer.from(Array.from({ length: width }, () => rgb).flat())]);
  const raw = Buffer.concat(Array.from({ length: height }, () => row));
  return Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), chunk("IHDR", ihdr), chunk("IDAT", deflateSync(raw)), chunk("IEND", Buffer.alloc(0))]);
}

function actionId(name: string): string {
  const manifest = JSON.parse(readFileSync(".next/server/server-reference-manifest.json", "utf8"));
  const entry = Object.entries(manifest.node as Record<string, { exportedName?: string }>).find(([, v]) => v.exportedName === name);
  if (!entry) throw new Error(`${name} not found — run \`npm run build\` first`);
  return entry[0];
}

/** POST straight to a server action as `client` (the permission check answers before the body is read). */
function callAction(client: Client, name: string, path: string, args: unknown[]) {
  return client.raw(path, {
    method: "POST",
    body: JSON.stringify(args),
    headers: { "next-action": actionId(name), accept: "text/x-component", "content-type": "text/plain;charset=UTF-8" },
  });
}

async function main() {
  const db = scriptDb();
  const run = randomUUID().slice(0, 6);
  const users: TestUser[] = [];
  const createdMedia: string[] = [];
  const slug = `t5-test-${run}`;
  const [heroRow] = await db.select().from(schema.contentSections).where(eq(schema.contentSections.key, "hero"));
  const originalHero = heroRow?.data as Record<string, unknown>;
  const t0 = new Date(Date.now() - 2000);
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { chromium } = require("playwright") as { chromium: { launch(): Promise<Browser> } };
  const browser = await chromium.launch();

  try {
    const owner = await createSignedInUser("owner", { tag: "t5" });
    const admin = await createSignedInUser("admin", { tag: "t5" });
    const staff = await createSignedInUser("staff", { tag: "t5" });
    const client = await createSignedInUser("client", { tag: "t5", mfa: false });
    users.push(owner, admin, staff, client);

    /* ---------- 1. permissions ---------- */
    const routes = ["/admin/content", "/admin/content/sections/hero", "/admin/content/services", "/admin/projects", "/admin/projects/new", "/admin/media"];
    for (const u of [staff, client]) {
      const statuses = await Promise.all(routes.map(async (r) => (await u.client.get(r)).status));
      check(`${u.role}: every content/media route → 403`, statuses.every((s) => s === 403), statuses.join(","));
    }
    for (const u of [owner, admin]) {
      const statuses = await Promise.all(routes.map(async (r) => (await u.client.get(r)).status));
      check(`${u.role}: every content/media route → 200`, statuses.every((s) => s === 200), statuses.join(","));
    }
    for (const u of [staff, client]) {
      const save = await callAction(u.client, "saveSectionAction", "/admin/content/sections/hero", ["hero", { ...originalHero, pitch: "hacked" }, true]);
      const del = await callAction(u.client, "deleteMediaAction", "/admin/media", [randomUUID()]);
      const prev = await u.client.get("/api/preview?path=/");
      check(`${u.role}: content + media server actions and preview refused`, save.status === 403 && del.status === 403 && prev.status === 403, `save ${save.status}, media ${del.status}, preview ${prev.status}`);
    }
    const [heroAfterDenied] = await db.select().from(schema.contentSections).where(eq(schema.contentSections.key, "hero"));
    check("refused actions changed nothing", JSON.stringify(heroAfterDenied.data) === JSON.stringify(originalHero) && heroAfterDenied.draft === heroRow.draft);
    check("anonymous preview refused", (await fetch(`${APP}/api/preview?path=/`, { redirect: "manual" })).status === 403);

    const { ctx, page } = await ownerPage(browser, owner);
    try {
      /* ---------- 2. hero edit: draft → preview → publish → live, no redeploy ---------- */
      const newPitch = `T5 live-edit check ${run}: fast, customisable websites.`;
      await page.goto(`${APP}/admin/content/sections/hero`, { waitUntil: "networkidle" });
      await page.locator('textarea[name="pitch"]').fill(newPitch);

      let dialog = "";
      page.on("dialog", (d) => {
        dialog = d.message();
        void d.dismiss();
      });
      await page.locator('a:has-text("← Back")').click();
      await page.waitForTimeout(500);
      check("unsaved-changes warning on leaving the form", dialog.includes("unsaved changes") && page.url().includes("/sections/hero"), dialog);
      page.removeAllListeners("dialog");

      check("save draft → success toast", (await clickToast(page, page.getByRole("button", { name: "Save draft" }))).includes("Draft saved"));
      const beforePublish = await publicText("/");
      check("draft is NOT public yet", beforePublish.status === 200 && !beforePublish.text.includes(newPitch));

      await page.goto(`${APP}/api/preview?path=/`, { waitUntil: "networkidle" });
      const previewHtml = await page.content();
      check("Preview draft shows the unpublished pitch (+ banner)", previewHtml.includes(newPitch) && previewHtml.includes("Previewing drafts"));
      await page.goto(`${APP}/api/preview/exit?path=/`, { waitUntil: "networkidle" });

      await page.goto(`${APP}/admin/content/sections/hero`, { waitUntil: "networkidle" });
      check("publish → success toast", (await clickToast(page, page.getByRole("button", { name: "Publish" }))).includes("Published"));
      let live = await publicText("/");
      for (let i = 0; i < 5 && !live.text.includes(newPitch); i++) {
        await new Promise((r) => setTimeout(r, 1000));
        live = await publicText("/");
      }
      check("public home page shows the new hero text without a redeploy", live.text.includes(newPitch));

      /* ---------- 3. media upload (+ bad file rejected) ---------- */
      const imageName = `t5-shot-${run}.png`;
      await page.goto(`${APP}/admin/media`, { waitUntil: "networkidle" });
      await page.locator('input[name="file"]').setInputFiles({ name: `fake-${run}.png`, mimeType: "image/png", buffer: Buffer.from("this is not really a png file") });
      check("non-image disguised as PNG rejected (MIME sniffing)", (await clickToast(page, page.getByRole("button", { name: "Upload" }))).includes("Unsupported file"));

      await page.locator('input[name="file"]').setInputFiles({ name: imageName, mimeType: "image/png", buffer: png(320, 200, [104, 121, 141]) });
      await page.locator('input[name="alt"]').fill(`T5 test screenshot ${run}`);
      check("upload image → success toast", (await clickToast(page, page.getByRole("button", { name: "Upload" }))).includes("Uploaded"));
      await page.locator(`[data-media="t5-shot-${run}.png"]`).waitFor({ timeout: 15_000 });
      check("uploaded image appears in the media library", (await page.locator(`[data-media="t5-shot-${run}.png"]`).count()) === 1);
      const [mediaRow] = await db.select().from(schema.media).where(eq(schema.media.filename, `t5-shot-${run}.png`));
      if (mediaRow) createdMedia.push(mediaRow.id);
      check("media row: public image/png with alt text", mediaRow?.visibility === "public" && mediaRow.mime === "image/png" && mediaRow.alt === `T5 test screenshot ${run}`);
      const fakeRows = await db.select({ id: schema.media.id }).from(schema.media).where(eq(schema.media.filename, `fake-${run}.png`));
      check("rejected file was not stored", fakeRows.length === 0);

      /* ---------- 4. new draft project using the image ---------- */
      await page.goto(`${APP}/admin/projects/new`, { waitUntil: "networkidle" });
      const fields: Record<string, string> = {
        name: `T5 Test Project ${run}`,
        slug,
        tagline: "A throwaway project for the T5 check.",
        summary: "Created by scripts/verify-t5.ts.",
        kind: "Test",
        problem: "Proving drafts stay private.",
        solution: "Draft, preview, publish.",
      };
      for (const [k, v] of Object.entries(fields)) await page.locator(`[name="${k}"]`).fill(v);
      await page.getByRole("button", { name: "+ Add screenshot" }).click();
      await page.getByRole("button", { name: "Choose from library" }).click();
      await page.locator(`button[data-ref="media:${mediaRow.id}"]`).click();
      await page.locator('[name="screenshots.0.alt"]').fill("T5 screenshot");
      check("create project as draft → success toast", (await clickToast(page, page.getByRole("button", { name: "Create as draft" }))).includes("Created as a draft"));
      await page.waitForURL(/\/admin\/projects\/\d+$/, { timeout: 15_000 });
      const [projectRow] = await db.select().from(schema.projects).where(eq(schema.projects.slug, slug));
      check("project saved unpublished with the media reference", !!projectRow && !projectRow.published && JSON.stringify(projectRow.screenshots).includes(`media:${mediaRow.id}`));

      const list = await publicText("/projects");
      const detail = await publicText(`/projects/${slug}`);
      check("draft project NOT on the public projects page", !list.text.includes(fields.name));
      check("draft project page → 404 for the public", detail.status === 404, `HTTP ${detail.status}`);

      await page.goto(`${APP}/api/preview?path=/projects/${slug}`, { waitUntil: "networkidle" });
      const prevProject = await page.content();
      check("Preview draft shows the unpublished project", prevProject.includes(fields.name));
      await page.goto(`${APP}/api/preview/exit?path=/`, { waitUntil: "networkidle" });

      await page.goto(`${APP}/admin/projects/${projectRow.id}`, { waitUntil: "networkidle" });
      check("publish project → success toast", (await clickToast(page, page.getByRole("button", { name: "Publish" }))).includes("Published"));
      let pub = await publicText(`/projects/${slug}`);
      for (let i = 0; i < 5 && pub.status !== 200; i++) {
        await new Promise((r) => setTimeout(r, 1000));
        pub = await publicText(`/projects/${slug}`);
      }
      const keyEncoded = encodeURIComponent(mediaRow.key);
      check("published project is public (200) and uses the uploaded image via next/image", pub.status === 200 && pub.text.includes(fields.name) && pub.text.includes("/_next/image?url=") && pub.text.includes(keyEncoded), `HTTP ${pub.status}`);
      const { publicUrl } = await import("../src/lib/storage");
      const direct = await fetch(publicUrl(mediaRow.key));
      check(
        "uploaded image is publicly readable from the public bucket (image/png, long cache)",
        direct.status === 200 && direct.headers.get("content-type") === "image/png" && /max-age=31536000/.test(direct.headers.get("cache-control") ?? ""),
        `${direct.status} ${direct.headers.get("content-type")} · ${direct.headers.get("cache-control")}`,
      );
      const imgMatch = pub.text.match(/\/_next\/image\?url=[^"\s]+/);
      const optimised = imgMatch ? await fetch(APP + imgMatch[0].replace(/&amp;/g, "&")) : null;
      if (process.env.HTTPS_PROXY && optimised?.status === 500) {
        // The image optimizer fetches remote images directly; this sandbox only has a proxy.
        console.log("SKIP  optimised image via /_next/image — sandbox has no direct DNS (works on Vercel)");
      } else {
        check("optimised image served (image/*)", !!optimised && optimised.status === 200 && /^image\//.test(optimised.headers.get("content-type") ?? ""), `${optimised?.status} ${optimised?.headers.get("content-type")}`);
      }
      const listAfter = await publicText("/projects");
      check("published project listed on /projects", listAfter.text.includes(fields.name));

      /* ---------- 5. in-use media can't be deleted; cleanup through the UI ---------- */
      await page.goto(`${APP}/admin/media`, { waitUntil: "networkidle" });
      page.on("dialog", (d) => void d.accept());
      check("deleting an image in use is refused", (await clickToast(page, page.locator(`[data-media="t5-shot-${run}.png"] button:has-text("Delete")`))).includes("Still used by"));
      page.removeAllListeners("dialog");

      await page.goto(`${APP}/admin/projects/${projectRow.id}`, { waitUntil: "networkidle" });
      page.on("dialog", (d) => void d.accept());
      check("delete project → success toast", (await clickToast(page, page.getByRole("button", { name: "Delete" }))).includes("Deleted"));
      await page.waitForURL(/\/admin\/projects$/, { timeout: 15_000 });
      await page.goto(`${APP}/admin/media`, { waitUntil: "networkidle" });
      check("delete media → success toast", (await clickToast(page, page.locator(`[data-media="t5-shot-${run}.png"] button:has-text("Delete")`))).includes("Deleted"));
      page.removeAllListeners("dialog");
      const gone = await publicText(`/projects/${slug}`);
      check("deleted project → 404", gone.status === 404, `HTTP ${gone.status}`);
      const mediaLeft = await db.select().from(schema.media).where(eq(schema.media.id, mediaRow.id));
      check("media row removed", mediaLeft.length === 0);

      /* ---------- 6. restore the hero ---------- */
      await page.goto(`${APP}/admin/content/sections/hero`, { waitUntil: "networkidle" });
      await page.locator('textarea[name="pitch"]').fill(String(originalHero.pitch));
      await clickToast(page, page.getByRole("button", { name: "Publish" }));
      let restored = await publicText("/");
      for (let i = 0; i < 5 && restored.text.includes(newPitch); i++) {
        await new Promise((r) => setTimeout(r, 1000));
        restored = await publicText("/");
      }
      check("hero restored to the original text (live)", restored.text.includes(String(originalHero.pitch)) && !restored.text.includes(newPitch));
    } finally {
      await ctx.close();
    }

    /* ---------- 7. audit rows ---------- */
    const rows = await db
      .select({ action: schema.auditLog.action })
      .from(schema.auditLog)
      .where(and(eq(schema.auditLog.actorUserId, owner.id), gte(schema.auditLog.at, t0)));
    const counts = rows.reduce<Record<string, number>>((m, r) => ((m[r.action] = (m[r.action] ?? 0) + 1), m), {});
    console.log("audit rows by the test owner:", counts);
    for (const action of ["content.section.draft_saved", "content.section.published", "media.uploaded", "content.item.created", "content.item.published", "content.item.deleted", "media.deleted"]) {
      check(`audit row: ${action}`, (counts[action] ?? 0) > 0, String(counts[action] ?? 0));
    }
    const deniedAudit = await db
      .select({ n: sql<number>`count(*)::int` })
      .from(schema.auditLog)
      .where(and(inArray(schema.auditLog.actorUserId, [staff.id, client.id]), sql`(${schema.auditLog.action} like 'content.%' or ${schema.auditLog.action} like 'media.%')`));
    check("no content/media audit rows for staff/client (nothing happened)", deniedAudit[0].n === 0);
  } finally {
    await browser.close();
    // Safety-net cleanup (normally already done through the UI).
    await db.delete(schema.projects).where(eq(schema.projects.slug, slug));
    if (createdMedia.length) {
      const { remove } = await import("../src/lib/storage");
      const leftovers = await db.select().from(schema.media).where(inArray(schema.media.id, createdMedia));
      for (const m of leftovers) await remove(m.key, m.visibility as "public" | "private").catch(() => undefined);
      await db.delete(schema.media).where(inArray(schema.media.id, createdMedia));
    }
    const [hero] = await db.select().from(schema.contentSections).where(eq(schema.contentSections.key, "hero"));
    if (JSON.stringify(hero.data) !== JSON.stringify(originalHero) || hero.draft !== heroRow.draft) {
      await db.update(schema.contentSections).set({ data: originalHero, draft: heroRow.draft }).where(eq(schema.contentSections.key, "hero"));
      console.log("cleanup: hero restored directly in the DB (publish it once from the admin to refresh the cache)");
    }
    await deleteUsers(users.map((u) => u.id));
    console.log("cleanup: test users, project and media removed (audit rows kept — append-only)");
  }
  console.log(failures ? `\n${failures} check(s) FAILED` : "\nall checks passed");
  process.exit(failures ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
