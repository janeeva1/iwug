import { existsSync } from "node:fs";
import { loadEnvFile } from "node:process";

/**
 * Loads environment variables from a local `.env` file into `process.env`.
 *
 * Uses Node's built-in `process.loadEnvFile` (no external dependency). Values
 * already present in the host environment are left untouched, and a missing or
 * malformed file is ignored so production hosts can inject variables directly.
 *
 * Import this module before any module that reads `process.env` at load time
 * (it must be the first import in `src/server/index.ts`).
 */
const envFile = process.env.ENV_FILE ?? ".env";

if (existsSync(envFile)) {
  try {
    loadEnvFile(envFile);
  } catch {
    // Ignore unreadable/malformed env files; host-provided variables still work.
  }
}
