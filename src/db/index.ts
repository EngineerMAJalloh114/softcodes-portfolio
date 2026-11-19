import "server-only";
import { neon, neonConfig } from "@neondatabase/serverless";
import { attachDatabasePool } from "@vercel/functions";
import { drizzle as drizzleNeonHttp } from "drizzle-orm/neon-http";
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

/**
 * App database client (server only).
 *
 * Default (`DB_DRIVER` unset or "pg"): node-postgres over TCP with a pooled connection
 * and Vercel Fluid compute, releasing idle clients via attachDatabasePool — Neon's
 * guidance for Vercel.
 *
 * `DB_DRIVER=neon-http`: Neon's serverless driver over HTTPS, for environments without
 * TCP egress (CI, sandboxes). No interactive transactions in this mode.
 *
 * Drizzle builds parameterised queries (K-07): never concatenate input into SQL.
 */
export type Db = NodePgDatabase<typeof schema>;

export const dbDriver = (): "pg" | "neon-http" =>
  process.env.DB_DRIVER === "neon-http" ? "neon-http" : "pg";

/** Whether the active driver supports interactive transactions. */
export const dbSupportsTransactions = () => dbDriver() === "pg";

function createDb(): Db {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is not set");

  if (dbDriver() === "neon-http") {
    // Behind an HTTPS egress proxy, send SQL to the endpoint host from DATABASE_URL.
    if (process.env.HTTPS_PROXY) neonConfig.fetchEndpoint = (host) => `https://${host}/sql`;
    // Same query-builder API for select/insert/update/delete; typed as the pg client.
    return drizzleNeonHttp({ client: neon(connectionString), schema }) as unknown as Db;
  }

  const pool = new Pool({ connectionString, max: 5, idleTimeoutMillis: 10_000 });
  attachDatabasePool(pool);
  return drizzle(pool, { schema });
}

let db: Db | undefined;

/** Lazily created so builds and pages that don't touch the DB need no DATABASE_URL. */
export function getDb(): Db {
  db ??= createDb();
  return db;
}

export { schema };
