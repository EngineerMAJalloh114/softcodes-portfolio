/**
 * R1b Part 1 proof — blog (M-05) driven through the real admin UI and rich text editor
 * (Playwright, pre-installed here) against a production build, plus direct server-action
 * calls for the sanitiser and permission cases:
 *
 *   DB_DRIVER=neon-http npm run build && DB_DRIVER=neon-http npx next start -p 3100 &
 *   APP_URL=http://localhost:3100 npm run r1b-blog:verify
 *
 * Everything it creates (posts, a category, a sample image, users) is removed at the end.
 * Audit rows stay (append-only). Behind an HTTPS proxy, run with NODE_USE_ENV_PROXY=1.
 */
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { and, eq, gte, inArray, like } from "drizzle-orm";
import { scriptDb, schema } from "./db/client";
import { APP, SESSION_COOKIE, createSignedInUser, deleteUsers, type TestUser } from "./lib/test-users";

process.env.DB_DRIVER ??= "neon-http";

let failures = 0;
function check(name: string, ok: boolean, detail = "") {
  if (!ok) failures++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? `  — ${detail}` : ""}`);
}

type Locator = { first(): Locator; press(k: string): Promise<void>; click(): Promise<void>; fill(v: string): Promise<void>; textContent(): Promise<string | null>; selectOption(v: string): Promise<unknown>; waitFor(o?: object): Promise<void>; count(): Promise<number> };
type Keyboard = { type(t: string, o?: object): Promise<void>; press(k: string): Promise<void> };
type Page = {
  goto(u: string, o?: object): Promise<unknown>;
  locator(sel: string): Locator;
  getByRole(role: string, o: object): Locator;
  keyboard: Keyboard;
  on(event: "dialog", cb: (d: { accept(): Promise<void> }) => void): void;
  waitForURL(p: RegExp, o?: object): Promise<void>;
  waitForTimeout(ms: number): Promise<void>;
  evaluate<T>(fn: () => T): Promise<T>;
  waitForFunction<A>(fn: (a: A) => boolean, a: A, o?: object): Promise<unknown>;
  content(): Promise<string>;
};
type Context = { addCookies(c: object[]): Promise<void>; newPage(): Promise<Page>; close(): Promise<void> };
type Browser = { newContext(o?: object): Promise<Context>; close(): Promise<void> };

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

async function get(path: string) {
  const res = await fetch(APP + path, { redirect: "manual" });
  return { status: res.status, type: res.headers.get("content-type") ?? "", text: (await res.text()).replace(/<!--.*?-->/g, "") };
}
async function eventually(path: string, predicate: (r: { status: number; text: string }) => boolean) {
  let r = await get(path);
  for (let i = 0; i < 8 && !predicate(r); i++) {
    await new Promise((res) => setTimeout(res, 1000));
    r = await get(path);
  }
  return r;
}

function actionId(name: string): string {
  const manifest = JSON.parse(readFileSync(".next/server/server-reference-manifest.json", "utf8"));
  const entry = Object.entries(manifest.node as Record<string, { exportedName?: string; filename?: string }>).find(
    ([, v]) => v.exportedName === name && (v.filename ?? "").includes("admin/content/actions"),
  );
  if (!entry) throw new Error(`${name} not found — run \`npm run build\` first`);
  return entry[0];
}
const callAction = (u: TestUser, path: string, name: string, args: unknown[]) =>
  u.client.raw(path, { method: "POST", body: JSON.stringify(args), headers: { "next-action": actionId(name), accept: "text/x-component", "content-type": "text/plain;charset=UTF-8" } });

// 1×1 PNG for the cover / body image.
const PNG = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "base64");
const rssItems = (xml: string) => [...xml.matchAll(/<item>[\s\S]*?<link>([^<]+)<\/link>/g)].map((m) => m[1]);

