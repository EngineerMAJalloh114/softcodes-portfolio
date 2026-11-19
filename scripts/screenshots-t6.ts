/**
 * Screenshots for T6 (1440 + 390, dark + light) → docs/screenshots/t6-*.
 * Public: /pricing (USD and SLE), /faq (public empty state + draft preview), /about, home, mobile menu.
 * Admin: pricing list, package editor, FAQ list. Uses a throwaway owner (removed afterwards).
 *   APP_URL=http://localhost:3100 npx tsx --conditions=react-server scripts/screenshots-t6.ts
 */
import { eq } from "drizzle-orm";
import { scriptDb, schema } from "./db/client";
import { APP, SESSION_COOKIE, createSignedInUser, deleteUsers } from "./lib/test-users";

process.env.DB_DRIVER ??= "neon-http";

type Locator = { click(): Promise<void>; first(): Locator };
type Page = {
  goto(u: string, o?: object): Promise<unknown>;
  screenshot(o: object): Promise<unknown>;
  locator(s: string): Locator;
  evaluate(fn: () => void): Promise<void>;
  waitForTimeout(ms: number): Promise<void>;
};
type Context = { addCookies(c: object[]): Promise<void>; newPage(): Promise<Page>; close(): Promise<void> };
type Browser = { newContext(o: object): Promise<Context>; close(): Promise<void> };

async function main() {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { chromium } = require("playwright") as { chromium: { launch(): Promise<Browser> } };
  const owner = await createSignedInUser("owner", { tag: "shots" });
  const [pkg] = await scriptDb().select({ id: schema.pricingPackages.id }).from(schema.pricingPackages).where(eq(schema.pricingPackages.slug, "site-admin"));
  const cookie = { name: SESSION_COOKIE, value: owner.client.jar.get(SESSION_COOKIE)!, domain: new URL(APP).hostname, path: "/", httpOnly: true, secure: true, sameSite: "Lax" };
  const browser = await chromium.launch();
  const shot = (page: Page, name: string, width: number, scheme: string, fullPage = true) =>
    page.screenshot({ path: `docs/screenshots/t6-${name}-${width}-${scheme}.png`, fullPage });
  try {
    for (const scheme of ["dark", "light"] as const) {
      for (const width of [1440, 390]) {
        const opts = { viewport: { width, height: 900 }, colorScheme: scheme, reducedMotion: "reduce", deviceScaleFactor: 1 };

        // public, anonymous visitor
        const pub = await browser.newContext(opts);
        const p = await pub.newPage();
        for (const [name, path] of [["pricing-usd", "/pricing"], ["faq", "/faq"], ["about", "/about"], ["home", "/"]] as const) {
          await p.goto(APP + path, { waitUntil: "networkidle" });
          await shot(p, name, width, scheme);
        }
        await p.goto(APP + "/pricing", { waitUntil: "networkidle" });
        await p.locator('[data-currency-option="SLE"]').first().click();
        await shot(p, "pricing-sle", width, scheme);
        if (width === 390) {
          await p.locator('button[aria-controls="mobile-menu"]').click();
          await p.waitForTimeout(300);
          await shot(p, "menu", width, scheme, false);
        }
        await pub.close();

        // owner: admin pages + draft preview of the FAQ page
        const adm = await browser.newContext(opts);
        await adm.addCookies([cookie]);
        const a = await adm.newPage();
        for (const [name, path, full] of [
          ["admin-pricing", "/admin/pricing", true],
          ["admin-package-edit", `/admin/pricing/${pkg.id}`, false],
          ["admin-faqs", "/admin/content/faqs", true],
        ] as const) {
          await a.goto(APP + path, { waitUntil: "networkidle" });
          await shot(a, name, width, scheme, full);
        }
        await a.goto(`${APP}/api/preview?path=/faq`, { waitUntil: "networkidle" });
        await a.evaluate(() => document.querySelectorAll("details").forEach((d, i) => (d.open = i === 0)));
        await shot(a, "faq-preview", width, scheme);
        await a.goto(`${APP}/api/preview/exit?path=/faq`, { waitUntil: "networkidle" });
        await adm.close();
        console.log(`shot ${scheme} ${width}`);
      }
    }
  } finally {
    await browser.close();
    await deleteUsers([owner.id]);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
