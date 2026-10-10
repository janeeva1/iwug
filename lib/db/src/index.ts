import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set to a PostgreSQL connection string, e.g. postgresql://user:pass@host:5432/dbname",
  );
}

const connectionString = process.env.DATABASE_URL;
const parsed = (() => {
  try {
    return new URL(connectionString);
  } catch {
    return null;
  }
})();
const hostname = parsed?.hostname ?? "";
const isLocal = ["localhost", "127.0.0.1", "::1", ""].includes(hostname);
// Render's internal Postgres hostnames are single-label (e.g. dpg-xxxx-a) and
// do NOT speak TLS; external hostnames contain dots and require it.
const isInternalHost = hostname.length > 0 && !hostname.includes(".");

const sslMode = (
  parsed?.searchParams.get("sslmode") ??
  process.env.DB_SSL_MODE ??
  ""
).toLowerCase();
const sslOverride = (process.env.DB_SSL ?? "").toLowerCase();

const ssl: { rejectUnauthorized: boolean } | undefined = (() => {
  if (sslOverride === "require" || sslOverride === "true") {
    return { rejectUnauthorized: false };
  }
  if (sslOverride === "disable" || sslOverride === "false") return undefined;
  if (isLocal || isInternalHost) return undefined;
  if (sslMode === "disable") return undefined;
  if (sslMode === "verify-ca" || sslMode === "verify-full") {
    return { rejectUnauthorized: true };
  }
  return { rejectUnauthorized: false };
})();

export const pool = new Pool({
  connectionString,
  max: Number(process.env.DB_POOL_SIZE ?? 10),
  keepAlive: true,
  connectionTimeoutMillis: 15000,
  ssl,
});

export const db = drizzle(pool, { schema });

export * from "./schema";
