/**
 * Test helpers: throwaway users per role, signed in over HTTP (with MFA where needed),
 * and a cookie-jar HTTP client. Used by verify-t4 and the admin screenshot script.
 */
import { createHmac, randomBytes, randomUUID } from "node:crypto";
import { hashPassword } from "better-auth/crypto";
import { eq, inArray } from "drizzle-orm";
import { scriptDb, schema } from "../db/client";
import type { Role } from "../../src/lib/auth/permissions";

export const APP = (process.env.APP_URL ?? "http://localhost:3000").replace(/\/+$/, "");
export const SESSION_COOKIE = "__Secure-better-auth.session_token";
let ipSeq = 0;
const freshIp = () => `198.18.${(ipSeq += 1) % 250}.${1 + Math.floor(Math.random() * 250)}`;

export class Client {
  jar = new Map<string, string>();
  constructor(public ip = freshIp()) {}
  private absorb(res: Response) {
    for (const c of res.headers.getSetCookie()) {
      const [pair, ...attrs] = c.split(";");
      const i = pair.indexOf("=");
      const name = pair.slice(0, i).trim();
      const value = pair.slice(i + 1).trim();
      if (value === "" || attrs.some((a) => /^\s*max-age=0\s*$/i.test(a))) this.jar.delete(name);
      else this.jar.set(name, value);
    }
  }
  headers(extra: Record<string, string> = {}) {
    const cookie = [...this.jar].map(([k, v]) => `${k}=${v}`).join("; ");
    return { origin: APP, "x-forwarded-for": this.ip, ...(cookie ? { cookie } : {}), ...extra };
  }
  async post(path: string, body: unknown = {}) {
    const res = await fetch(APP + path, { method: "POST", redirect: "manual", headers: this.headers({ "content-type": "application/json" }), body: JSON.stringify(body) });
    this.absorb(res);
    const text = await res.text();
    let json: Record<string, unknown> | null = null;
    try {
      json = JSON.parse(text);
    } catch {
      /* not JSON */
    }
    return { status: res.status, json };
  }
  async get(path: string) {
    const res = await fetch(APP + path, { redirect: "manual", headers: this.headers() });
    this.absorb(res);
    return { status: res.status, location: res.headers.get("location") ?? "", text: await res.text() };
  }
  async raw(path: string, init: RequestInit & { headers?: Record<string, string> }) {
    const res = await fetch(APP + path, { redirect: "manual", ...init, headers: this.headers(init.headers ?? {}) });
    this.absorb(res);
    return { status: res.status, text: await res.text(), headers: res.headers };
  }
}

/* RFC 6238 TOTP for the test authenticator. */
function base32Decode(s: string): Buffer {
  const a = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let bits = 0, value = 0;
  const out: number[] = [];
  for (const ch of s.replace(/=+$/, "").toUpperCase()) {
    value = (value << 5) | a.indexOf(ch);
    bits += 5;
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return Buffer.from(out);
}
export function totp(secret: string, at = Date.now()): string {
  const counter = Buffer.alloc(8);
  counter.writeBigUInt64BE(BigInt(Math.floor(at / 30_000)));
  const h = createHmac("sha1", base32Decode(secret)).update(counter).digest();
  const o = h[h.length - 1] & 0xf;
  return ((h.readUInt32BE(o) & 0x7fffffff) % 1_000_000).toString().padStart(6, "0");
}

export type TestUser = { id: string; email: string; role: Role; client: Client };

/**
 * Create a user with `role`, sign in over HTTP and (when `mfa`) enable TOTP, so the
 * returned client holds a fully authenticated session.
 */
export async function createSignedInUser(role: Role, { mfa = true, tag = "t4" } = {}): Promise<TestUser> {
  const db = scriptDb();
  const [r] = await db.select().from(schema.roles).where(eq(schema.roles.key, role));
  const id = randomUUID();
  const email = `${tag}-${role}-${randomUUID().slice(0, 8)}@example.com`;
  const password = `Pw-${randomBytes(12).toString("base64url")}`;
  await db.batch([
    db.insert(schema.users).values({ id, name: `${role[0].toUpperCase()}${role.slice(1)} Tester`, email, emailVerified: true, roleId: r.id }),
    db.insert(schema.accounts).values({ id: randomUUID(), userId: id, accountId: id, providerId: "credential", password: await hashPassword(password) }),
  ]);
  const client = new Client();
  const s = await client.post("/api/auth/sign-in/email", { email, password });
  if (s.status !== 200) throw new Error(`sign-in for ${role} failed: HTTP ${s.status}`);
  if (mfa) {
    const en = await client.post("/api/auth/two-factor/enable", { password });
    const secret = new URL(String(en.json?.totpURI)).searchParams.get("secret")!;
    const v = await client.post("/api/auth/two-factor/verify-totp", { code: totp(secret) });
    if (v.status !== 200) throw new Error(`MFA enrolment for ${role} failed: HTTP ${v.status}`);
  }
  return { id, email, role, client };
}

export async function deleteUsers(ids: string[]) {
  if (!ids.length) return;
  await scriptDb().delete(schema.users).where(inArray(schema.users.id, ids)); // cascades sessions/accounts/2FA
}
