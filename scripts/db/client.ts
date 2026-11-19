/**
 * Database client for scripts (migrate, seed, verify) — not used by the app.
 *
 * Uses Neon's serverless driver over HTTPS so scripts also run where only HTTPS
 * egress exists (CI, sandboxes). The app itself uses node-postgres (src/db/index.ts).
 */
import { config } from "dotenv";
import { neon, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "../../src/db/schema";

// override: the project's .env.local wins over variables already in the shell
// (some sandboxes pre-set placeholder AWS_* keys that would shadow Neon's).
config({ path: [".env.local", ".env"], quiet: true, override: true });

// Behind an HTTPS egress proxy (HTTPS_PROXY set, run with NODE_USE_ENV_PROXY=1), send SQL
// to the endpoint host itself instead of the regional API host, so only hosts in
// DATABASE_URL need to be allowed. Without a proxy the driver default is used.
if (process.env.HTTPS_PROXY) {
  neonConfig.fetchEndpoint = (host) => `https://${host}/sql`;
}

export function scriptDb(url = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL) {
  if (!url) throw new Error("DATABASE_URL is not set — run `neon env pull` first");
  return drizzle({ client: neon(url), schema });
}

export type ScriptDb = ReturnType<typeof scriptDb>;
export { schema };
