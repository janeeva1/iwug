import "./lib/env";
import app from "./app";
import { logger } from "./lib/logger";
import { runMigrations } from "./lib/migrate";
import { ensureCommunitySeed } from "./lib/seedCommunity";
import { ensureContentSeed } from "./lib/seedContent";

const port = Number(process.env.PORT ?? 5000);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${process.env.PORT ?? ""}"`);
}

async function prepareDatabase(): Promise<void> {
  const attempts = Math.max(1, Number(process.env.DB_BOOTSTRAP_ATTEMPTS ?? 5));

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      await runMigrations();
      await Promise.all([ensureCommunitySeed(), ensureContentSeed()]);
      logger.info("Database bootstrap complete");
      return;
    } catch (error) {
      logger.error(
        { err: error, attempt, attempts },
        "Database bootstrap attempt failed",
      );
      if (attempt < attempts) {
        await new Promise((resolve) => setTimeout(resolve, attempt * 2000));
      }
    }
  }

  logger.error(
    "Database bootstrap failed after retries; starting server in degraded mode",
  );
}

async function bootstrap(): Promise<void> {
  await prepareDatabase();

  app.listen(port, (err) => {
    if (err) {
      logger.error({ err }, "Error listening on port");
      process.exit(1);
    }

    logger.info({ port }, "Server listening");
  });
}

bootstrap().catch((error: unknown) => {
  logger.error({ err: error }, "Failed to start server");
  process.exit(1);
});