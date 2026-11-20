/**
 * Screenshots for T7a (1440 + 390, dark + light) → docs/screenshots/t7a-*.
 * Public: /contact form, validation errors, success state, home (WhatsApp button + CV in hero), /about with CV.
 * Admin: leads inbox, lead detail, dashboard, settings. Sample leads, a sample CV and a
 * throwaway owner are created and removed afterwards (counter and Settings restored).
 *   APP_URL=http://localhost:3100 npx tsx --conditions=react-server scripts/screenshots-t7a.ts
 */
import { eq, inArray, like, sql } from "drizzle-orm";
import { scriptDb, schema } from "./db/client";
import { APP, SESSION_COOKIE, createSignedInUser, deleteUsers } from "./lib/test-users";

process.env.DB_DRIVER ??= "neon-http";

type Locator = { click(): Promise<void>; fill(v: string): Promise<void>; selectOption(v: string): Promise<unknown>; waitFor(o?: object): Promise<void>; first(): Locator };
type Page = {
  goto(u: string, o?: object): Promise<unknown>;
  screenshot(o: object): Promise<unknown>;
  locator(s: string): Locator;
  waitForTimeout(ms: number): Promise<void>;
  evaluate(fn: () => void): Promise<void>;
};
type Context = { addCookies(c: object[]): Promise<void>; newPage(): Promise<Page>; close(): Promise<void> };
type Browser = { newContext(o: object): Promise<Context>; close(): Promise<void> };

const SAMPLES = [
  { name: "Aminata Kamara", email: "shots-aminata@example.com", company: "Sweet Salone Bakery", projectType: "ecommerce-booking", budget: "1500-5000", budgetCurrency: "USD", source: "referral", status: "new" as const, message: "We bake for weddings and events and want customers to order cakes online and pay a deposit." },
  { name: "Ibrahim Sesay", email: "shots-ibrahim@example.com", company: null, projectType: "landing", budget: "lt500", budgetCurrency: "SLE", source: "social", status: "contacted" as const, message: "I need a one-page site for my tailoring business with my WhatsApp and photos of my work." },
  { name: "Fatmata Conteh", email: "shots-fatmata@example.com", company: "Lumley Guest House", projectType: "site-admin", budget: "500-1500", budgetCurrency: "USD", source: "search", status: "quoted" as const, message: "A website for our guest house where we can update room prices and photos ourselves." },
];

