import { Redis } from "ioredis";
import { logger } from "./logger";

/**
 * Redis-backed read cache with graceful degradation.
 *
 * When `REDIS_URL` is not configured, or Redis is unreachable, every helper
 * becomes a no-op and calls fall through to the database. The site therefore
 * keeps working without Redis — it is just faster with it.
 */

const redisUrl = process.env.REDIS_URL;

let client: Redis | null = null;
let ready = false;

if (redisUrl) {
  client = new Redis(redisUrl, {
    lazyConnect: true,
    maxRetriesPerRequest: 1,
    enableOfflineQueue: false,
    connectTimeout: 5000,
  });

  client.on("ready", () => {
    ready = true;
    logger.info("Redis cache connected");
  });
  client.on("error", (err: unknown) => {
    if (ready) logger.warn({ err }, "Redis error; falling back to database");
    ready = false;
  });
  client.on("end", () => {
    ready = false;
  });

  client
    .connect()
    .catch((err: unknown) =>
      logger.warn({ err }, "Redis unavailable; caching disabled"),
    );
} else {
  logger.info("REDIS_URL not set; read caching disabled");
}

export function isCacheReady(): boolean {
  return ready;
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  if (!client || !ready) return null;
  try {
    const raw = await client.get(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch (err) {
    logger.warn({ err, key }, "Redis get failed");
    return null;
  }
}

export async function cacheSet(
  key: string,
  value: unknown,
  ttlSeconds: number,
): Promise<void> {
  if (!client || !ready) return;
  try {
    await client.set(key, JSON.stringify(value), "EX", ttlSeconds);
  } catch (err) {
    logger.warn({ err, key }, "Redis set failed");
  }
}

export async function cacheDel(...keys: string[]): Promise<void> {
  if (!client || !ready || keys.length === 0) return;
  try {
    await client.del(...keys);
  } catch (err) {
    logger.warn({ err, keys }, "Redis delete failed");
  }
}

/** Return the cached value for `key`, or run `loader`, cache it, and return it. */
export async function withCache<T>(
  key: string,
  ttlSeconds: number,
  loader: () => Promise<T>,
): Promise<T> {
  const cached = await cacheGet<T>(key);
  if (cached !== null) return cached;
  const value = await loader();
  await cacheSet(key, value, ttlSeconds);
  return value;
}

export const cacheKeys = {
  publishedPages: "cms:pages:published",
  page: (slug: string) => `cms:page:${slug}`,
  publishedEvents: "events:published",
  membershipTiers: "membership:tiers",
  communitySummary: "community:summary",
  communityContributors: "community:contributors",
  siteSettings: "site:settings",
  memberStats: (memberId: string) => `wikimedia:stats:member:${memberId}`,
  galleryCategories: "gallery:categories",
  galleryMedia: (category: string, cursor: string, limit: number) =>
    `gallery:media:${category}:${cursor}:${limit}`,
  dictionarySearch: (query: string) => `dictionary:search:${query.toLocaleLowerCase()}`,
} as const;

export const cacheTtl = {
  short: 60,
  medium: 300,
  long: 900,
} as const;
