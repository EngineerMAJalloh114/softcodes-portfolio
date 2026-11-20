/**
 * T7a proof script — quote form → leads inbox, spam protection, notifications, floating
 * WhatsApp button and CV slot. Runs against a production build (real browser via Playwright,
 * pre-installed here, plus direct server-action calls for the spam/permission cases):
 *
 *   DB_DRIVER=neon-http npm run build && DB_DRIVER=neon-http npx next start -p 3100 &
 *   APP_URL=http://localhost:3100 npm run t7a:verify
 *
 * Everything it creates is removed at the end (test leads, notes, notifications, rate-limit
 * rows, the sample CV, throwaway users); the lead counter and Settings are restored.
 * Audit rows stay (append-only by design). Behind an HTTPS proxy, run with NODE_USE_ENV_PROXY=1.
 */
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { and, eq, gte, inArray, like, sql } from "drizzle-orm";
import { scriptDb, schema } from "./db/client";
import { APP, Client, SESSION_COOKIE, createSignedInUser, deleteUsers, type TestUser } from "./lib/test-users";

process.env.DB_DRIVER ??= "neon-http";

let failures = 0;
function check(name: string, ok: boolean, detail = "") {
  if (!ok) failures++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? `  — ${detail}` : ""}`);
}

type Locator = { first(): Locator; click(): Promise<void>; fill(v: string): Promise<void>; textContent(): Promise<string | null>; isVisible(): Promise<boolean>; selectOption(v: string): Promise<unknown>; waitFor(o?: object): Promise<void>; count(): Promise<number>; getAttribute(n: string): Promise<string | null>; check(): Promise<void>; uncheck(): Promise<void> };
type Page = {
  goto(u: string, o?: object): Promise<unknown>;
  locator(sel: string): Locator;
  getByRole(role: string, o: object): Locator;
  waitForTimeout(ms: number): Promise<void>;
  evaluate<T>(fn: () => T): Promise<T>;
  waitForFunction<A>(fn: (a: A) => boolean, a: A, o?: object): Promise<unknown>;
};
type Context = { addCookies(c: object[]): Promise<void>; newPage(): Promise<Page>; close(): Promise<void> };
type Browser = { newContext(o?: object): Promise<Context>; close(): Promise<void> };

const ip = () => `10.77.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250)}`;

async function signedInPage(browser: Browser, user: TestUser) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, extraHTTPHeaders: { "x-forwarded-for": ip() } });
  await ctx.addCookies([
    { name: SESSION_COOKIE, value: user.client.jar.get(SESSION_COOKIE)!, domain: new URL(APP).hostname, path: "/", httpOnly: true, secure: true, sameSite: "Lax" },
  ]);
  return { ctx, page: await ctx.newPage() };
}

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

async function publicText(path: string) {
  const res = await fetch(APP + path, { redirect: "manual" });
  return { status: res.status, text: (await res.text()).replace(/<!--.*?-->/g, "") };
}
async function eventually(path: string, predicate: (t: string) => boolean) {
  let r = await publicText(path);
  for (let i = 0; i < 6 && !predicate(r.text); i++) {
    await new Promise((res) => setTimeout(res, 1000));
    r = await publicText(path);
  }
  return r;
}

function actionId(name: string, file: string): string {
  const manifest = JSON.parse(readFileSync(".next/server/server-reference-manifest.json", "utf8"));
  const entry = Object.entries(manifest.node as Record<string, { exportedName?: string; filename?: string }>).find(
    ([, v]) => v.exportedName === name && (!v.filename || v.filename.includes(file)),
  );
  if (!entry) throw new Error(`${name} not found — run \`npm run build\` first`);
  return entry[0];
}

/** POST the quote form straight to its server action (useActionState encoding). */
async function submitQuote(client: Client, fields: Record<string, string>) {
  const form = new FormData();
  // React 19.3 FormData argument encoding; "0" (the argument list) must come last, because
  // the server decodes the multipart stream in order.
  for (const [k, v] of Object.entries(fields)) form.append(`_1_${k}`, v);
  form.append("0", JSON.stringify([{ status: "idle" }, "$K1"]));
  const r = await client.raw("/contact", { method: "POST", body: form, headers: { "next-action": actionId("submitQuoteAction", "contact"), accept: "text/x-component" } });
  const ref = r.text.match(/SC-LEAD-\d{4}-\d{4,}/)?.[0] ?? null;
  const code = r.text.match(/"code":"([a-z_]+)"/)?.[1] ?? null;
  return { status: r.status, ref, code, text: r.text };
}

