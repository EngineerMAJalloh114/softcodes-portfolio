/**
 * T2 proof script: database round trip, append-only audit log, seed + row counts,
 * private object storage via signed URL, public object URL, cleanup.
 *
 *   npm run db:verify            (needs .env.local from `neon env pull`)
 *   APP_URL=http://localhost:3000 npm run db:verify   (also checks the running app)
 *
 * Behind an HTTPS egress proxy, run with NODE_USE_ENV_PROXY=1.
 */
import { randomUUID } from "node:crypto";
import { eq, sql } from "drizzle-orm";
import { scriptDb, schema } from "./db/client";
import { countRows, seed } from "./db/seed";
import { exists, publicUrl, remove, signedUrl, unsignedPrivateUrl, upload } from "../src/lib/storage";

let failures = 0;
function check(name: string, ok: boolean, detail = "") {
  if (!ok) failures++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? `  — ${detail}` : ""}`);
}

async function main() {
  const db = scriptDb();

  // 0. Running app still renders from site.ts (no visible change in T2).
  const appUrl = process.env.APP_URL;
  if (appUrl) {
    for (const path of ["/", "/projects", "/projects/tourism-is-life", "/soft-codes", "/contact"]) {
      const res = await fetch(appUrl + path);
      check(`app ${path} responds`, res.status === 200, `HTTP ${res.status}`);
    }
  }

  // 1. Write + read a row.
  const key = `verify.t2.${randomUUID()}`;
  const value = { at: new Date().toISOString(), note: "T2 round trip" };
  await db.insert(schema.settings).values({ key, value });
  const [row] = await db.select().from(schema.settings).where(eq(schema.settings.key, key));
  check("db write + read (settings)", JSON.stringify(row?.value) === JSON.stringify(value), key);
  await db.delete(schema.settings).where(eq(schema.settings.key, key));

  // 1b. audit_log is append-only (K-16): insert works, update/delete are rejected.
  const [audit] = await db
    .insert(schema.auditLog)
    .values({ action: "verify.t2", entity: "system", data: { check: "append-only" } })
    .returning({ id: schema.auditLog.id });
  check("audit_log insert", typeof audit?.id === "number", `id ${audit?.id}`);
  for (const op of ["update", "delete"] as const) {
    let rejected = false;
    let message = "";
    try {
      if (op === "update")
        await db.update(schema.auditLog).set({ action: "tampered" }).where(eq(schema.auditLog.id, audit.id));
      else await db.delete(schema.auditLog).where(eq(schema.auditLog.id, audit.id));
    } catch (e) {
      rejected = true;
      message = String((e as { cause?: { message?: string } }).cause?.message ?? (e as Error).message);
    }
    check(`audit_log ${op} rejected`, rejected, message.split("\n")[0]);
  }

  // 2. Seed + row counts.
  await seed(db);
  await seed(db); // idempotent: a second run must not duplicate rows
  const counts = await countRows(db);
  console.log("row counts:", counts);
  check("seed: 4 roles", counts.roles === 4);
  check("seed: 13 content sections", counts.content_sections === 13);
  check("seed: 5 services", counts.services === 5);
  check("seed: 5 projects", counts.projects === 5);
  check("seed: 11 stack items", counts.stack_items === 11);
  check("seed: 14 prices (7 packages × USD/SLE)", counts.prices === 14);
  const [landingSle] = await db
    .select({ amount: schema.prices.amountMinor })
    .from(schema.prices)
    .where(sql`${schema.prices.packageKey} = 'landing' and ${schema.prices.currency} = 'SLE'`);
  check("price stored in minor units", landingSle?.amount === 350_000, `landing SLE = ${landingSle?.amount}`);

  // 3. Private object: signed URL works, unsigned URL is denied.
  const objKey = `verify/t2-${randomUUID()}.txt`;
  const body = `T2 storage check ${new Date().toISOString()}`;
  const meta = await upload({ key: objKey, body, contentType: "text/plain", visibility: "private" });
  check("private upload", meta.size === Buffer.byteLength(body), `${meta.key} (${meta.size} bytes)`);

  const signed = await signedUrl(objKey, 120);
  const signedRes = await fetch(signed);
  const signedBody = await signedRes.text();
  check("signed URL GET → 200 with same bytes", signedRes.status === 200 && signedBody === body, `HTTP ${signedRes.status}`);
  check("signed URL expires", /X-Amz-Expires=120/.test(signed), "X-Amz-Expires=120");

  const shortLived = await signedUrl(objKey, 1);
  await new Promise((r) => setTimeout(r, 2_500));
  const expiredRes = await fetch(shortLived);
  check("expired signed URL denied", expiredRes.status === 403, `HTTP ${expiredRes.status} after 1s TTL`);

  const unsignedRes = await fetch(unsignedPrivateUrl(objKey));
  check("unsigned private URL denied", unsignedRes.status === 403 || unsignedRes.status === 401, `HTTP ${unsignedRes.status}`);

  // 3b. Public object: plain URL readable anonymously.
  const pubKey = `verify/t2-${randomUUID()}.txt`;
  await upload({ key: pubKey, body, contentType: "text/plain", visibility: "public" });
  const pubRes = await fetch(publicUrl(pubKey));
  check("public URL GET → 200", pubRes.status === 200 && (await pubRes.text()) === body, `HTTP ${pubRes.status}`);

  // 4. Cleanup.
  await remove(objKey, "private");
  await remove(pubKey, "public");
  check("private object deleted", !(await exists(objKey, "private")));
  check("public object deleted", !(await exists(pubKey, "public")));
  const afterDelete = await fetch(await signedUrl(objKey, 60));
  check("signed URL after delete → 404", afterDelete.status === 404, `HTTP ${afterDelete.status}`);

  console.log(failures ? `\n${failures} check(s) FAILED` : "\nall checks passed");
  process.exit(failures ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
