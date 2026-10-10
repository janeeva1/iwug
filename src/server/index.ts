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

async function bootstrap(): Promise<void> {
  await runMigrations();
  await Promise.all([ensureCommunitySeed(), ensureContentSeed()]);

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