import { migrate } from "drizzle-orm/node-postgres/migrator";
import { db } from "@workspace/db";
import { logger } from "./logger";

const migrationsFolder = process.env.MIGRATIONS_DIR ?? "./drizzle";

export async function runMigrations(): Promise<void> {
  await migrate(db, { migrationsFolder });
  logger.info({ migrationsFolder }, "Database migrations applied");
}
