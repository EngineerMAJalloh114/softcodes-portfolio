/**
 * One-off: create the owner account (DEC-34) with a one-time temporary password.
 *
 *   npm run auth:create-owner                 # create the owner
 *   npm run auth:create-owner -- --reset      # owner exists: issue a new temporary password
 *   npm run auth:create-owner -- --email x@y  # different email (default: DEC-34)
 *
 * The temporary password is printed ONCE and never stored in plain text (scrypt hash, the
 * same as Better Auth). The owner must change it at first sign-in, then set up MFA.
 * Behind an HTTPS egress proxy, run with NODE_USE_ENV_PROXY=1.
 */
import { randomInt, randomUUID } from "node:crypto";
import { hashPassword } from "better-auth/crypto";
import { and, eq, sql } from "drizzle-orm";
import { scriptDb, schema } from "./db/client";

const DEFAULT_OWNER_EMAIL = "engineermohamedabassjalloh3855@gmail.com"; // DEC-34
const DEFAULT_OWNER_NAME = "Mohamed Abass Jalloh";

// No look-alike characters (0/O, 1/l/I).
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
function temporaryPassword(length = 20): string {
  let out = "";
  for (let i = 0; i < length; i++) out += ALPHABET[randomInt(ALPHABET.length)];
  return out.match(/.{1,5}/g)!.join("-"); // e.g. AbC23-xYz45-…
}

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

async function main() {
  const email = (arg("email") ?? DEFAULT_OWNER_EMAIL).trim().toLowerCase();
  const reset = process.argv.includes("--reset");
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new Error(`Invalid email: ${email}`);

  const db = scriptDb();
  const [ownerRole] = await db.select().from(schema.roles).where(eq(schema.roles.key, "owner"));
  if (!ownerRole) throw new Error("Role 'owner' not found — run `npm run db:seed` first.");

  const [existing] = await db
    .select()
    .from(schema.users)
    .where(sql`lower(${schema.users.email}) = ${email}`);

  const password = temporaryPassword();
  const hash = await hashPassword(password);
  const now = new Date();

  if (existing) {
    if (!reset) {
      console.error(`An account for ${email} already exists. Re-run with --reset to issue a new temporary password.`);
      process.exit(2);
    }
    await db.batch([
      db
        .update(schema.accounts)
        .set({ password: hash, updatedAt: now })
        .where(and(eq(schema.accounts.userId, existing.id), eq(schema.accounts.providerId, "credential"))),
      db.update(schema.users).set({ mustChangePassword: true, roleId: ownerRole.id }).where(eq(schema.users.id, existing.id)),
      db.delete(schema.sessions).where(eq(schema.sessions.userId, existing.id)),
      db.insert(schema.auditLog).values({
        action: "auth.owner_temporary_password_issued",
        entity: "user",
        entityId: existing.id,
        data: { email, via: "scripts/create-owner.ts --reset" },
      }),
    ]);
    console.log(`Issued a new temporary password for ${email}; all sessions signed out.`);
  } else {
    const userId = randomUUID();
    await db.batch([
      db.insert(schema.users).values({
        id: userId,
        name: DEFAULT_OWNER_NAME,
        email,
        emailVerified: true,
        roleId: ownerRole.id,
        mustChangePassword: true,
      }),
      db.insert(schema.accounts).values({
        id: randomUUID(),
        userId,
        accountId: userId,
        providerId: "credential",
        password: hash,
      }),
      db.insert(schema.auditLog).values({
        action: "auth.owner_created",
        entity: "user",
        entityId: userId,
        data: { email, via: "scripts/create-owner.ts" },
      }),
    ]);
    console.log(`Created owner account ${email}.`);
  }

  console.log(`
  Temporary password (shown once — copy it now):

      ${password}

  Sign in at /auth/sign-in. You'll be asked to choose a new password, then to set up
  two-factor authentication before /admin opens.`);
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
