import { migrate } from "drizzle-orm/neon-http/migrator";
import { scriptDb } from "./client";

async function main() {
  await migrate(scriptDb(), { migrationsFolder: "./drizzle" });
  console.log("migrations applied");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
