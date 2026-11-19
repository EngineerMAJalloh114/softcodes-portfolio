import "server-only";
import { attachDatabasePool } from "@vercel/functions";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

/**
 * App database client (server only). Neon guidance for Vercel: node-postgres with a
 * pooled connection + Fluid compute, releasing idle clients via attachDatabasePool.
 * Drizzle builds parameterised queries (K-07): never concatenate input into SQL.
 */
function createDb() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is not set");
  const pool = new Pool({ connectionString, max: 5, idleTimeoutMillis: 10_000 });
  attachDatabasePool(pool);
  return drizzle(pool, { schema });
}

let db: ReturnType<typeof createDb> | undefined;

/** Lazily created so builds and pages that don't touch the DB need no DATABASE_URL. */
export function getDb() {
  db ??= createDb();
  return db;
}

export { schema };
