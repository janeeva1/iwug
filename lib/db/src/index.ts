import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set to a PostgreSQL connection string, e.g. postgresql://user:pass@host:5432/dbname",
  );
}

const connectionString = process.env.DATABASE_URL;
const hostname = (() => {
  try {
    return new URL(connectionString).hostname;
  } catch {
    return "";
  }
})();
const isLocal = ["localhost", "127.0.0.1", "::1", ""].includes(hostname);
const sslDisabled = /[?&]sslmode=disable/.test(connectionString);

export const pool = new Pool({
  connectionString,
  max: Number(process.env.DB_POOL_SIZE ?? 10),
  keepAlive: true,
  connectionTimeoutMillis: 15000,
  ssl: !isLocal && !sslDisabled ? { rejectUnauthorized: false } : undefined,
});

export const db = drizzle(pool, { schema });

export * from "./schema";
