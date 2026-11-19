/**
 * Screenshots of the admin pages (1440 + 390, dark + light) into docs/screenshots/.
 * Uses a throwaway owner (signed in with MFA over HTTP), deleted afterwards.
 *   APP_URL=http://localhost:3000 npx tsx scripts/screenshots-admin.ts
 */
import { APP, SESSION_COOKIE, createSignedInUser, deleteUsers } from "./lib/test-users";

type Page = {
  goto(u: string, o?: object): Promise<unknown>;
  screenshot(o: object): Promise<unknown>;
  click(sel: string): Promise<void>;
  waitForTimeout(ms: number): Promise<void>;
};
type Context = { addCookies(c: object[]): Promise<void>; newPage(): Promise<Page>; close(): Promise<void> };
type Browser = { newContext(o: object): Promise<Context>; close(): Promise<void> };

const PAGES = [
  ["dashboard", "/admin"],
  ["audit", "/admin/audit"],
  ["settings", "/admin/settings"],
  ["coming-soon", "/admin/content"],
] as const;

async function main() {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { chromium } = require("playwright") as { chromium: { launch(): Promise<Browser> } };
  const owner = await createSignedInUser("owner", { tag: "shots" });
  const browser = await chromium.launch();
  try {
    for (const scheme of ["dark", "light"] as const) {
      for (const width of [1440, 390]) {
        const ctx = await browser.newContext({ viewport: { width, height: 900 }, colorScheme: scheme, reducedMotion: "reduce", deviceScaleFactor: 1 });
        await ctx.addCookies([
          { name: SESSION_COOKIE, value: owner.client.jar.get(SESSION_COOKIE)!, domain: new URL(APP).hostname, path: "/", httpOnly: true, secure: true, sameSite: "Lax" },
        ]);
        const page = await ctx.newPage();
        for (const [name, path] of PAGES) {
          await page.goto(APP + path, { waitUntil: "networkidle" });
          await page.screenshot({ path: `docs/screenshots/admin-${name}-${width}-${scheme}.png`, fullPage: true });
        }
        if (width === 390) {
          await page.goto(`${APP}/admin`, { waitUntil: "networkidle" });
          await page.click('button[aria-controls="admin-sidebar"]');
          await page.waitForTimeout(300);
          await page.screenshot({ path: `docs/screenshots/admin-menu-390-${scheme}.png` });
        }
        await ctx.close();
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
