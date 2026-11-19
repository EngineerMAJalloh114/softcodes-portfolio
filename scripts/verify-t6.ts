/**
 * T6 proof script — pricing, FAQs, About page and DEC-37 WhatsApp links, driven through
 * the real admin UI in a browser (Playwright, pre-installed here) against a production build:
 *
 *   DB_DRIVER=neon-http npm run build && DB_DRIVER=neon-http npx next start -p 3000 &
 *   APP_URL=http://localhost:3000 npm run t6:verify
 *
 * Throwaway users, package and FAQ are removed at the end; the WhatsApp number is restored.
 * Behind an HTTPS egress proxy, run with NODE_USE_ENV_PROXY=1.
 */
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { and, eq, gte } from "drizzle-orm";
import { scriptDb, schema } from "./db/client";
import { APP, Client, SESSION_COOKIE, createSignedInUser, deleteUsers, type TestUser } from "./lib/test-users";

process.env.DB_DRIVER ??= "neon-http";

let failures = 0;
function check(name: string, ok: boolean, detail = "") {
  if (!ok) failures++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? `  — ${detail}` : ""}`);
}

type Locator = { first(): Locator; click(): Promise<void>; fill(v: string): Promise<void>; textContent(): Promise<string | null>; isVisible(): Promise<boolean>; selectOption(v: string): Promise<unknown>; waitFor(o?: object): Promise<void> };
type Page = {
  goto(u: string, o?: object): Promise<unknown>;
  reload(o?: object): Promise<unknown>;
  locator(sel: string): Locator;
  getByRole(role: string, o: object): Locator;
  content(): Promise<string>;
  on(event: "dialog", cb: (d: { accept(): Promise<void> }) => void): void;
  waitForURL(p: RegExp, o?: object): Promise<void>;
  evaluate<T>(fn: () => T): Promise<T>;
  waitForFunction<A>(fn: (a: A) => boolean, a: A, o?: object): Promise<unknown>;
};
type Context = { addCookies(c: object[]): Promise<void>; newPage(): Promise<Page>; close(): Promise<void> };
type Browser = { newContext(o?: object): Promise<Context>; close(): Promise<void> };

async function signedInPage(browser: Browser, user: TestUser) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  await ctx.addCookies([
    { name: SESSION_COOKIE, value: user.client.jar.get(SESSION_COOKIE)!, domain: new URL(APP).hostname, path: "/", httpOnly: true, secure: true, sameSite: "Lax" },
  ]);
  return { ctx, page: await ctx.newPage() };
}

/** Click, then return the toast that click produced (newest). */
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

/** Poll a public page until `predicate` holds (the cache refreshes on the next request). */
async function eventually(path: string, predicate: (t: string) => boolean) {
  let r = await publicText(path);
  for (let i = 0; i < 6 && !predicate(r.text); i++) {
    await new Promise((res) => setTimeout(res, 1000));
    r = await publicText(path);
  }
  return r;
}

function actionId(name: string): string {
  const manifest = JSON.parse(readFileSync(".next/server/server-reference-manifest.json", "utf8"));
  const entry = Object.entries(manifest.node as Record<string, { exportedName?: string }>).find(([, v]) => v.exportedName === name);
  if (!entry) throw new Error(`${name} not found — run \`npm run build\` first`);
  return entry[0];
}

const waLinks = (html: string) => [...html.matchAll(/href="(https:\/\/(?:wa\.me|api\.whatsapp\.com)[^"]*)"/g)].map((m) => m[1].replace(/&amp;/g, "&"));

