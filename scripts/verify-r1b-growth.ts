/**
 * R1b Part 2 proof — testimonials (A-16), project filters (M-11), newsletter (M-13).
 * Real browser (Playwright, pre-installed here) plus direct server-action/route calls, against
 * a production build:
 *
 *   DB_DRIVER=neon-http npm run build && DB_DRIVER=neon-http npx next start -p 3100 &
 *   APP_URL=http://localhost:3100 npm run r1b-growth:verify
 *
 * Everything it creates (testimonials, subscribers, rate-limit rows, a sample photo, users) is
 * removed at the end. Audit rows stay (append-only). Behind an HTTPS proxy: NODE_USE_ENV_PROXY=1.
 */
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { and, eq, gte, inArray, like } from "drizzle-orm";
import { projects as seedProjects } from "../src/content/site";
import { scriptDb, schema } from "./db/client";
import { APP, Client, SESSION_COOKIE, createSignedInUser, deleteUsers, type TestUser } from "./lib/test-users";

process.env.DB_DRIVER ??= "neon-http";

let failures = 0;
function check(name: string, ok: boolean, detail = "") {
  if (!ok) failures++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? `  — ${detail}` : ""}`);
}

type Locator = { locator(sel: string): Locator; getByRole(role: string, o: object): Locator; first(): Locator; click(): Promise<void>; fill(v: string): Promise<void>; check(): Promise<void>; textContent(): Promise<string | null>; selectOption(v: string): Promise<unknown>; waitFor(o?: object): Promise<void>; count(): Promise<number> };
type Page = {
  goto(u: string, o?: object): Promise<unknown>;
  url(): string;
  locator(sel: string): Locator;
  getByRole(role: string, o: object): Locator;
  on(event: "dialog", cb: (d: { accept(): Promise<void> }) => void): void;
  waitForURL(p: RegExp, o?: object): Promise<void>;
  waitForTimeout(ms: number): Promise<void>;
  waitForLoadState(s: string): Promise<void>;
  evaluate<T>(fn: () => T): Promise<T>;
  waitForFunction<A>(fn: (a: A) => boolean, a: A, o?: object): Promise<unknown>;
};
type Context = { addCookies(c: object[]): Promise<void>; newPage(): Promise<Page>; close(): Promise<void> };
type Browser = { newContext(o?: object): Promise<Context>; close(): Promise<void> };

const ip = () => `10.66.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250)}`;

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
  return { status: res.status, text: (await res.text()).replace(/<!--.*?-->/g, "") };
}
async function eventually(path: string, predicate: (t: string) => boolean) {
  let r = await get(path);
  for (let i = 0; i < 8 && !predicate(r.text); i++) {
    await new Promise((res) => setTimeout(res, 1000));
    r = await get(path);
  }
  return r;
}

function actionId(name: string, file: string): string {
  const manifest = JSON.parse(readFileSync(".next/server/server-reference-manifest.json", "utf8"));
  const entry = Object.entries(manifest.node as Record<string, { exportedName?: string; filename?: string }>).find(([, v]) => v.exportedName === name && (v.filename ?? "").includes(file));
  if (!entry) throw new Error(`${name} not found — run \`npm run build\` first`);
  return entry[0];
}

/** POST the signup form straight to its server action (React 19.3 FormData encoding, args last). */
async function signup(client: Client, fields: Record<string, string>) {
  const form = new FormData();
  for (const [k, v] of Object.entries(fields)) form.append(`_1_${k}`, v);
  form.append("0", JSON.stringify([{ status: "idle" }, "$K1"]));
  const r = await client.raw("/blog", { method: "POST", body: form, headers: { "next-action": actionId("signupAction", "newsletter/actions"), accept: "text/x-component" } });
  return { status: r.status, sent: r.text.includes('"status":"sent"'), code: r.text.match(/"code":"([a-z_]+)"/)?.[1] ?? null };
}

/** Project card links on a /projects page. */
const cards = (html: string) => [...new Set([...html.matchAll(/href="\/projects\/([a-z0-9-]+)"/g)].map((m) => m[1]))];
const noReviewData = (html: string) => !/"@type":"(Review|AggregateRating)"|itemtype="[^"]*Review|itemprop="(review|rating)/i.test(html);

const PNG = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "base64");

