/**
 * T3 proof script — drives the real auth endpoints over HTTP against a running app.
 *
 *   APP_URL=http://localhost:3000 SERVER_LOG=/path/to/next-dev.log npm run auth:verify
 *       full suite against `next dev` (the dev email adapter logs reset links to SERVER_LOG)
 *   APP_URL=http://localhost:3000 MODE=prod npm run auth:verify
 *       production checks against `next start` (reset email not configured → 503)
 *
 * Creates a throwaway admin user, exercises every flow, then deletes the user.
 * Audit rows stay (append-only by design).
 */
import { createHmac, randomBytes, randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { hashPassword } from "better-auth/crypto";
import { eq, like, sql } from "drizzle-orm";
import { scriptDb, schema } from "./db/client";

const APP = (process.env.APP_URL ?? "http://localhost:3000").replace(/\/+$/, "");
const MODE = process.env.MODE === "prod" ? "prod" : "dev";
const SESSION_COOKIE = "__Secure-better-auth.session_token";
const TWO_FACTOR_COOKIE = "__Secure-better-auth.two_factor";

let failures = 0;
function check(name: string, ok: boolean, detail = "") {
  if (!ok) failures++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? `  — ${detail}` : ""}`);
}

/* ---------------- tiny HTTP client with a cookie jar ---------------- */
class Client {
  jar = new Map<string, string>();
  lastSetCookies: string[] = [];
  constructor(public ip: string) {}

  private absorb(res: Response) {
    this.lastSetCookies = res.headers.getSetCookie();
    for (const c of this.lastSetCookies) {
      const [pair, ...attrs] = c.split(";");
      const i = pair.indexOf("=");
      const name = pair.slice(0, i).trim();
      const value = pair.slice(i + 1).trim();
      const expired = attrs.some((a) => /^\s*max-age=0\s*$/i.test(a)) || value === "";
      if (expired) this.jar.delete(name);
      else this.jar.set(name, value);
    }
  }
  private headers(extra: Record<string, string> = {}) {
    const cookie = [...this.jar].map(([k, v]) => `${k}=${v}`).join("; ");
    return { origin: APP, "x-forwarded-for": this.ip, ...(cookie ? { cookie } : {}), ...extra };
  }
  async post(path: string, body: unknown = {}) {
    const res = await fetch(APP + path, {
      method: "POST",
      redirect: "manual",
      headers: this.headers({ "content-type": "application/json" }),
      body: JSON.stringify(body),
    });
    this.absorb(res);
    const text = await res.text();
    let json: unknown = null;
    try {
      json = JSON.parse(text);
    } catch {
      /* not JSON */
    }
    return { status: res.status, json: json as Record<string, unknown> | null };
  }
  async get(path: string) {
    const res = await fetch(APP + path, { redirect: "manual", headers: this.headers() });
    this.absorb(res);
    return { status: res.status, location: res.headers.get("location") ?? "", text: await res.text() };
  }
}
let ipCounter = 0;
const freshIp = () => `198.51.${100 + (++ipCounter % 100)}.${Math.floor(Math.random() * 250) + 1}`;

/* ---------------- TOTP (RFC 6238) ---------------- */
function base32Decode(s: string): Buffer {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let bits = 0;
  let value = 0;
  const out: number[] = [];
  for (const ch of s.replace(/=+$/, "").toUpperCase()) {
    value = (value << 5) | alphabet.indexOf(ch);
    bits += 5;
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return Buffer.from(out);
}
function totp(secretB32: string, at = Date.now(), step = 30, digits = 6): string {
  const counter = Buffer.alloc(8);
  counter.writeBigUInt64BE(BigInt(Math.floor(at / 1000 / step)));
  const h = createHmac("sha1", base32Decode(secretB32)).update(counter).digest();
  const o = h[h.length - 1] & 0xf;
  const n = ((h.readUInt32BE(o) & 0x7fffffff) % 10 ** digits).toString();
  return n.padStart(digits, "0");
}
async function nextTotpWindow() {
  const ms = 30_000 - (Date.now() % 30_000) + 1_000;
  await new Promise((r) => setTimeout(r, ms));
}

/* ---------------- helpers ---------------- */
const isRedirectTo = (r: { status: number; location: string }, path: string) =>
  [302, 303, 307, 308].includes(r.status) && new URL(r.location, APP).pathname === path;

async function main() {
  const db = scriptDb();

  if (MODE === "prod") {
    const c = new Client(freshIp());
    const admin = await c.get("/admin");
    check("prod: /admin redirects to sign-in when signed out", isRedirectTo(admin, "/auth/sign-in"), `${admin.status} → ${admin.location}`);
    const r = await c.post("/api/auth/request-password-reset", { email: "anyone@example.com", redirectTo: "/auth/reset-password" });
    check(
      "prod: password reset → 'email not configured' error",
      r.status === 503 && r.json?.code === "EMAIL_NOT_CONFIGURED",
      `HTTP ${r.status} ${JSON.stringify(r.json)}`,
    );
    const signUp = await c.post("/api/auth/sign-up/email", { email: "new@example.com", password: "a-long-password-123", name: "x" });
    check("prod: public sign-up disabled", signUp.status >= 400, `HTTP ${signUp.status}`);
    return finish();
  }

  /* ---- test user: admin role, temporary password, must change it ---- */
  const email = `t3-verify-${randomUUID().slice(0, 8)}@example.com`;
  const tempPassword = `Temp-${randomBytes(9).toString("base64url")}`;
  const newPassword = `New-${randomBytes(12).toString("base64url")}`;
  const resetPassword = `Reset-${randomBytes(12).toString("base64url")}`;
  const [adminRole] = await db.select().from(schema.roles).where(eq(schema.roles.key, "admin"));
  const userId = randomUUID();
  await db.batch([
    db.insert(schema.users).values({ id: userId, name: "T3 Verify", email, emailVerified: true, roleId: adminRole.id, mustChangePassword: true }),
    db.insert(schema.accounts).values({ id: randomUUID(), userId, accountId: userId, providerId: "credential", password: await hashPassword(tempPassword) }),
  ]);
  console.log(`test user: ${email} (admin)`);

  try {
    /* 1. /admin signed out */
    const anon = new Client(freshIp());
    const r1 = await anon.get("/admin");
    check("/admin redirects to /auth/sign-in when signed out", isRedirectTo(r1, "/auth/sign-in"), `${r1.status} → ${r1.location}`);

    /* 2. wrong password rejected, then rate limited */
    const attacker = new Client(freshIp());
    const statuses: number[] = [];
    for (let i = 0; i < 7; i++) {
      statuses.push((await attacker.post("/api/auth/sign-in/email", { email, password: "wrong-password-123" })).status);
    }
    check("wrong password rejected (401)", statuses[0] === 401, `statuses: ${statuses.join(",")}`);
    check("sign-in rate limited after 5 attempts (429)", statuses.slice(5).every((s) => s === 429) && statuses.slice(0, 5).every((s) => s === 401));

    /* 3. correct password; session fixation + cookie flags */
    const owner = new Client(freshIp());
    owner.jar.set(SESSION_COOKIE, "attacker-chosen-token");
    const s1 = await owner.post("/api/auth/sign-in/email", { email, password: tempPassword });
    const sessionSetCookie = owner.lastSetCookies.find((c) => c.startsWith(`${SESSION_COOKIE}=`)) ?? "";
    check("sign-in with temporary password → 200", s1.status === 200, `HTTP ${s1.status}`);
    check(
      "session cookie is HttpOnly; Secure; SameSite=Lax; 7-day Max-Age",
      /HttpOnly/i.test(sessionSetCookie) && /Secure/i.test(sessionSetCookie) && /SameSite=Lax/i.test(sessionSetCookie) && /Max-Age=604800/i.test(sessionSetCookie),
      sessionSetCookie.replace(/=[^;]+;/, "=<token>;"),
    );
    check("new session token issued on sign-in (fixation-safe)", !!owner.jar.get(SESSION_COOKIE) && owner.jar.get(SESSION_COOKIE) !== "attacker-chosen-token");

    /* 4. forced password change before anything else */
    const r4 = await owner.get("/admin");
    check("/admin → /auth/change-password while temporary password is set", isRedirectTo(r4, "/auth/change-password"), `${r4.status} → ${r4.location}`);
    const tokenBefore = owner.jar.get(SESSION_COOKIE);
    const cp = await owner.post("/api/auth/change-password", { currentPassword: tempPassword, newPassword, revokeOtherSessions: true });
    check("change temporary password → 200", cp.status === 200, `HTTP ${cp.status}`);
    check("session rotated on password change", owner.jar.get(SESSION_COOKIE) !== tokenBefore);

    /* 5. MFA required before /admin */
    const r5 = await owner.get("/admin");
    check("/admin blocked until MFA set (→ /auth/setup-mfa)", isRedirectTo(r5, "/auth/setup-mfa"), `${r5.status} → ${r5.location}`);

    /* 6. enable MFA */
    const en = await owner.post("/api/auth/two-factor/enable", { password: newPassword });
    const totpURI = String(en.json?.totpURI ?? "");
    const backupCodes = (en.json?.backupCodes as string[] | undefined) ?? [];
    const secret = totpURI ? new URL(totpURI).searchParams.get("secret") ?? "" : "";
    check("MFA enrolment returns TOTP URI + 10 recovery codes", en.status === 200 && !!secret && backupCodes.length === 10, `HTTP ${en.status}, ${backupCodes.length} codes`);
    const bad = await owner.post("/api/auth/two-factor/verify-totp", { code: "000000" });
    check("wrong TOTP code rejected", bad.status >= 400, `HTTP ${bad.status}`);
    const ok = await owner.post("/api/auth/two-factor/verify-totp", { code: totp(secret) });
    check("correct TOTP code enables MFA", ok.status === 200, `HTTP ${ok.status}`);
    const r6 = await owner.get("/admin");
    check("/admin loads once MFA is on (200)", r6.status === 200 && r6.text.includes(email), `HTTP ${r6.status}`);

    /* 7. sign out */
    const so = await owner.post("/api/auth/sign-out");
    check("sign out → 200, session cookie cleared", so.status === 200 && !owner.jar.has(SESSION_COOKIE), `HTTP ${so.status}`);
    const r7 = await owner.get("/admin");
    check("/admin redirects after sign out", isRedirectTo(r7, "/auth/sign-in"), `${r7.status} → ${r7.location}`);

    /* 8. MFA login */
    await nextTotpWindow(); // a fresh code, not the one used to enable MFA
    const a = new Client(freshIp());
    const p1 = await a.post("/api/auth/sign-in/email", { email, password: newPassword });
    check("password step returns twoFactorRedirect, no session yet", p1.status === 200 && p1.json?.twoFactorRedirect === true && !a.jar.has(SESSION_COOKIE) && a.jar.has(TWO_FACTOR_COOKIE));
    const half = await a.get("/admin");
    check("/admin still blocked between password and TOTP", isRedirectTo(half, "/auth/sign-in"), `${half.status} → ${half.location}`);
    const v = await a.post("/api/auth/two-factor/verify-totp", { code: totp(secret) });
    check("TOTP step completes sign-in", v.status === 200 && a.jar.has(SESSION_COOKIE), `HTTP ${v.status}`);
    const r8 = await a.get("/admin");
    check("MFA login reaches /admin (200)", r8.status === 200, `HTTP ${r8.status}`);

    /* 8b. recovery code works once */
    const b = new Client(freshIp());
    await b.post("/api/auth/sign-in/email", { email, password: newPassword });
    const bc = await b.post("/api/auth/two-factor/verify-backup-code", { code: backupCodes[0] });
    check("recovery code signs in", bc.status === 200 && b.jar.has(SESSION_COOKIE), `HTTP ${bc.status}`);
    const b2 = new Client(freshIp());
    await b2.post("/api/auth/sign-in/email", { email, password: newPassword });
    const bcAgain = await b2.post("/api/auth/two-factor/verify-backup-code", { code: backupCodes[0] });
    check("same recovery code rejected the second time", bcAgain.status >= 400, `HTTP ${bcAgain.status}`);

    /* 9. MFA endpoint rate limit */
    const mfaAttacker = new Client(freshIp());
    await mfaAttacker.post("/api/auth/sign-in/email", { email, password: newPassword });
    const mfaStatuses: number[] = [];
    for (let i = 0; i < 7; i++) mfaStatuses.push((await mfaAttacker.post("/api/auth/two-factor/verify-totp", { code: "123456" })).status);
    check("MFA verify rate limited (429) after repeated bad codes", mfaStatuses.includes(429), `statuses: ${mfaStatuses.join(",")}`);
    // Repeated bad codes also trip Better Auth's per-user lockout; clear it for the next steps.
    await db.update(schema.twoFactors).set({ failedVerificationCount: 0, lockedUntil: null }).where(eq(schema.twoFactors.userId, userId));

    /* 10. sign out everywhere */
    const rv = await a.post("/api/auth/revoke-sessions");
    check("sign out everywhere → 200", rv.status === 200, `HTTP ${rv.status}`);
    const aAfter = await a.get("/admin");
    const bAfter = await b.get("/admin");
    check("every session revoked (both devices redirected)", isRedirectTo(aAfter, "/auth/sign-in") && isRedirectTo(bAfter, "/auth/sign-in"));

    /* 11. password reset: link works, single use */
    const logPath = process.env.SERVER_LOG;
    const logBefore = logPath ? readFileSync(logPath, "utf8").length : 0;
    const rr = new Client(freshIp());
    const req = await rr.post("/api/auth/request-password-reset", { email, redirectTo: "/auth/reset-password" });
    check("request password reset → 200", req.status === 200, `HTTP ${req.status}`);
    await new Promise((r) => setTimeout(r, 1500));
    const newLog = logPath ? readFileSync(logPath, "utf8").slice(logBefore) : "";
    const link = newLog.match(/https?:\/\/\S+\/auth\/reset-password\?token=([A-Za-z0-9_-]+)/);
    check("dev email adapter logged the reset link server-side", !!link, link ? link[0].replace(/token=.*/, "token=<redacted>") : "no link in log");
    const token = link?.[1] ?? "missing";
    const page = await rr.get(`/auth/reset-password?token=${token}`);
    check("reset link opens the reset page (200)", page.status === 200, `HTTP ${page.status}`);
    const reset1 = await rr.post("/api/auth/reset-password", { newPassword: resetPassword, token });
    check("reset with link token → 200", reset1.status === 200, `HTTP ${reset1.status}`);
    const reset2 = await rr.post("/api/auth/reset-password", { newPassword: `${resetPassword}x`, token });
    check("same reset link rejected the second time (single-use)", reset2.status === 400, `HTTP ${reset2.status} ${String(reset2.json?.code ?? "")}`);
    const oldPw = await new Client(freshIp()).post("/api/auth/sign-in/email", { email, password: newPassword });
    check("old password no longer works", oldPw.status === 401, `HTTP ${oldPw.status}`);
    const newPw = await new Client(freshIp()).post("/api/auth/sign-in/email", { email, password: resetPassword });
    check("new password works (→ MFA step)", newPw.status === 200 && newPw.json?.twoFactorRedirect === true, `HTTP ${newPw.status}`);

    /* 12. reset endpoint rate limit */
    const spam = new Client(freshIp());
    const resetStatuses: number[] = [];
    for (let i = 0; i < 5; i++) resetStatuses.push((await spam.post("/api/auth/request-password-reset", { email: "nobody@example.com" })).status);
    check("password reset requests rate limited (429 after 3)", resetStatuses.slice(3).every((s) => s === 429), `statuses: ${resetStatuses.join(",")}`);

    /* 13. public sign-up disabled */
    const su = await new Client(freshIp()).post("/api/auth/sign-up/email", { email: `x-${randomUUID()}@example.com`, password: "a-long-password-123", name: "x" });
    check("public sign-up disabled", su.status >= 400, `HTTP ${su.status}`);

    /* 14. audit rows */
    await new Promise((r) => setTimeout(r, 1000));
    const rows = await db
      .select({ action: schema.auditLog.action })
      .from(schema.auditLog)
      .where(sql`${schema.auditLog.entityId} = ${userId} or ${schema.auditLog.data}->>'email' = ${email}`);
    const counts = rows.reduce<Record<string, number>>((m, r) => ((m[r.action] = (m[r.action] ?? 0) + 1), m), {});
    console.log("audit rows for test user:", counts);
    for (const action of [
      "auth.sign_in_failed",
      "auth.sign_in",
      "auth.password_changed",
      "auth.mfa_enabled",
      "auth.mfa_failed",
      "auth.mfa_challenge",
      "auth.sign_out",
      "auth.sign_out_everywhere",
      "auth.password_reset_requested",
      "auth.password_reset",
    ]) {
      check(`audit row: ${action}`, (counts[action] ?? 0) > 0, `${counts[action] ?? 0}`);
    }
    const [{ n: tampered }] = (
      await db.execute<{ n: number }>(sql`select count(*)::int as n from audit_log where action like 'auth.%' and at > now() - interval '1 day'`)
    ).rows;
    check("audit rows present in append-only table", tampered > 0, `${tampered} auth rows in last 24h`);
  } finally {
    await db.delete(schema.verifications).where(like(schema.verifications.value, userId));
    await db.delete(schema.users).where(eq(schema.users.id, userId)); // cascades sessions, accounts, two_factors
    console.log("cleanup: test user deleted (audit rows kept — append-only)");
  }
  finish();
}

function finish() {
  console.log(failures ? `\n${failures} check(s) FAILED` : "\nall checks passed");
  process.exit(failures ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