async function main() {
  const db = scriptDb();
  const run = randomUUID().slice(0, 6);
  const users: TestUser[] = [];
  const pkgSlug = `t6-test-${run}`;
  const faqQuestion = `T6 test question ${run}?`;
  const t0 = new Date(Date.now() - 2000);
  const [whatsappRow] = await db.select().from(schema.settings).where(eq(schema.settings.key, "site.contact"));
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { chromium } = require("playwright") as { chromium: { launch(): Promise<Browser> } };
  const browser = await chromium.launch();

  try {
    const owner = await createSignedInUser("owner", { tag: "t6" });
    const staff = await createSignedInUser("staff", { tag: "t6" });
    const client = await createSignedInUser("client", { tag: "t6", mfa: false });
    users.push(owner, staff, client);

    /* ---------- 1. permissions ---------- */
    const routes = ["/admin/pricing", "/admin/pricing/new", "/admin/content/faqs", "/admin/content/faqs/new"];
    for (const u of [staff, client]) {
      const statuses = await Promise.all(routes.map(async (r) => (await u.client.get(r)).status));
      const action = await u.client.raw("/admin/pricing", {
        method: "POST",
        body: JSON.stringify(["packages", { name: "x" }, true]),
        headers: { "next-action": actionId("createItemAction"), accept: "text/x-component", "content-type": "text/plain;charset=UTF-8" },
      });
      check(`${u.role}: pricing/FAQ admin pages and create action → 403`, statuses.every((s) => s === 403) && action.status === 403, `${statuses.join(",")} · action ${action.status}`);
    }
    const ownerStatuses = await Promise.all(routes.map(async (r) => (await owner.client.get(r)).status));
    check("owner: pricing/FAQ admin pages → 200", ownerStatuses.every((s) => s === 200), ownerStatuses.join(","));

    /* ---------- 2. public pages ---------- */
    const pricing = await publicText("/pricing");
    const dec38 = ["$150", "Le 3,500", "$400", "Le 9,200", "$900", "Le 20,700", "$1,200", "Le 27,600", "$2,500", "Le 57,500", "$25", "Le 575", "/month"];
    check("/pricing lists the DEC-38 packages in USD and SLE", pricing.status === 200 && dec38.every((p) => pricing.text.includes(p)), dec38.filter((p) => !pricing.text.includes(p)).join(", ") || "all prices present");
    check("each package has Request a quote + Book a call", (pricing.text.match(/Request a quote/g) ?? []).length >= 7 && (pricing.text.match(/Book a call/g) ?? []).length >= 7);
    const home = await publicText("/");
    check("home page has the pricing teaser → /pricing", home.text.includes('href="/pricing"') && home.text.includes("See all prices"));
    check("home About is the short version with “More about me” → /about", home.text.includes("More about me") && home.text.includes('href="/about"'));
    const about = await publicText("/about");
    check("/about page renders the full About (facts list)", about.status === 200 && about.text.includes("IT internship at NASSIT"));
    const nav = ["/about", "/pricing", "/faq"].every((h) => home.text.includes(`href="${h}"`));
    check("nav links to About, Pricing and FAQ", nav);
    const faqPage = await publicText("/faq");
    check("/faq: seeded drafts are NOT public (empty state, no FAQPage data)", faqPage.status === 200 && !faqPage.text.includes("How does a project start?") && !faqPage.text.includes('"FAQPage"'));

    const { ctx, page } = await signedInPage(browser, owner);
    try {
      /* ---------- 3. package: create draft → hidden → publish → edit price → delete ---------- */
      await page.goto(`${APP}/admin/pricing/new`, { waitUntil: "networkidle" });
      await page.locator('[name="name"]').fill(`T6 Test Package ${run}`);
      await page.locator('[name="slug"]').fill(pkgSlug);
      await page.locator('[name="summary"]').fill("A throwaway package for the T6 check.");
      await page.getByRole("button", { name: "+ Add item" }).click();
      await page.locator('[name="items.0"]').fill("Proof item");
      await page.locator('[name="priceUsdMinor"]').fill("99");
      await page.locator('[name="priceSleMinor"]').fill("2,300");
      check("create package as draft → toast", (await clickToast(page, page.getByRole("button", { name: "Create as draft" }))).includes("Created as a draft"));
      await page.waitForURL(/\/admin\/pricing\/\d+$/, { timeout: 15_000 });
      const [pkgRow] = await db.select().from(schema.pricingPackages).where(eq(schema.pricingPackages.slug, pkgSlug));
      check("package stored unpublished with minor units ($99 → 9900, Le 2,300 → 230000)", !!pkgRow && !pkgRow.published && pkgRow.priceUsdMinor === 9900 && pkgRow.priceSleMinor === 230000);
      check("draft package NOT on /pricing", !(await publicText("/pricing")).text.includes(`T6 Test Package ${run}`));
      check("publish package → toast", (await clickToast(page, page.getByRole("button", { name: "Publish", exact: true }))).includes("Published"));
      const published = await eventually("/pricing", (t) => t.includes(`T6 Test Package ${run}`));
      check("published package on /pricing with $99 / Le 2,300", published.text.includes(`T6 Test Package ${run}`) && published.text.includes("$99") && published.text.includes("Le 2,300"));
      await page.locator('[name="priceUsdMinor"]').fill("120");
      check("edit price + publish → toast", (await clickToast(page, page.getByRole("button", { name: "Publish", exact: true }))).includes("Published"));
      const edited = await eventually("/pricing", (t) => t.includes("$120"));
      check("price change is live immediately (G-06)", edited.text.includes("$120"));

      /* ---------- 4. FAQ: create draft → hidden → publish → FAQPage data → delete ---------- */
      await page.goto(`${APP}/admin/content/faqs/new`, { waitUntil: "networkidle" });
      await page.locator('[name="question"]').fill(faqQuestion);
      await page.locator('[name="answer"]').fill("A throwaway answer for the T6 check.");
      await page.locator('[name="category"]').selectOption("support");
      check("create FAQ as draft → toast", (await clickToast(page, page.getByRole("button", { name: "Create as draft" }))).includes("Created as a draft"));
      await page.waitForURL(/\/admin\/content\/faqs\/\d+$/, { timeout: 15_000 });
      check("draft FAQ NOT on /faq", !(await publicText("/faq")).text.includes(faqQuestion));
      check("publish FAQ → toast", (await clickToast(page, page.getByRole("button", { name: "Publish", exact: true }))).includes("Published"));
      const faqLive = await eventually("/faq", (t) => t.includes(faqQuestion));
      const ld = faqLive.text.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)?.[1] ?? "";
      check("published FAQ on /faq inside an accordion (<details>)", faqLive.text.includes(faqQuestion) && /<details[^>]*data-faq/.test(faqLive.text));
      check("FAQPage structured data lists only published FAQs", ld.includes('"FAQPage"') && ld.includes(faqQuestion) && !ld.includes("How does a project start?"));

      /* ---------- 5. DEC-37: hand-typed WhatsApp link refused ---------- */
      await page.goto(`${APP}/admin/content/sections/hero`, { waitUntil: "networkidle" });
      await page.locator('[name="secondaryCta.kind"]').selectOption("url");
      await page.locator('[name="secondaryCta.href"]').fill("https://wa.me/23299999999");
      const refused = await clickToast(page, page.getByRole("button", { name: "Save draft" }));
      check("hand-typed wa.me link in the hero is refused (DEC-37)", refused.includes("fix") || refused.includes("DEC-37"), refused.trim());
      const [heroAfter] = await db.select().from(schema.contentSections).where(eq(schema.contentSections.key, "hero"));
      check("…and nothing was saved", !JSON.stringify(heroAfter.draft ?? {}).includes("23299999999"));

      /* ---------- 6. DEC-37: change the number in Settings → every WhatsApp link follows ---------- */
      page.on("dialog", (d) => void d.accept()); // leave the hero form without saving
      await page.goto(`${APP}/admin/settings`, { waitUntil: "networkidle" });
      await page.locator('[name="whatsapp"]').fill("+232 77 123 456");
      await page.getByRole("button", { name: "Save settings" }).click();
      await page.locator('[role="status"]').first().waitFor({ timeout: 20_000 });
      const pages = ["/", "/contact", "/about", "/pricing", "/faq", "/projects"];
      let allNew = true;
      const counts: string[] = [];
      for (const p of pages) {
        const r = await eventually(p, (t) => waLinks(t).length > 0 && waLinks(t).every((l) => l.includes("23277123456")));
        const links = waLinks(r.text);
        counts.push(`${p}:${links.length}`);
        if (!links.length || !links.every((l) => l.includes("23277123456") && !l.includes("23232829316"))) allNew = false;
      }
      check("after changing Settings, every WhatsApp link on every page uses the new number", allNew, counts.join(" "));
      const homeNow = await publicText("/");
      check("hero “Hire Me”, nav “Hire me” and footer all point to the new number", (homeNow.text.match(/wa\.me\/23277123456/g) ?? []).length >= 3);

      /* ---------- 7. currency toggle remembered per visitor ---------- */
      const anon = await browser.newContext({ viewport: { width: 1280, height: 900 } });
      const ap = await anon.newPage();
      await ap.goto(`${APP}/pricing`, { waitUntil: "networkidle" });
      const usdVisible = await ap.locator('[data-price="landing"] .price-usd').isVisible();
      const sleHidden = !(await ap.locator('[data-price="landing"] .price-sle').isVisible());
      check("default currency USD ($150 shown, Le hidden)", usdVisible && sleHidden);
      await ap.locator('[data-currency-option="SLE"]').first().click();
      check("switch to SLE shows Le 3,500", (await ap.locator('[data-price="landing"] .price-sle').isVisible()) && !(await ap.locator('[data-price="landing"] .price-usd').isVisible()));
      await ap.reload({ waitUntil: "networkidle" });
      const remembered = await ap.evaluate(() => document.documentElement.dataset.currency);
      check("choice remembered after reload (applied before paint)", remembered === "SLE" && (await ap.locator('[data-price="landing"] .price-sle').isVisible()), `data-currency=${remembered}`);
      await ap.goto(`${APP}/`, { waitUntil: "networkidle" });
      check("…and on the home page teaser too", await ap.locator('[data-price] .price-sle').first().isVisible());
      await anon.close();

      /* ---------- 8. clean up through the UI ---------- */
      await page.goto(`${APP}/admin/settings`, { waitUntil: "networkidle" });
      await page.locator('[name="whatsapp"]').fill("+232 32 829 316");
      await page.getByRole("button", { name: "Save settings" }).click();
      await page.locator('[role="status"]').first().waitFor({ timeout: 20_000 });
      const restored = await eventually("/", (t) => t.includes("wa.me/23232829316"));
      check("WhatsApp number restored (live)", restored.text.includes("wa.me/23232829316") && !restored.text.includes("23277123456"));

      const [faqRow] = await db.select().from(schema.faqs).where(eq(schema.faqs.question, faqQuestion));
      await page.goto(`${APP}/admin/content/faqs/${faqRow.id}`, { waitUntil: "networkidle" });
      check("delete FAQ → toast", (await clickToast(page, page.getByRole("button", { name: "Delete" }))).includes("Deleted"));
      await page.goto(`${APP}/admin/pricing/${pkgRow.id}`, { waitUntil: "networkidle" });
      check("delete package → toast", (await clickToast(page, page.getByRole("button", { name: "Delete" }))).includes("Deleted"));
      const gone = await eventually("/pricing", (t) => !t.includes(`T6 Test Package ${run}`));
      check("deleted package gone from /pricing", !gone.text.includes(`T6 Test Package ${run}`));
    } finally {
      await ctx.close();
    }

    /* ---------- 9. audit ---------- */
    const rows = await db
      .select({ action: schema.auditLog.action, entity: schema.auditLog.entity })
      .from(schema.auditLog)
      .where(and(eq(schema.auditLog.actorUserId, owner.id), gte(schema.auditLog.at, t0)));
    const counts = rows.reduce<Record<string, number>>((m, r) => ((m[`${r.entity}:${r.action}`] = (m[`${r.entity}:${r.action}`] ?? 0) + 1), m), {});
    console.log("audit rows by the test owner:", counts);
    for (const key of ["packages:content.item.created", "packages:content.item.published", "packages:content.item.deleted", "faqs:content.item.created", "faqs:content.item.published", "faqs:content.item.deleted", "settings:settings.updated"]) {
      check(`audit row: ${key}`, (counts[key] ?? 0) > 0, String(counts[key] ?? 0));
    }
  } finally {
    await browser.close();
    await db.delete(schema.pricingPackages).where(eq(schema.pricingPackages.slug, pkgSlug));
    await db.delete(schema.faqs).where(eq(schema.faqs.question, faqQuestion));
    const [now] = await db.select().from(schema.settings).where(eq(schema.settings.key, "site.contact"));
    if (whatsappRow && JSON.stringify(now?.value) !== JSON.stringify(whatsappRow.value)) {
      await db.update(schema.settings).set({ value: whatsappRow.value }).where(eq(schema.settings.key, "site.contact"));
      console.log("cleanup: WhatsApp number restored directly in the DB (save Settings once to refresh the cache)");
    }
    await deleteUsers(users.map((u) => u.id));
    console.log("cleanup: test users, package and FAQ removed (audit rows kept — append-only)");
  }
  console.log(failures ? `\n${failures} check(s) FAILED` : "\nall checks passed");
  process.exit(failures ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

void Client;