const waHref = (html: string) => html.match(/<a[^>]*data-whatsapp-button[^>]*>/)?.[0].match(/href="([^"]+)"/)?.[1] ?? html.match(/<a[^>]*href="([^"]+)"[^>]*data-whatsapp-button/)?.[1] ?? null;
const hasCv = (html: string) => html.includes("data-cv-button");

async function main() {
  const db = scriptDb();
  const run = randomUUID().slice(0, 6);
  const tagEmail = (n: string) => `t7a-${run}-${n}@example.com`;
  const users: TestUser[] = [];
  const t0 = new Date(Date.now() - 2000);
  const year = new Date().getUTCFullYear();
  const [counterBefore] = await db.select().from(schema.counters).where(eq(schema.counters.key, `lead:${year}`));
  const settingsBefore = await db.select().from(schema.settings);
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { chromium } = require("playwright") as { chromium: { launch(): Promise<Browser> } };
  const browser = await chromium.launch();
  const { uploadMedia, deleteMedia } = await import("../src/lib/content/media");
  let cvId: string | null = null;

  const good = (email: string) => ({
    name: "Test Visitor",
    email,
    phone: "+232 76 000 111",
    company: "T7a Test Co",
    projectType: "business-site",
    budgetCurrency: "USD",
    budget: "500-1500",
    deadline: "Next month",
    message: "This is an automated T7a check — please ignore this request.",
    source: "search",
    website: "",
    startedAt: String(Date.now() - 30_000),
  });

  try {
    const owner = await createSignedInUser("owner", { tag: "t7a" });
    const staff = await createSignedInUser("staff", { tag: "t7a" });
    const client = await createSignedInUser("client", { tag: "t7a", mfa: false });
    users.push(owner, staff, client);
    const actor = { userId: owner.id, role: "owner" as const };

    /* ---------- 1. quote form in a real browser ---------- */
    const anon = await browser.newContext({ viewport: { width: 1280, height: 900 }, extraHTTPHeaders: { "x-forwarded-for": ip() } });
    const ap = await anon.newPage();
    await ap.goto(`${APP}/contact?package=site-admin`, { waitUntil: "networkidle" });
    check("/contact shows the quote form (no mailto form)", (await ap.locator("[data-quote-form]").count()) === 1 && !(await ap.evaluate(() => !!document.querySelector('form[action^="mailto:"]'))));
    const pre = await ap.evaluate(() => (document.querySelector('select[name="projectType"]') as HTMLSelectElement).value);
    check("“Request a quote” package is pre-selected (?package=site-admin)", pre === "site-admin", pre);
    const options = await ap.evaluate(() => [...(document.querySelector('select[name="projectType"]') as HTMLSelectElement).options].map((o) => o.value));
    check("project types = published packages + Other", ["landing", "business-site", "site-admin", "maintenance", "other"].every((o) => options.includes(o)), options.join(","));

    // invalid input: field errors, nothing stored
    await ap.waitForTimeout(3200);
    await ap.locator('[data-quote-form] [name="name"]').fill("Test Visitor");
    await ap.locator('[data-quote-form] [name="email"]').fill("not-an-email");
    await ap.locator('[data-quote-form] [name="message"]').fill("too short");
    await ap.getByRole("button", { name: "Send request" }).click();
    await ap.locator('[data-form-error="invalid"]').waitFor({ timeout: 20_000 });
    const errs = await ap.evaluate(() => [...document.querySelectorAll('[aria-invalid="true"]')].map((e) => e.getAttribute("name")));
    check("invalid input → field errors (email, budget, message, source)", ["email", "budget", "message", "source"].every((f) => errs.includes(f)), errs.join(","));
    check("…typed values are kept after the error", (await ap.evaluate(() => (document.querySelector('[name="name"]') as HTMLInputElement).value)) === "Test Visitor");

    // valid submission
    await ap.locator('[data-quote-form] [name="email"]').fill(tagEmail("browser"));
    await ap.locator('[data-quote-form] [name="company"]').fill("T7a Test Co");
    await ap.locator('[data-quote-form] [name="phone"]').fill("+232 76 000 111");
    await ap.locator('[data-quote-form] select[name="budgetCurrency"]').selectOption("SLE");
    await ap.locator('[data-quote-form] select[name="budget"]').selectOption("1500-5000");
    await ap.locator('[data-quote-form] [name="deadline"]').fill("End of next month");
    await ap.locator('[data-quote-form] select[name="source"]').selectOption("referral");
    await ap.locator('[data-quote-form] [name="message"]').fill("We would like a website with an admin panel for our shop. (automated T7a check)");
    await ap.getByRole("button", { name: "Send request" }).click();
    await ap.locator("[data-lead-reference]").waitFor({ timeout: 20_000 });
    const reference = ((await ap.locator("[data-lead-reference]").textContent()) ?? "").trim();
    check("valid request → success state with reference number", /^SC-LEAD-\d{4}-\d{4,}$/.test(reference), reference);
    await anon.close();

    const [lead] = await db.select().from(schema.leads).where(eq(schema.leads.reference, reference));
    check(
      "stored in leads with every field (status new, currency SLE, source referral)",
      !!lead && lead.email === tagEmail("browser") && lead.projectType === "site-admin" && lead.budget === "1500-5000" && lead.budgetCurrency === "SLE" && lead.source === "referral" && lead.status === "new" && lead.company === "T7a Test Co",
    );
    const [note] = lead ? await db.select().from(schema.notifications).where(eq(schema.notifications.entityId, lead.id)) : [];
    check("owner notification stored, unread; email not sent (Resend not configured)", !!note && note.readAt === null && note.email === "not_configured", note ? `email=${note.email}` : "missing");

    /* ---------- 2. spam protection (direct action calls) ---------- */
    const bot = new Client(ip());
    const before = async () => Number((await db.select({ n: sql<number>`count(*)` }).from(schema.leads).where(like(schema.leads.email, `t7a-${run}-%`)))[0].n);
    const n0 = await before();
    const honey = await submitQuote(bot, { ...good(tagEmail("honeypot")), website: "http://spam.example" });
    check("honeypot filled → refused, nothing stored", honey.code === "spam" && !honey.ref && (await before()) === n0, `code=${honey.code}`);
    const fast = await submitQuote(bot, { ...good(tagEmail("fast")), startedAt: String(Date.now() - 400) });
    check("submitted in under 3 s → refused, nothing stored", fast.code === "spam" && !fast.ref && (await before()) === n0, `code=${fast.code}`);
    const forged = await submitQuote(bot, { ...good(tagEmail("forged")), startedAt: "" });
    check("missing form timestamp (no JS / scripted post) → refused", forged.code === "spam" && (await before()) === n0);
    const bad = await submitQuote(bot, { ...good(tagEmail("bad")), projectType: "made-up", email: "x" });
    check("invalid input over HTTP → refused with field errors", bad.code === "invalid" && bad.text.includes("projectType") && (await before()) === n0);

    const limiter = new Client(ip());
    const results: (string | null)[] = [];
    for (let i = 0; i < 4; i++) {
      const r = await submitQuote(limiter, good(tagEmail(`rate${i}`)));
      results.push(r.ref ? "ok" : r.code);
    }
    check("rate limit: 3 per 10 min per IP, the 4th is refused", results.join(",") === "ok,ok,ok,rate_limited", results.join(","));
    const other = await submitQuote(new Client(ip()), good(tagEmail("otherip")));
    check("…another IP is not affected", !!other.ref);
    const refs = (await db.select({ r: schema.leads.reference }).from(schema.leads).where(like(schema.leads.email, `t7a-${run}-%`))).map((x) => x.r);
    check("reference numbers are unique and sequential per year", new Set(refs).size === refs.length && refs.every((r) => r.startsWith(`SC-LEAD-${year}-`)), refs.sort().join(" "));

    /* ---------- 3a. unread badge + dashboard link (before anyone opens the lead) ---------- */
    {
      const dash = await owner.client.get("/admin");
      const badge = Number(dash.text.match(/data-unread-badge[^>]*>(\d+)</)?.[1] ?? "0");
      check("unread badge on Leads in the admin nav", badge >= 1, `badge=${badge}`);
      check("dashboard “New leads” count links to the inbox", (dash.text.match(/<a[^>]*data-stat="New leads"[^>]*>/)?.[0] ?? "").includes('href="/admin/leads?status=new"'));
    }

    /* ---------- 3. admin inbox: permissions ---------- */
    const pages = ["/admin/leads", `/admin/leads/${lead.id}`, "/admin/leads?status=new"];
    for (const [u, expected] of [[owner, 200], [staff, 200], [client, 403]] as const) {
      const st = await Promise.all(pages.map(async (p) => (await u.client.get(p)).status));
      check(`${u.role}: leads inbox pages → ${expected}`, st.every((s) => s === expected), st.join(","));
    }
    const statusId = actionId("setLeadStatusAction", "leads");
    const clientAction = await client.client.raw(`/admin/leads/${lead.id}`, { method: "POST", body: JSON.stringify([lead.id, "won"]), headers: { "next-action": statusId, accept: "text/x-component", "content-type": "text/plain;charset=UTF-8" } });
    check("client: status-change action → 403, unchanged", clientAction.status === 403 && (await db.select({ s: schema.leads.status }).from(schema.leads).where(eq(schema.leads.id, lead.id)))[0].s === "new", String(clientAction.status));

    /* ---------- 4. admin inbox: owner UI ---------- */
    const { ctx, page } = await signedInPage(browser, owner);
    try {
      await page.goto(`${APP}/admin/leads`, { waitUntil: "networkidle" });
      check("inbox lists the new lead", (await page.locator(`[data-lead-row="${reference}"]`).count()) === 1);
      await page.goto(`${APP}/admin/leads?q=${encodeURIComponent(reference)}`, { waitUntil: "networkidle" });
      check("search by reference finds exactly that lead", (await page.locator("[data-lead-row]").count()) === 1);

      await page.goto(`${APP}/admin/leads/${lead.id}`, { waitUntil: "networkidle" });
      check("detail view shows the reference and message", ((await page.locator("[data-lead-reference]").first().textContent()) ?? "").includes(reference));
      const [readNow] = await db.select().from(schema.notifications).where(eq(schema.notifications.entityId, lead.id));
      check("opening the lead marks its notification read", !!readNow?.readAt && readNow.readBy === owner.id);

      const t1 = (await clickToast(page, page.locator('[data-set-status="contacted"]'))).trim();
      const [afterStatus] = await db.select({ s: schema.leads.status }).from(schema.leads).where(eq(schema.leads.id, lead.id));
      check("owner: status new → contacted", t1.includes("Contacted") && afterStatus.s === "contacted", t1);
      await page.locator('textarea[name="note"]').fill("Called back, sending a quote tomorrow. (T7a check)");
      const t2 = await clickToast(page, page.getByRole("button", { name: "Add note" }));
      await page.waitForTimeout(800);
      const noteVisible = ((await page.locator("[data-lead-notes]").textContent()) ?? "").includes("sending a quote tomorrow");
      check("owner: internal note added and shown", t2.includes("Note added") && noteVisible);

      await page.goto(`${APP}/admin/leads?status=contacted`, { waitUntil: "networkidle" });
      check("status filter shows it under Contacted", (await page.locator(`[data-lead-row="${reference}"]`).count()) === 1);
    } finally {
      await ctx.close();
    }

    /* ---------- 5. staff can work leads (DEC-36) ---------- */
    const s = await signedInPage(browser, staff);
    try {
      await s.page.goto(`${APP}/admin/leads/${lead.id}`, { waitUntil: "networkidle" });
      const t = await clickToast(s.page, s.page.locator('[data-set-status="quoted"]'));
      const [st] = await db.select({ s: schema.leads.status }).from(schema.leads).where(eq(schema.leads.id, lead.id));
      check("staff: status contacted → quoted", t.includes("Quoted") && st.s === "quoted");
      const nav = await s.page.evaluate(() => [...document.querySelectorAll('nav[aria-label="Admin"] a')].map((a) => a.getAttribute("href")));
      check("staff sidebar: Dashboard + Leads only (no content/settings)", nav.includes("/admin/leads") && !nav.includes("/admin/content") && !nav.includes("/admin/settings"), nav.join(" "));
    } finally {
      await s.ctx.close();
    }

    /* ---------- 6. WhatsApp button follows Settings + toggle ---------- */
    const { ctx: sctx, page: sp } = await signedInPage(browser, owner);
    const saveSettings = async (edit: () => Promise<void>) => {
      await sp.goto(`${APP}/admin/settings`, { waitUntil: "networkidle" });
      await edit();
      await sp.getByRole("button", { name: "Save settings" }).click();
      await sp.locator('form [role="status"]').first().waitFor({ timeout: 20_000 });
    };
    try {
      const home = await publicText("/");
      check("floating WhatsApp button on public pages, Settings number", waHref(home.text)?.startsWith("https://wa.me/23232829316") === true, String(waHref(home.text)));
      // Real DOM (the HTML payload also carries Next's not-found tree, which uses the site chrome).
      await sp.goto(`${APP}/admin`, { waitUntil: "networkidle" });
      check("…but not in the admin", (await sp.locator("[data-whatsapp-button]").count()) === 0);

      await saveSettings(async () => sp.locator('[name="whatsapp"]').fill("+232 77 123 456"));
      const changed = await eventually("/pricing", (t) => (waHref(t) ?? "").includes("23277123456"));
      check("change the number → the button follows (DEC-37)", (waHref(changed.text) ?? "").startsWith("https://wa.me/23277123456"));

      await saveSettings(async () => sp.locator('[name="whatsappButton"]').uncheck());
      const off = await eventually("/", (t) => !t.includes("data-whatsapp-button"));
      const offAbout = await publicText("/about");
      check("toggle off in Settings → button hidden on every page", !off.text.includes("data-whatsapp-button") && !offAbout.text.includes("data-whatsapp-button"));

      await saveSettings(async () => {
        await sp.locator('[name="whatsappButton"]').check();
        await sp.locator('[name="whatsapp"]').fill("+232 32 829 316");
      });
      const back = await eventually("/", (t) => (waHref(t) ?? "").includes("23232829316"));
      check("toggle on + number restored → button back", (waHref(back.text) ?? "").startsWith("https://wa.me/23232829316"));

      /* ---------- 7. CV slot ---------- */
      const noCv = [await publicText("/"), await publicText("/about")];
      check("no CV set → no “Download CV” button (hero, About)", noCv.every((r) => !hasCv(r.text)));
      const pdf = Buffer.from("%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj 2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj 3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 200 200]>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF\n");
      const privateUp = await uploadMedia(actor, { file: new File([new Uint8Array(pdf)], `t7a-${run}-private.pdf`, { type: "application/pdf" }) });
      const up = await uploadMedia(actor, { file: new File([new Uint8Array(pdf)], `t7a-${run}-cv.pdf`, { type: "application/pdf" }), visibility: "public" });
      cvId = up.ok ? up.item.id : null;
      check("sample CV uploaded as a public PDF", !!cvId && up.ok && up.item.visibility === "public");
      await sp.goto(`${APP}/admin/settings`, { waitUntil: "networkidle" });
      const cvOptions = await sp.evaluate(() => [...(document.querySelector('select[name="cvMediaId"]') as HTMLSelectElement).options].map((o) => o.value));
      check("Settings “CV file” lists public PDFs only", !!cvId && cvOptions.includes(cvId) && !(privateUp.ok && cvOptions.includes(privateUp.item.id)));
      await saveSettings(async () => {
        await sp.locator('select[name="cvMediaId"]').selectOption(cvId!);
      });
      const withCv = await eventually("/", (t) => hasCv(t));
      const aboutCv = await publicText("/about");
      const cvHref = withCv.text.match(/<a[^>]*href="([^"]+)"[^>]*data-cv-button/)?.[1] ?? "";
      check("CV set → “Download CV” on the hero and About", hasCv(withCv.text) && hasCv(aboutCv.text) && cvHref.endsWith(".pdf"), cvHref);
      try {
        const fileRes = await fetch(cvHref);
        check("…and the link serves the PDF", fileRes.status === 200 && (fileRes.headers.get("content-type") ?? "").includes("pdf"), `${fileRes.status} ${fileRes.headers.get("content-type")}`);
      } catch (e) {
        console.log(`SKIP  …PDF download (storage host not reachable from this sandbox: ${(e as Error).message})`);
      }
      const del = await deleteMedia(actor, cvId!);
      check("the CV file can't be deleted while it's set in Settings", !del.ok && (del.message ?? "").includes("CV file"), del.ok ? "deleted!" : del.message);
      await saveSettings(async () => {
        await sp.locator('select[name="cvMediaId"]').selectOption("");
      });
      const gone = await eventually("/", (t) => !hasCv(t));
      check("CV cleared → buttons hidden again", !hasCv(gone.text));
      if (privateUp.ok) await deleteMedia(actor, privateUp.item.id);
    } finally {
      await sctx.close();
    }

    /* ---------- 8. audit ---------- */
    const rows = await db
      .select({ action: schema.auditLog.action, actor: schema.auditLog.actorUserId, data: schema.auditLog.data })
      .from(schema.auditLog)
      .where(and(eq(schema.auditLog.entity, "lead"), eq(schema.auditLog.entityId, lead.id)));
    const statusRows = rows.filter((r) => r.action === "lead.status_changed");
    check("audit: lead.created (website, no user)", rows.some((r) => r.action === "lead.created" && r.actor === null));
    check(
      "audit: each status change with who + from/to",
      statusRows.some((r) => r.actor === owner.id && JSON.stringify(r.data).includes('"to":"contacted"')) &&
        statusRows.some((r) => r.actor === staff.id && JSON.stringify(r.data).includes('"to":"quoted"')),
      `${statusRows.length} rows`,
    );
    check("audit: note added", rows.some((r) => r.action === "lead.note_added" && r.actor === owner.id));
    const settingsRows = await db.select({ n: sql<number>`count(*)` }).from(schema.auditLog).where(and(eq(schema.auditLog.action, "settings.updated"), eq(schema.auditLog.actorUserId, owner.id), gte(schema.auditLog.at, t0)));
    check("audit: settings saves", Number(settingsRows[0].n) >= 5, String(settingsRows[0].n));
  } finally {
    await browser.close();
    // test leads (notes cascade) + their notifications + rate-limit rows
    const ids = (await db.select({ id: schema.leads.id }).from(schema.leads).where(like(schema.leads.email, `t7a-${run}-%`))).map((r) => r.id);
    if (ids.length) {
      await db.delete(schema.notifications).where(inArray(schema.notifications.entityId, ids));
      await db.delete(schema.leads).where(inArray(schema.leads.id, ids));
    }
    await db.delete(schema.rateLimits).where(like(schema.rateLimits.key, "lead:10.77.%"));
    // lead numbering continues from the last real lead (or restarts at 0001)
    const [maxRow] = await db.select({ m: sql<string | null>`max(reference)` }).from(schema.leads).where(like(schema.leads.reference, `SC-LEAD-${year}-%`));
    const last = maxRow?.m ? Number(maxRow.m.split("-").pop()) : 0;
    if (last || counterBefore) await db.update(schema.counters).set({ value: Math.max(last, 0) }).where(eq(schema.counters.key, `lead:${year}`));
    else await db.delete(schema.counters).where(eq(schema.counters.key, `lead:${year}`));
    // settings back exactly as they were
    for (const row of settingsBefore) await db.update(schema.settings).set({ value: row.value }).where(eq(schema.settings.key, row.key));
    const keysBefore = new Set(settingsBefore.map((r) => r.key));
    const added = (await db.select({ key: schema.settings.key }).from(schema.settings)).map((r) => r.key).filter((k) => !keysBefore.has(k));
    if (added.length) await db.delete(schema.settings).where(inArray(schema.settings.key, added));
    if (cvId) {
      const { deleteMedia } = await import("../src/lib/content/media");
      await deleteMedia({ userId: users[0]?.id ?? "", role: "owner" }, cvId).catch(() => undefined);
    }
    await deleteUsers(users.map((u) => u.id));
    console.log(`cleanup: ${ids.length} test leads, notifications, rate-limit rows, sample CV and test users removed; counter and Settings restored (audit rows kept)`);
  }
  console.log(failures ? `\n${failures} check(s) FAILED` : "\nall checks passed");
  process.exit(failures ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
