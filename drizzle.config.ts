import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

// Local: Neon vars live in .env.local (pulled by `neon deploy` / `neon env pull`).
config({ path: [".env.local", ".env"], quiet: true });

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  // Migrations use the direct (unpooled) connection. Not needed for `generate`.
  dbCredentials: { url: process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL ?? "" },
  strict: true,
  verbose: true,
});