async function main() {
  const db = scriptDb();
  const run = randomUUID().slice(0, 6);
  const slug = `r1b-test-${run}`;
  const futureSlug = `r1b-future-${run}`;
  const hostileSlug = `r1b-hostile-${run}`;
  const catSlug = `r1b-cat-${run}`;
  const title = `R1b test post ${run}`;
  const users: TestUser[] = [];
  const t0 = new Date(Date.now() - 2000);
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { chromium } = require("playwright") as { chromium: { launch(): Promise<Browser> } };
  const browser = await chromium.launch();
  const { uploadMedia, deleteMedia } = await import("../src/lib/content/media");
  let imageId: string | null = null;

  try {
    const owner = await createSignedInUser("owner", { tag: "r1b" });
    const staff = await createSignedInUser("staff", { tag: "r1b" });
    const client = await createSignedInUser("client", { tag: "r1b", mfa: false });
    users.push(owner, staff, client);
    const actor = { userId: owner.id, role: "owner" as const };
    const up = await uploadMedia(actor, { file: new File([new Uint8Array(PNG)], `r1b-${run}.png`, { type: "image/png" }), alt: `R1b sample ${run}` });
    imageId = up.ok ? up.item.id : null;
    check("sample image uploaded to the media library (public)", !!imageId);

    /* ---------- 1. permissions ---------- */
    const routes = ["/admin/blog", "/admin/blog/new", "/admin/blog/categories", "/admin/blog/categories/new"];
    for (const u of [staff, client]) {
      const st = await Promise.all(routes.map(async (r) => (await u.client.get(r)).status));
      const act = await callAction(u, "/admin/blog/new", "createItemAction", ["posts", { title: "x" }, true]);
      check(`${u.role}: blog admin pages and create action → 403`, st.every((s) => s === 403) && act.status === 403, `${st.join(",")} · action ${act.status}`);
    }
    const ownerSt = await Promise.all(routes.map(async (r) => (await owner.client.get(r)).status));
    check("owner: blog admin pages → 200", ownerSt.every((s) => s === 200), ownerSt.join(","));
    const staffNav = (await staff.client.get("/admin")).text;
    check("staff sidebar has no Blog link", !staffNav.includes('href="/admin/blog"'));

    /* ---------- 2. baseline: nothing published ---------- */
    const home0 = await get("/");
    check("nav has a Blog link", home0.text.includes('href="/blog"'));
    const welcome = await get("/blog/welcome");
    check("seeded welcome post is a draft: /blog/welcome → 404", welcome.status === 404, String(welcome.status));
    const rss0 = await get("/blog/rss.xml");
    check("RSS feed is valid XML and doesn't list drafts", rss0.status === 200 && rss0.type.includes("application/rss+xml") && rss0.text.startsWith("<?xml") && !rss0.text.includes("/blog/welcome"), rss0.type);

    const ctx = await browser.newContext({ viewport: { width: 1280, height: 1000 } });
    await ctx.addCookies([{ name: SESSION_COOKIE, value: owner.client.jar.get(SESSION_COOKIE)!, domain: new URL(APP).hostname, path: "/", httpOnly: true, secure: true, sameSite: "Lax" }]);
    const page = await ctx.newPage();
    page.on("dialog", (d) => void d.accept());
    try {
      /* ---------- 3. category ---------- */
      await page.goto(`${APP}/admin/blog/categories/new`, { waitUntil: "networkidle" });
      await page.locator('[name="name"]').fill(`Test category ${run}`);
      await page.locator('[name="slug"]').fill(catSlug);
      check("create + publish a category", (await clickToast(page, page.getByRole("button", { name: "Create and publish" }))).includes("Created"));

      /* ---------- 4. post in the rich text editor ---------- */
      await page.goto(`${APP}/admin/blog/new`, { waitUntil: "networkidle" });
      await page.locator('[name="title"]').fill(title);
      await page.locator('[name="slug"]').fill(slug);
      await page.locator('[name="excerpt"]').fill("An automated R1b check post.");
      await page.locator('select[name="category"]').selectOption(catSlug);
      await page.getByRole("button", { name: "+ Add tag" }).click();
      await page.locator('[name="tags.0"]').fill("testing");
      // cover image from the library
      await page.getByRole("button", { name: "Choose from library" }).click();
      await page.locator(`[data-ref="media:${imageId}"]`).click();

      const ed = page.locator("[data-richtext-editor]");
      await ed.click();
      await page.locator('[data-tool="h2"]').click();
      await page.keyboard.type("Getting started");
      await page.keyboard.press("Enter");
      await page.keyboard.type("Plain text and ");
      await page.locator('[data-tool="bold"]').click();
      await page.keyboard.type("bold words");
      await page.locator('[data-tool="bold"]').click();
      await page.keyboard.type(" and ");
      await page.locator('[data-tool="italic"]').click();
      await page.keyboard.type("italic");
      await page.locator('[data-tool="italic"]').click();
      await page.keyboard.press("Enter");
      await page.keyboard.type("- First item");
      await page.keyboard.press("Enter");
      await page.keyboard.type("Second item");
      await page.keyboard.press("Enter");
      await page.keyboard.press("Enter");
      await page.keyboard.type("Read the contact page");
      for (let i = 0; i < "Read the contact page".length; i++) await page.keyboard.press("Shift+ArrowLeft");
      await page.locator('[data-tool="link"]').click();
      await page.locator("[data-link-input]").fill("javascript:alert(1)");
      await page.locator("[data-link-apply]").click();
      const linkRefused = ((await page.locator('[role="alert"]').first().textContent()) ?? "").includes("https://");
      check("editor refuses a javascript: link", linkRefused);
      await page.locator("[data-link-input]").fill("/contact");
      await page.locator("[data-link-apply]").click();
      await page.waitForTimeout(250);
      await ed.press("End");
      await ed.press("Enter");
      await page.locator('[data-tool="image"]').click();
      await page.locator(`[data-insert-ref="media:${imageId}"]`).click();
      await page.waitForTimeout(250);
      await page.locator('[data-tool="code"]').click();
      await page.waitForTimeout(150);
      await page.keyboard.type("const answer = 42;");
      await page.keyboard.press("Enter");
      await page.keyboard.press("Enter");
      await page.keyboard.press("Enter"); // three Enters leave a code block
      await page.waitForTimeout(150);
      await page.keyboard.type("> A wise quote");
      await page.waitForTimeout(250);

      check("create post as draft → toast", (await clickToast(page, page.getByRole("button", { name: "Create as draft" }))).includes("Created as a draft"));
      await page.waitForURL(/\/admin\/blog\/\d+$/, { timeout: 15_000 });
      const [row] = await db.select().from(schema.posts).where(eq(schema.posts.slug, slug));
      const body = JSON.stringify(row?.body ?? {});
      check(
        "stored as sanitised JSON with heading, bold, italic, list, link, image, code, quote",
        !!row && !row.published && ['"heading"', '"bold"', '"italic"', '"bulletList"', '"href":"/contact"', `"ref":"media:${imageId}"`, '"codeBlock"', '"blockquote"'].every((k) => body.includes(k)),
        ['"heading"', '"bold"', '"italic"', '"bulletList"', '"href":"/contact"', '"image"', '"codeBlock"', '"blockquote"'].filter((k) => !body.includes(k)).join(",") || "all present",
      );
      if (process.env.DEBUG_BODY) console.log(body);

      /* ---------- 5. draft hidden ---------- */
      check("draft: /blog/<slug> → 404", (await get(`/blog/${slug}`)).status === 404);
      check("draft: not on /blog", !(await get("/blog")).text.includes(title));
      check("draft: not in RSS", !rssItems((await get("/blog/rss.xml")).text).some((l) => l.endsWith(`/blog/${slug}`)));
      check("draft: not in the sitemap", !(await get("/sitemap.xml")).text.includes(`/blog/${slug}`));
      await page.goto(`${APP}/api/preview?path=/blog/${slug}`, { waitUntil: "networkidle" });
      check("owner preview shows the draft", (await page.content()).includes(title));
      await page.goto(`${APP}/api/preview/exit`, { waitUntil: "networkidle" });

      /* ---------- 6. publish ---------- */
      await page.goto(`${APP}/admin/blog/${row.id}`, { waitUntil: "networkidle" });
      check("publish → toast", (await clickToast(page, page.getByRole("button", { name: "Publish", exact: true }))).includes("Published"));
      const [pubRow] = await db.select().from(schema.posts).where(eq(schema.posts.slug, slug));
      check("publish date defaults to today", pubRow.publishedAt === new Date().toISOString().slice(0, 10), String(pubRow.publishedAt));
      const live = await eventually(`/blog/${slug}`, (r) => r.status === 200);
      const t = live.text;
      check("published: /blog/<slug> → 200 with the title as h1", live.status === 200 && /<h1[^>]*>R1b test post/.test(t));
      check("post page renders the formatted body", ["<h2>Getting started</h2>", "<strong>bold words</strong>", "<em>italic</em>", "<li>", 'href="/contact"', "<pre", "const answer = 42;", "<blockquote>", "<img "].every((s) => t.includes(s)));
      check("reading time, category and cover image shown", /\d+ min read/.test(t) && t.includes(`Test category ${run}`) && t.includes("public-assets"));
      const ld = t.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)?.[1] ?? "";
      check("Article structured data (BlogPosting)", ld.includes('"BlogPosting"') && ld.includes(`"headline":"${title}"`) && ld.includes('"datePublished"'));
      check("per-post metadata: title, description, og:type article, og:image = cover", t.includes(`<title>${title}`) && t.includes('content="An automated R1b check post."') && t.includes('property="og:type" content="article"') && /property="og:image" content="https:\/\/[^"]+public-assets/.test(t));
      const list = await eventually("/blog", (r) => r.text.includes(title));
      check("listed on /blog", list.text.includes(`data-post="${slug}"`));
      const filtered = await get(`/blog?category=${catSlug}`);
      check("category filter link works (?category=…)", filtered.text.includes(`data-post="${slug}"`) && filtered.text.includes(`data-category="${catSlug}"`));
      const rss = await eventually("/blog/rss.xml", (r) => r.text.includes(`/blog/${slug}`));
      check("in the RSS feed", rssItems(rss.text).some((l) => l.endsWith(`/blog/${slug}`)) && rss.text.includes(`<title>${title}</title>`));
      const sm = await eventually("/sitemap.xml", (r) => r.text.includes(`/blog/${slug}`));
      check("in the sitemap", sm.text.includes(`/blog/${slug}`));
      const home = await eventually("/", (r) => r.text.includes("data-latest-posts"));
      check("home shows the “Latest posts” teaser", home.text.includes("data-latest-posts") && home.text.includes(`data-post="${slug}"`));

      /* ---------- 7. edit: draft first, then publish ---------- */
      await page.goto(`${APP}/admin/blog/${row.id}`, { waitUntil: "networkidle" });
      await page.locator('[name="title"]').fill(`${title} (edited)`);
      check("save edit as draft → toast", (await clickToast(page, page.getByRole("button", { name: "Save draft" }))).includes("Draft saved"));
      check("…live post unchanged until published", !(await get(`/blog/${slug}`)).text.includes("(edited)"));
      check("publish the edit → toast", (await clickToast(page, page.getByRole("button", { name: "Publish", exact: true }))).includes("Published"));
      check("…edit is live", (await eventually(`/blog/${slug}`, (r) => r.text.includes("(edited)"))).text.includes("(edited)"));

      /* ---------- 8. sanitiser: hostile body posted straight to the server action ---------- */
      const hostile = {
        title: `Hostile ${run}`,
        slug: hostileSlug,
        excerpt: "x",
        coverImage: null,
        category: null,
        tags: [],
        seoTitle: "",
        seoDescription: "",
        publishedAt: null,
        featured: false,
        body: {
          type: "doc",
          content: [
            { type: "script", content: [{ type: "text", text: "alert('script')" }] },
            { type: "paragraph", attrs: { onclick: "alert('p')" }, content: [{ type: "text", text: "Click me", marks: [{ type: "link", attrs: { href: "javascript:alert('link')" } }] }] },
            { type: "image", attrs: { ref: `media:${imageId}`, src: "x", alt: "pic", onerror: "alert('img')" } },
            { type: "paragraph", content: [{ type: "text", text: "<script>alert('text')</script>" }] },
          ],
        },
      };
      const act = await callAction(owner, "/admin/blog/new", "createItemAction", ["posts", hostile, true]);
      const [h] = await db.select().from(schema.posts).where(eq(schema.posts.slug, hostileSlug));
      const stored = JSON.stringify(h?.body ?? {});
      check("hostile body via the server action is stored sanitised", act.status === 200 && !!h && !stored.includes('"script"') && !stored.includes("onerror") && !stored.includes("onclick") && !stored.includes("javascript:"), stored.slice(0, 160));
      // Render-time defence too: write raw hostile JSON straight into the DB (as if it were
      // tampered with), then refresh the public cache with a harmless publish through the UI.
      await db.update(schema.posts).set({ body: hostile.body, publishedAt: "2020-01-01", published: true, draft: null }).where(eq(schema.posts.slug, hostileSlug));
      await page.goto(`${APP}/admin/blog/${row.id}`, { waitUntil: "networkidle" });
      await clickToast(page, page.getByRole("button", { name: "Publish", exact: true }));
      const hp = await eventually(`/blog/${hostileSlug}`, (r) => r.status === 200);
      const article = hp.text.slice(hp.text.indexOf("data-post-body"), hp.text.indexOf("data-post-body") + 4000);
      check(
        "tampered DB body is still sanitised on render (no script / onerror / onclick / javascript:)",
        hp.status === 200 && !/<script>alert|onerror=|onclick=|javascript:/i.test(article) && article.includes("Click me") && article.includes("&lt;script&gt;"),
        String(hp.status),
      );

      /* ---------- 9. future-dated post stays hidden ---------- */
      await page.goto(`${APP}/admin/blog/new`, { waitUntil: "networkidle" });
      await page.locator('[name="title"]').fill(`Future ${run}`);
      await page.locator('[name="slug"]').fill(futureSlug);
      await page.locator('[name="excerpt"]').fill("Scheduled.");
      await page.locator("[data-richtext-editor]").click();
      await page.keyboard.type("Coming soon.");
      await page.locator('[name="publishedAt"]').fill("2099-01-01");
      check("create + publish a future-dated post", (await clickToast(page, page.getByRole("button", { name: "Create and publish" }))).includes("Created"));
      check("future-dated: 404, not listed, not in RSS/sitemap", (await get(`/blog/${futureSlug}`)).status === 404 && !(await get("/blog")).text.includes(futureSlug) && !(await get("/blog/rss.xml")).text.includes(futureSlug) && !(await get("/sitemap.xml")).text.includes(futureSlug));

      /* ---------- 10. media in use can't be deleted ---------- */
      const del = await deleteMedia(actor, imageId!);
      check("image used by a post can't be deleted from Media", !del.ok && (del.message ?? "").includes("blog post"), del.ok ? "deleted!" : del.message);

      /* ---------- 11. delete through the UI ---------- */
      for (const s of [slug, hostileSlug, futureSlug]) {
        const [r] = await db.select({ id: schema.posts.id }).from(schema.posts).where(eq(schema.posts.slug, s));
        await page.goto(`${APP}/admin/blog/${r.id}`, { waitUntil: "networkidle" });
        await clickToast(page, page.getByRole("button", { name: "Delete" }));
      }
      const [cat] = await db.select({ id: schema.postCategories.id }).from(schema.postCategories).where(eq(schema.postCategories.slug, catSlug));
      await page.goto(`${APP}/admin/blog/categories/${cat.id}`, { waitUntil: "networkidle" });
      await clickToast(page, page.getByRole("button", { name: "Delete" }));
      const after = await eventually("/blog/rss.xml", (r) => !r.text.includes(slug));
      check("deleted: gone from RSS, sitemap and /blog", !after.text.includes(slug) && !(await get("/sitemap.xml")).text.includes(slug) && (await get(`/blog/${slug}`)).status === 404);
      const homeAfter = await eventually("/", (r) => !r.text.includes("data-latest-posts"));
      check("home teaser hidden again when no posts are published", !homeAfter.text.includes("data-latest-posts"));
    } finally {
      await ctx.close();
    }

    /* ---------- 12. audit ---------- */
    const rows = await db
      .select({ action: schema.auditLog.action, entity: schema.auditLog.entity })
      .from(schema.auditLog)
      .where(and(eq(schema.auditLog.actorUserId, owner.id), gte(schema.auditLog.at, t0)));
    const counts = rows.reduce<Record<string, number>>((m, r) => ((m[`${r.entity}:${r.action}`] = (m[`${r.entity}:${r.action}`] ?? 0) + 1), m), {});
    console.log("audit rows by the test owner:", counts);
    for (const key of ["posts:content.item.created", "posts:content.item.draft_saved", "posts:content.item.published", "posts:content.item.created_published", "posts:content.item.deleted", "postCategories:content.item.created_published", "postCategories:content.item.deleted"]) {
      check(`audit row: ${key}`, (counts[key] ?? 0) > 0, String(counts[key] ?? 0));
    }
  } finally {
    await browser.close();
    await db.delete(schema.posts).where(inArray(schema.posts.slug, [slug, futureSlug, hostileSlug]));
    await db.delete(schema.postCategories).where(like(schema.postCategories.slug, `r1b-cat-${run}`));
    if (imageId) await deleteMedia({ userId: users[0]?.id ?? "", role: "owner" }, imageId).catch(() => undefined);
    await deleteUsers(users.map((u) => u.id));
    console.log("cleanup: test posts, category, sample image and users removed (audit rows kept — append-only)");
  }
  console.log(failures ? `\n${failures} check(s) FAILED` : "\nall checks passed");
  process.exit(failures ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
