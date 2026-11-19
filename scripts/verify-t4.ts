/**
 * T4 proof script — RBAC on every admin route and on the settings server action,
 * settings save + audit row, audit log filters. Runs against a production build:
 *
 *   npm run build && DB_DRIVER=neon-http npx next start -p 3000 &
 *   APP_URL=http://localhost:3000 npm run admin:verify
 *
 * Creates throwaway users (owner/admin/staff/client), deletes them at the end.
 * Audit rows it writes stay (append-only by design); test actions are named test.t4.<run>.*.
 * Behind an HTTPS egress proxy, run with NODE_USE_ENV_PROXY=1.
 */
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { and, desc, eq, gte, sql } from "drizzle-orm";
import { scriptDb, schema } from "./db/client";
import { APP, Client, SESSION_COOKIE, createSignedInUser, deleteUsers, type TestUser } from "./lib/test-users";
import type { Role } from "../src/lib/auth/permissions";

process.env.DB_DRIVER ??= "neon-http"; // src/db getDb() in this process (HTTPS-only friendly)

let failures = 0;
function check(name: string, ok: boolean, detail = "") {
  if (!ok) failures++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? `  — ${detail}` : ""}`);
}

/** Expected HTTP status per role and admin route, written independently of the matrix. */
const ROUTES = ["/admin", "/admin/content", "/admin/projects", "/admin/pricing", "/admin/leads", "/admin/media", "/admin/audit", "/admin/settings"] as const;
const ALLOWED: Record<Role, readonly string[]> = {
  owner: ROUTES,
  admin: ["/admin", "/admin/content", "/admin/projects", "/admin/pricing", "/admin/leads", "/admin/media", "/admin/audit"],
  staff: ["/admin", "/admin/leads"],
  client: [],
};

const isRedirectTo = (r: { status: number; location: string }, path: string) =>
  [302, 303, 307, 308].includes(r.status) && new URL(r.location, "http://x").pathname === path;

function settingsActionId(): string {
  const manifest = JSON.parse(readFileSync(".next/server/server-reference-manifest.json", "utf8"));
  const entry = Object.entries(manifest.node as Record<string, { exportedName?: string }>).find(
    ([, v]) => v.exportedName === "saveSettingsAction",
  );
  if (!entry) throw new Error("saveSettingsAction not found — run `npm run build` first");
  return entry[0];
}

/**
 * POST straight to the settings server action (by its build ID) with the caller's session.
 * Used for roles that can't open the page: the action's permission check must answer 403
 * before the body is even read. The owner's successful save is driven through the real form.
 */
async function callSettingsAction(client: Client, fields: Record<string, string | string[]>) {
  const form = new FormData();
  form.append("0", JSON.stringify([{ status: "idle" }, "$K1"]));
  for (const [k, v] of Object.entries(fields)) for (const one of [v].flat()) form.append(`1_${k}`, one);
  return client.raw("/admin/settings", { method: "POST", body: form, headers: { "next-action": settingsActionId(), accept: "text/x-component" } });
}

/** Minimal Playwright surface (pre-installed in this environment; not a project dependency). */
type Browser = { newContext(o?: object): Promise<BrowserContext>; close(): Promise<void> };
type BrowserContext = { addCookies(c: object[]): Promise<void>; newPage(): Promise<Page>; close(): Promise<void> };
type Page = {
  goto(url: string, o?: object): Promise<unknown>;
  fill(sel: string, v: string): Promise<void>;
  uncheck(sel: string): Promise<void>;
  click(sel: string): Promise<void>;
  waitForSelector(sel: string, o?: object): Promise<{ textContent(): Promise<string | null> } | null>;
};
async function launchBrowser(): Promise<Browser> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { chromium } = require("playwright") as { chromium: { launch(): Promise<Browser> } };
  return chromium.launch();
}

/** Submit the real settings form in a browser as `user`; returns the form's status message. */
async function saveInBrowser(browser: Browser, user: TestUser, fields: Record<string, string>, uncheck: string[] = []) {
  const ctx = await browser.newContext();
  await ctx.addCookies([
    // localhost counts as a secure context, so the browser sends this Secure cookie over http.
    { name: SESSION_COOKIE, value: user.client.jar.get(SESSION_COOKIE)!, domain: new URL(APP).hostname, path: "/", httpOnly: true, secure: true, sameSite: "Lax" },
  ]);
  const page = await ctx.newPage();
  await page.goto(`${APP}/admin/settings`, { waitUntil: "networkidle" });
  for (const [name, value] of Object.entries(fields)) await page.fill(`[name="${name}"]`, value);
  for (const value of uncheck) await page.uncheck(`input[name="currencies"][value="${value}"]`);
  await page.click('button[type="submit"]');
  const msg = await page.waitForSelector('[role="status"], form > [role="alert"]', { timeout: 15_000 });
  const text = (await msg?.textContent()) ?? "";
  await ctx.close();
  return text;
}

async function settingsAuditCount(userId: string, since: Date) {
  const [{ n }] = await scriptDb()
    .select({ n: sql<number>`count(*)::int` })
    .from(schema.auditLog)
    .where(and(eq(schema.auditLog.action, "settings.updated"), eq(schema.auditLog.actorUserId, userId), gte(schema.auditLog.at, since)));
  return n;
}

async function main() {
  const db = scriptDb();
  const users: TestUser[] = [];
  try {
    /* ---------- signed out ---------- */
    const anon = new Client();
    for (const path of ROUTES) {
      const r = await anon.get(path);
      check(`signed out: ${path} → /auth/sign-in`, isRedirectTo(r, "/auth/sign-in"), `${r.status}`);
    }

    /* ---------- users per role ---------- */
    const owner = await createSignedInUser("owner");
    const admin = await createSignedInUser("admin");
    const staff = await createSignedInUser("staff");
    const client = await createSignedInUser("client", { mfa: false });
    const staffNoMfa = await createSignedInUser("staff", { mfa: false });
    users.push(owner, admin, staff, client, staffNoMfa);

    /* ---------- RBAC matrix over HTTP ---------- */
    for (const u of [owner, admin, staff, client]) {
      const results: string[] = [];
      let ok = true;
      for (const path of ROUTES) {
        const r = await u.client.get(path);
        const expected = ALLOWED[u.role].includes(path) ? 200 : 403;
        if (r.status !== expected) ok = false;
        results.push(`${path.replace("/admin", "") || "/"}=${r.status}`);
      }
      check(`${u.role}: every admin route returns the expected 200/403`, ok, results.join(" "));
    }
    const r1 = await staffNoMfa.client.get("/admin/leads");
    check("MFA still required on every /admin route (staff without MFA → /auth/setup-mfa)", isRedirectTo(r1, "/auth/setup-mfa"), `${r1.status} → ${r1.location}`);
    const ownerOnly = await Promise.all([admin, staff, client].map((u) => u.client.get("/admin/settings")));
    check("owner-only /admin/settings: admin, staff, client all 403", ownerOnly.every((r) => r.status === 403), ownerOnly.map((r) => r.status).join(","));

    /* ---------- sidebar shows only permitted sections ---------- */
    const staffDash = await staff.client.get("/admin");
    check(
      "staff sidebar hides Audit log and Settings",
      staffDash.status === 200 && !staffDash.text.includes('href="/admin/audit"') && !staffDash.text.includes('href="/admin/settings"'),
    );
    const ownerDash = await owner.client.get("/admin");
    check(
      "owner dashboard: counts, latest activity, 'Coming in T7' badge (Pricing shipped in T6)",
      ["Leads", "Projects", "Content items", "Media", "Latest activity", "Coming in T7"].every((s) => ownerDash.text.includes(s)),
    );

    /* ---------- settings server action (HTTP) ---------- */
    const t0 = new Date(Date.now() - 1000);
    // Denied roles: the action's permission check answers 403 before the body is read.
    const good = { contactEmail: "engineermohamedabassjalloh3855@gmail.com", whatsapp: "+232 32 829 316", location: "Freetown, Sierra Leone", depositPercent: "40", currencies: ["USD", "SLE"] };
    const before = await db.select().from(schema.settings).where(eq(schema.settings.key, "payments.deposit_percent"));

    for (const u of [admin, staff, client]) {
      const r = await callSettingsAction(u.client, good);
      check(`settings action as ${u.role} is refused (server-side)`, r.status === 403 || (r.status >= 400 && r.status < 500), `HTTP ${r.status}`);
    }
    const unchanged = await db.select().from(schema.settings).where(eq(schema.settings.key, "payments.deposit_percent"));
    check("refused actions changed nothing", JSON.stringify(before) === JSON.stringify(unchanged));
    check("refused actions wrote no audit rows", (await Promise.all([admin, staff, client].map((u) => settingsAuditCount(u.id, t0)))).every((n) => n === 0));

    const browser = await launchBrowser();
    try {
      const bad = await saveInBrowser(browser, owner, { contactEmail: "nope", depositPercent: "150" }, ["USD", "SLE"]);
      check(
        "invalid input rejected by Zod (no audit row)",
        bad.includes("Please fix the highlighted fields") && (await settingsAuditCount(owner.id, t0)) === 0,
        bad.trim(),
      );

      const saved = await saveInBrowser(browser, owner, { depositPercent: "40" });
      check("owner saves settings in the browser form → success", saved.includes("Saved"), saved.trim());
      const [dep] = await db.select().from(schema.settings).where(eq(schema.settings.key, "payments.deposit_percent"));
      check("saved value persisted (deposit 40%)", dep?.value === 40, JSON.stringify(dep?.value));
      const [row] = await db
        .select()
        .from(schema.auditLog)
        .where(and(eq(schema.auditLog.action, "settings.updated"), eq(schema.auditLog.actorUserId, owner.id)))
        .orderBy(desc(schema.auditLog.at))
        .limit(1);
      const changes = (row?.data as { changes?: Record<string, { from: unknown; to: unknown }> } | null)?.changes ?? {};
      check("save wrote an audit row with before/after", !!row && changes.depositPercent?.to === 40, JSON.stringify(changes.depositPercent ?? null));

      const restored = await saveInBrowser(browser, owner, { depositPercent: "50" });
      check("restore default deposit 50% (audited: 2 rows)", restored.includes("Saved") && (await settingsAuditCount(owner.id, t0)) === 2);
    } finally {
      await browser.close();
    }

    /* ---------- audit log filters ---------- */
    const run = randomUUID().replace(/-/g, "").slice(0, 8);
    const A = `test.t4.${run}.alpha`;
    const B = `test.t4.${run}.beta`;
    await db.insert(schema.auditLog).values([
      { action: A, entity: "test", actorUserId: owner.id, at: new Date("2020-01-01T10:00:00Z") },
      { action: A, entity: "test", actorUserId: owner.id, at: new Date("2020-01-02T10:00:00Z") },
      { action: A, entity: "test", actorUserId: admin.id, at: new Date("2020-01-03T10:00:00Z") },
      { action: B, entity: "test", actorUserId: null, at: new Date("2020-01-02T23:59:59Z") },
      { action: B, entity: "test", actorUserId: null, at: new Date("2020-01-04T00:00:00Z") },
    ]);
    const { queryAuditLog } = await import("../src/lib/admin/audit-log");
    const byAction = await queryAuditLog({ action: A });
    check("filter by action", byAction.total === 3 && byAction.rows.every((r) => r.action === A), `total ${byAction.total}`);
    const byActor = await queryAuditLog({ action: A, actor: owner.id });
    check("filter by actor", byActor.total === 2 && byActor.rows.every((r) => r.actorEmail === owner.email), `total ${byActor.total}`);
    const bySystem = await queryAuditLog({ action: B, actor: "system" });
    check("filter by system actor", bySystem.total === 2, `total ${bySystem.total}`);
    const byDates = await queryAuditLog({ action: B, from: "2020-01-02", to: "2020-01-02" });
    check("filter by date range (inclusive day, UTC)", byDates.total === 1, `total ${byDates.total}`);
    const range = await queryAuditLog({ action: A, from: "2020-01-02", to: "2020-01-03" });
    check("filter by multi-day range", range.total === 2, `total ${range.total}`);
    const p1 = await queryAuditLog({ action: A, page: 1 }, 2);
    const p2 = await queryAuditLog({ action: A, page: 2 }, 2);
    check(
      "pagination (2 per page, newest first)",
      p1.pages === 2 && p1.rows.length === 2 && p2.rows.length === 1 && p1.rows[0].at > p1.rows[1].at && p1.rows[1].at > p2.rows[0].at,
    );
    const page = await owner.client.get(`/admin/audit?action=${A}&actor=${owner.id}`);
    const pageText = page.text.replace(/<!--.*?-->/g, "");
    check("audit page (HTTP) applies filters", page.status === 200 && pageText.includes("2 entries match") && pageText.includes(A), `HTTP ${page.status}`);
    const staffAudit = await staff.client.get(`/admin/audit?action=${A}`);
    check("audit page is owner/admin only (staff → 403)", staffAudit.status === 403, `HTTP ${staffAudit.status}`);
    const junk = await owner.client.get("/admin/audit?action=%27%3BDROP&from=nope&page=-3");
    check("junk filter params are ignored safely", junk.status === 200, `HTTP ${junk.status}`);
  } finally {
    await deleteUsers(users.map((u) => u.id));
    console.log("cleanup: test users deleted (audit rows kept — append-only)");
  }
  console.log(failures ? `\n${failures} check(s) FAILED` : "\nall checks passed");
  process.exit(failures ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