async function main() {
  const db = scriptDb();
  const run = randomUUID().slice(0, 6);
  const mail = (n: string) => `r1bg-${run}-${n}@example.com`;
  const quote = `R1b test quote ${run}: they built exactly what we needed.`;
  const users: TestUser[] = [];
  const t0 = new Date(Date.now() - 2000);
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { chromium } = require("playwright") as { chromium: { launch(): Promise<Browser> } };
  const browser = await chromium.launch();
  const { uploadMedia, deleteMedia } = await import("../src/lib/content/media");
  let photoId: string | null = null;
  const old = (ms = 30_000) => String(Date.now() - ms);

  try {
    const owner = await createSignedInUser("owner", { tag: "r1bg" });
    const staff = await createSignedInUser("staff", { tag: "r1bg" });
    const client = await createSignedInUser("client", { tag: "r1bg", mfa: false });
    users.push(owner, staff, client);
    const actor = { userId: owner.id, role: "owner" as const };
    const up = await uploadMedia(actor, { file: new File([new Uint8Array(PNG)], `r1bg-${run}.png`, { type: "image/png" }), alt: "" });
    photoId = up.ok ? up.item.id : null;

    /* ---------- 1. permissions ---------- */
    for (const u of [staff, client]) {
      const pages = ["/admin/subscribers", "/admin/content/testimonials", "/admin/content/testimonials/new"];
      const st = await Promise.all(pages.map(async (p) => (await u.client.get(p)).status));
      const exp = await u.client.get("/admin/subscribers/export");
      const act = await u.client.raw("/admin/content/testimonials/new", {
        method: "POST",
        body: JSON.stringify(["testimonials", { quote: "x", name: "x" }, true]),
        headers: { "next-action": actionId("createItemAction", "admin/content/actions"), accept: "text/x-component", "content-type": "text/plain;charset=UTF-8" },
      });
      check(`${u.role}: subscribers, CSV export, testimonials admin + create action → 403`, st.every((s) => s === 403) && exp.status === 403 && act.status === 403 && !exp.text.includes("email,status"), `${st.join(",")} · export ${exp.status} · action ${act.status}`);
    }
    const ownerSt = await Promise.all(["/admin/subscribers", "/admin/content/testimonials"].map(async (p) => (await owner.client.get(p)).status));
    check("owner: subscribers + testimonials admin → 200", ownerSt.every((s) => s === 200), ownerSt.join(","));

    /* ---------- 2. project filters (M-11) ---------- */
    const all = cards((await get("/projects")).text);
    const slugsOf = (f: (p: (typeof seedProjects)[number]) => boolean) => seedProjects.filter(f).map((p) => p.slug).sort().join(",");
    const apps = cards((await get("/projects?type=app")).text).sort().join(",");
    check("?type=app shows only app projects", apps === slugsOf((p) => p.type === "app"), apps);
    const pay = cards((await get("/projects?tag=Payments")).text).sort().join(",");
    check("?tag=Payments shows only tagged projects", pay === slugsOf((p) => p.tags.includes("Payments")), pay);
    const none = await get("/projects?type=website&tag=Payments");
    check("no match → empty state with the mascot and a “show all” link", none.text.includes("data-projects-empty") && none.text.includes("mascot-koala") && /href="\/projects"[^>]*>Show all projects/.test(none.text));
    const bogus = await get("/projects?type=spaceship&tag=%3Cscript%3Ealert(1)%3C%2Fscript%3E");
    check("unknown filter values are ignored (all projects, raw input never reflected)", cards(bogus.text).length === all.length && !bogus.text.includes("<script>alert(1)") && !/aria-current="page"[^>]*>(spaceship|&lt;script)/.test(bogus.text));
    check("active filter is marked (aria-current) in the URL-driven page", /aria-current="page"[^>]*data-filter-type="app"|data-filter-type="app"[^>]*aria-current="page"/.test((await get("/projects?type=app")).text));
    const noJs = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 1280, height: 900 } });
    const nj = await noJs.newPage();
    await nj.goto(`${APP}/projects`, { waitUntil: "load" });
    await nj.locator('[data-filter-type="website"]').click();
    await nj.waitForURL(/\/projects\?type=website$/, { timeout: 15_000 });
    const jsOffCards = await nj.evaluate(() => [...new Set([...document.querySelectorAll('a[href^="/projects/"]')].map((a) => a.getAttribute("href")))]);
    check(
      "filters work with JavaScript disabled (plain links, URL ?type=website)",
      nj.url().endsWith("/projects?type=website") && jsOffCards.length === seedProjects.filter((p) => p.type === "website").length,
      jsOffCards.join(","),
    );
    await noJs.close();

    /* ---------- 3. testimonials (A-16) ---------- */
    const homeBefore = await get("/");
    check("no testimonials published → home section hidden", !homeBefore.text.includes("data-testimonials"));
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 1000 }, extraHTTPHeaders: { "x-forwarded-for": ip() } });
    await ctx.addCookies([{ name: SESSION_COOKIE, value: owner.client.jar.get(SESSION_COOKIE)!, domain: new URL(APP).hostname, path: "/", httpOnly: true, secure: true, sameSite: "Lax" }]);
    const page = await ctx.newPage();
    page.on("dialog", (d) => void d.accept());
    try {
      await page.goto(`${APP}/admin/content/testimonials/new`, { waitUntil: "networkidle" });
      await page.locator('[name="quote"]').fill(quote);
      await page.locator('[name="name"]').fill(`Client ${run}`);
      await page.locator('[name="role"]').fill("Owner");
      await page.locator('[name="company"]').fill("Test Co");
      await page.getByRole("button", { name: "Choose from library" }).click();
      await page.locator(`[data-ref="media:${photoId}"]`).click();
      await page.locator('select[name="project"]').selectOption("tourism-is-life");
      await page.locator('select[name="rating"]').selectOption("5");
      check("create testimonial as draft → toast", (await clickToast(page, page.getByRole("button", { name: "Create as draft" }))).includes("Created as a draft"));
      await page.waitForURL(/\/admin\/content\/testimonials\/\d+$/, { timeout: 15_000 });
      check("draft testimonial NOT on the home page or the case study", !(await get("/")).text.includes(quote) && !(await get("/projects/tourism-is-life")).text.includes(quote));
      check("publish → toast", (await clickToast(page, page.getByRole("button", { name: "Publish", exact: true }))).includes("Published"));
      const home = await eventually("/", (t) => t.includes(quote));
      check("published → home “What clients say” section shows it", home.text.includes("data-testimonials") && home.text.includes(quote) && home.text.includes(`Client ${run}`));
      const cs = await eventually("/projects/tourism-is-life", (t) => t.includes(quote));
      check("…and on the linked case study only", cs.text.includes(quote) && !(await get("/projects/bricx-iq")).text.includes(quote));
      check("rating shown visually (stars, aria-label)", home.text.includes('aria-label="Rated 5 out of 5"'));
      check("no Review / AggregateRating structured data anywhere (DEC-44)", noReviewData(home.text) && noReviewData(cs.text));
      check("hide: unpublish → toast", (await clickToast(page, page.getByRole("button", { name: "Unpublish" }))).includes("Unpublished"));
      const hidden = await eventually("/", (t) => !t.includes(quote));
      check("hidden again on home and case study", !hidden.text.includes(quote) && !(await get("/projects/tourism-is-life")).text.includes(quote) && !hidden.text.includes("data-testimonials"));
      const del = await deleteMedia(actor, photoId!);
      check("photo used by a testimonial can't be deleted from Media", !del.ok && (del.message ?? "").includes("testimonial"));
      check("delete testimonial → toast", (await clickToast(page, page.getByRole("button", { name: "Delete" }))).includes("Deleted"));
    } finally {
      await ctx.close();
    }

    /* ---------- 4. newsletter signup in the browser (footer + blog) ---------- */
    const anon = await browser.newContext({ viewport: { width: 1280, height: 900 }, extraHTTPHeaders: { "x-forwarded-for": ip() } });
    const ap = await anon.newPage();
    await ap.goto(`${APP}/`, { waitUntil: "networkidle" });
    await ap.waitForTimeout(3200);
    const footer = ap.locator('[data-newsletter-form="footer"]');
    await footer.locator('input[name="email"]').fill(mail("footer"));
    await footer.getByRole("button", { name: "Subscribe" }).click();
    await ap.locator('[data-newsletter-form="footer"] [role="alert"]').first().waitFor({ timeout: 15_000 });
    check("no consent ticked → refused, nothing stored", ((await footer.locator('[role="alert"]').first().textContent()) ?? "").includes("tick") && (await db.select().from(schema.newsletterSubscribers).where(eq(schema.newsletterSubscribers.email, mail("footer")))).length === 0);
    await footer.locator('input[name="consent"]').check();
    await footer.getByRole("button", { name: "Subscribe" }).click();
    await ap.locator("[data-newsletter-sent]").waitFor({ timeout: 15_000 });
    const [sub] = await db.select().from(schema.newsletterSubscribers).where(eq(schema.newsletterSubscribers.email, mail("footer")));
    const consentText = "I agree to receive the Soft CODES newsletter by email. I can unsubscribe at any time.";
    check(
      "footer signup → stored as pending with consent time + exact wording (DEC-43)",
      !!sub && sub.status === "pending" && sub.source === "footer" && sub.consentText === consentText && Date.now() - sub.consentAt.getTime() < 120_000 && /^[A-Za-z0-9_-]{43}$/.test(sub.unsubscribeToken) && sub.confirmedAt === null,
    );
    await ap.goto(`${APP}/blog`, { waitUntil: "networkidle" });
    await ap.waitForTimeout(3200);
    const blogForm = ap.locator('[data-newsletter-form="blog"]');
    await blogForm.locator('input[name="email"]').fill(mail("blog"));
    await blogForm.locator('input[name="consent"]').check();
    await blogForm.getByRole("button", { name: "Subscribe" }).click();
    await ap.locator("[data-newsletter-sent]").first().waitFor({ timeout: 15_000 });
    const [blogSub] = await db.select().from(schema.newsletterSubscribers).where(eq(schema.newsletterSubscribers.email, mail("blog")));
    check("blog signup form → pending, source blog", blogSub?.status === "pending" && blogSub.source === "blog");
    await anon.close();

    /* ---------- 5. duplicates + spam (direct action calls) ---------- */
    const visitor = new Client(ip());
    const dup = await signup(visitor, { email: mail("footer").toUpperCase(), consent: "on", source: "footer", website: "", startedAt: old() });
    const dupRows = await db.select().from(schema.newsletterSubscribers).where(eq(schema.newsletterSubscribers.email, mail("footer")));
    check("duplicate email (any case) → same success answer, still one row, unchanged", dup.sent && dupRows.length === 1 && dupRows[0].status === "pending" && dupRows[0].consentAt.getTime() === sub.consentAt.getTime());
    const bot = new Client(ip());
    const honey = await signup(bot, { email: mail("honey"), consent: "on", source: "footer", website: "http://spam.example", startedAt: old() });
    const fast = await signup(bot, { email: mail("fast"), consent: "on", source: "footer", website: "", startedAt: String(Date.now() - 300) });
    const noToken = await signup(bot, { email: mail("notoken"), consent: "on", source: "footer", website: "" });
    const spamStored = await db.select().from(schema.newsletterSubscribers).where(inArray(schema.newsletterSubscribers.email, [mail("honey"), mail("fast"), mail("notoken")]));
    check("honeypot / too fast / no form timestamp → refused, nothing stored", honey.code === "spam" && fast.code === "spam" && noToken.code === "spam" && spamStored.length === 0, `${honey.code},${fast.code},${noToken.code}`);
    const flood = new Client(ip());
    const res: string[] = [];
    for (let i = 0; i < 6; i++) {
      const r = await signup(flood, { email: mail(`flood${i}`), consent: "on", source: "footer", website: "", startedAt: old() });
      res.push(r.sent ? "ok" : String(r.code));
    }
    check("rate limit: 5 signups per 10 min per IP, the 6th refused", res.join(",") === "ok,ok,ok,ok,ok,rate_limited", res.join(","));
    check("…another IP is not affected", (await signup(new Client(ip()), { email: mail("other"), consent: "on", source: "footer", website: "", startedAt: old() })).sent);
    const badEmail = await signup(new Client(ip()), { email: "not-an-email", consent: "on", source: "footer", website: "", startedAt: old() });
    check("invalid email over HTTP → refused", badEmail.code === "invalid");

    /* ---------- 6. unsubscribe (ready for T7b) ---------- */
    const u1 = await get(`/newsletter/unsubscribe?token=${sub.unsubscribeToken}`);
    const [stillPending] = await db.select().from(schema.newsletterSubscribers).where(eq(schema.newsletterSubscribers.id, sub.id));
    check("opening the link only shows a button (link scanners can't unsubscribe)", u1.status === 200 && u1.text.includes("Unsubscribe") && stillPending.status === "pending" && u1.text.includes('name="robots" content="noindex'));
    const uctx = await browser.newContext();
    const up2 = await uctx.newPage();
    await up2.goto(`${APP}/newsletter/unsubscribe?token=${sub.unsubscribeToken}`, { waitUntil: "networkidle" });
    await up2.getByRole("button", { name: "Unsubscribe" }).click();
    await up2.locator("[data-unsubscribed]").waitFor({ timeout: 15_000 });
    await uctx.close();
    const [unsub] = await db.select().from(schema.newsletterSubscribers).where(eq(schema.newsletterSubscribers.id, sub.id));
    check("button → unsubscribed (timestamped)", unsub.status === "unsubscribed" && !!unsub.unsubscribedAt);
    const bad = await get("/newsletter/unsubscribe?token=" + "A".repeat(43));
    check("unknown token → “not valid” message", bad.text.includes("data-unsubscribe-invalid"));
    const again = await signup(new Client(ip()), { email: mail("footer"), consent: "on", source: "blog", website: "", startedAt: old() });
    const [re] = await db.select().from(schema.newsletterSubscribers).where(eq(schema.newsletterSubscribers.id, sub.id));
    check("signing up again after unsubscribing → pending with fresh consent", again.sent && re.status === "pending" && re.consentAt > unsub.consentAt && re.unsubscribedAt === null);

    /* ---------- 7. admin subscribers + CSV export ---------- */
    const list = await owner.client.get("/admin/subscribers?status=pending");
    check("admin list shows pending subscribers with status filter", list.status === 200 && list.text.includes(mail("blog")) && list.text.includes('data-status-filter="pending"'));
    const csv = await owner.client.raw("/admin/subscribers/export?status=pending", { method: "GET" });
    const lines = csv.text.trim().split("\r\n");
    check(
      "CSV export: text/csv attachment with header and the test rows",
      csv.status === 200 && (csv.headers.get("content-type") ?? "").startsWith("text/csv") && (csv.headers.get("content-disposition") ?? "").includes("attachment") && lines[0].startsWith("email,status,source,consent_at") && csv.text.includes(mail("blog")) && !csv.text.includes(",unsubscribed,"),
      `${csv.status} ${lines.length - 1} rows`,
    );
    const [exportAudit] = await db
      .select()
      .from(schema.auditLog)
      .where(and(eq(schema.auditLog.action, "newsletter.exported"), eq(schema.auditLog.actorUserId, owner.id), gte(schema.auditLog.at, t0)));
    check("export is audited (who, status, row count)", !!exportAudit && JSON.stringify(exportAudit.data).includes('"status":"pending"') && JSON.stringify(exportAudit.data).includes(`"count":${lines.length - 1}`));
    const staffExports = await db.select().from(schema.auditLog).where(and(eq(schema.auditLog.action, "newsletter.exported"), eq(schema.auditLog.actorUserId, staff.id)));
    check("refused exports leave no audit row and no data", staffExports.length === 0);

    /* ---------- 8. audit ---------- */
    const rows = await db.select({ action: schema.auditLog.action, entity: schema.auditLog.entity, data: schema.auditLog.data }).from(schema.auditLog).where(gte(schema.auditLog.at, t0));
    const has = (a: string, e?: string) => rows.some((r) => r.action === a && (!e || r.entity === e));
    check("audit: testimonial created / published / unpublished / deleted", ["content.item.created", "content.item.published", "content.item.unpublished", "content.item.deleted"].every((a) => has(a, "testimonials")));
    check("audit: newsletter.signup, newsletter.unsubscribed, newsletter.exported", has("newsletter.signup") && has("newsletter.unsubscribed") && has("newsletter.exported"));
    check("audit rows never contain subscriber email addresses", !rows.some((r) => r.action.startsWith("newsletter.") && JSON.stringify(r.data ?? {}).includes("@example.com")));
  } finally {
    await browser.close();
    await db.delete(schema.newsletterSubscribers).where(like(schema.newsletterSubscribers.email, `r1bg-${run}-%`));
    await db.delete(schema.testimonials).where(like(schema.testimonials.quote, `R1b test quote ${run}%`));
    await db.delete(schema.rateLimits).where(like(schema.rateLimits.key, "newsletter:10.66.%"));
    if (photoId) await deleteMedia({ userId: users[0]?.id ?? "", role: "owner" }, photoId).catch(() => undefined);
    await deleteUsers(users.map((u) => u.id));
    console.log("cleanup: test testimonials, subscribers, rate-limit rows, sample photo and users removed (audit rows kept)");
  }
  console.log(failures ? `\n${failures} check(s) FAILED` : "\nall checks passed");
  process.exit(failures ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