async function main() {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { chromium } = require("playwright") as { chromium: { launch(): Promise<Browser> } };
  const db = scriptDb();
  const year = new Date().getUTCFullYear();
  const [counterBefore] = await db.select().from(schema.counters).where(eq(schema.counters.key, `lead:${year}`));
  const settingsBefore = await db.select().from(schema.settings);
  const owner = await createSignedInUser("owner", { tag: "shots" });
  const actor = { userId: owner.id, role: "owner" as const };
  const { uploadMedia, deleteMedia } = await import("../src/lib/content/media");
  const pdf = Buffer.from("%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj 2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj 3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 200 200]>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF\n");
  const cv = await uploadMedia(actor, { file: new File([new Uint8Array(pdf)], "sample-cv.pdf", { type: "application/pdf" }), visibility: "public" });
  const cvId = cv.ok ? cv.item.id : null;
  const browser = await chromium.launch();
  const cookie = { name: SESSION_COOKIE, value: owner.client.jar.get(SESSION_COOKIE)!, domain: new URL(APP).hostname, path: "/", httpOnly: true, secure: true, sameSite: "Lax" };
  const shot = (page: Page, name: string, width: number, scheme: string, fullPage = true) =>
    page.screenshot({ path: `docs/screenshots/t7a-${name}-${width}-${scheme}.png`, fullPage });
  let n = 0;
  const ip = () => `10.88.${n}.${++n}`;

  try {
    // sample leads (the success-state shot below adds one more through the real form)
    const inserted = await db
      .insert(schema.leads)
      .values(SAMPLES.map((s, i) => ({ ...s, reference: `SC-LEAD-${year}-${String(9001 + i)}`, deadline: i === 0 ? "Before December" : null, phone: i === 1 ? "+232 76 555 010" : null })))
      .returning({ id: schema.leads.id, reference: schema.leads.reference });
    await db.insert(schema.notifications).values({ kind: "lead.new", title: `New quote request ${inserted[0].reference}`, body: "Sample", href: `/admin/leads/${inserted[0].id}`, entityId: inserted[0].id });
    await db.insert(schema.leadNotes).values({ leadId: inserted[2].id, authorId: owner.id, body: "Sent the Site + admin quote ($900). Follow up on Friday." });

    // CV on, via Settings (as the owner would)
    const setCv = async (value: string) => {
      const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
      await ctx.addCookies([cookie]);
      const p = await ctx.newPage();
      await p.goto(`${APP}/admin/settings`, { waitUntil: "networkidle" });
      await p.locator('[data-quote-form] select[name="cvMediaId"]').selectOption(value);
      await p.locator('[data-quote-form] button[type="submit"]').click();
      await p.locator('form [role="status"]').first().waitFor({ timeout: 20_000 });
      await ctx.close();
    };
    if (cvId) await setCv(cvId);

    for (const scheme of ["dark", "light"] as const) {
      for (const width of [1440, 390]) {
        const opts = { viewport: { width, height: 900 }, colorScheme: scheme, reducedMotion: "reduce", deviceScaleFactor: 1, extraHTTPHeaders: { "x-forwarded-for": ip() } };
        const pub = await browser.newContext(opts);
        const p = await pub.newPage();
        await p.goto(`${APP}/`, { waitUntil: "networkidle" });
        await shot(p, "home-hero", width, scheme, false); // first screen: hero + CV + WhatsApp button
        await p.goto(`${APP}/about`, { waitUntil: "networkidle" });
        await shot(p, "about", width, scheme);
        await p.goto(`${APP}/contact?package=site-admin`, { waitUntil: "networkidle" });
        await shot(p, "contact", width, scheme);
        await p.waitForTimeout(3200);
        await p.locator('[data-quote-form] [name="name"]').fill("Sample Visitor");
        await p.locator('[data-quote-form] [name="email"]').fill("not-an-email");
        await p.locator('[data-quote-form] button[type="submit"]').click();
        await p.locator('[data-form-error]').waitFor({ timeout: 20_000 });
        await shot(p, "contact-errors", width, scheme);
        await p.locator('[data-quote-form] [name="email"]').fill("shots-visitor@example.com");
        await p.locator('[data-quote-form] select[name="budget"]').selectOption("500-1500");
        await p.locator('[data-quote-form] select[name="source"]').selectOption("search");
        await p.locator('[data-quote-form] [name="message"]').fill("A website with an admin panel for our shop, please.");
        await p.locator('[data-quote-form] button[type="submit"]').click();
        await p.locator("[data-lead-reference]").waitFor({ timeout: 20_000 });
        await p.evaluate(() => document.querySelector("[data-lead-sent]")?.scrollIntoView({ block: "center" }));
        await shot(p, "contact-success", width, scheme, false);
        await pub.close();

        const adm = await browser.newContext(opts);
        await adm.addCookies([cookie]);
        const a = await adm.newPage();
        await a.goto(`${APP}/admin`, { waitUntil: "networkidle" });
        await shot(a, "admin-dashboard", width, scheme);
        await a.goto(`${APP}/admin/leads`, { waitUntil: "networkidle" });
        await shot(a, "admin-leads", width, scheme);
        await a.goto(`${APP}/admin/leads/${inserted[2].id}`, { waitUntil: "networkidle" });
        await shot(a, "admin-lead", width, scheme);
        await a.goto(`${APP}/admin/settings`, { waitUntil: "networkidle" });
        await shot(a, "admin-settings", width, scheme);
        await adm.close();
        console.log(`shot ${scheme} ${width}`);
      }
    }
    if (cvId) await setCv("");
  } finally {
    await browser.close();
    const ids = (await db.select({ id: schema.leads.id }).from(schema.leads).where(like(schema.leads.email, "shots-%@example.com"))).map((r) => r.id);
    if (ids.length) {
      await db.delete(schema.notifications).where(inArray(schema.notifications.entityId, ids));
      await db.delete(schema.leads).where(inArray(schema.leads.id, ids));
    }
    await db.delete(schema.rateLimits).where(like(schema.rateLimits.key, "lead:10.88.%"));
    const [maxRow] = await db.select({ m: sql<string | null>`max(reference)` }).from(schema.leads).where(like(schema.leads.reference, `SC-LEAD-${year}-%`));
    const last = maxRow?.m ? Number(maxRow.m.split("-").pop()) : 0;
    if (last || counterBefore) await db.update(schema.counters).set({ value: last }).where(eq(schema.counters.key, `lead:${year}`));
    else await db.delete(schema.counters).where(eq(schema.counters.key, `lead:${year}`));
    for (const row of settingsBefore) await db.update(schema.settings).set({ value: row.value }).where(eq(schema.settings.key, row.key));
    const keep = new Set(settingsBefore.map((r) => r.key));
    const added = (await db.select({ key: schema.settings.key }).from(schema.settings)).map((r) => r.key).filter((k) => !keep.has(k));
    if (added.length) await db.delete(schema.settings).where(inArray(schema.settings.key, added));
    if (cvId) await deleteMedia(actor, cvId).catch(() => undefined);
    await deleteUsers([owner.id]);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
