import { sql } from "drizzle-orm";
import { Router, type IRouter } from "express";
import { requireAdmin } from "../middlewares/auth";
import { ensureContentSeed } from "../lib/seedContent";
import {
  db,
  siteCollectionsTable,
  siteContentTable,
} from "@workspace/db";
import { scalarContentDefaults, siteCollections } from "../../shared/site-content";

const router: IRouter = Router();

const fieldIds = new Set(scalarContentDefaults.map((field) => field.id));
const collectionById = new Map(siteCollections.map((collection) => [collection.id, collection]));

interface LocalizedPayload {
  en: string;
  ig: string;
}

router.use(async (_req, _res, next) => {
  try {
    await ensureContentSeed();
    next();
  } catch (error) {
    next(error);
  }
});

async function readContent() {
  const [fields, collections] = await Promise.all([
    db.select().from(siteContentTable),
    db.select().from(siteCollectionsTable),
  ]);

  const fieldValues: Record<string, LocalizedPayload> = {};
  for (const row of fields) {
    fieldValues[row.id] = { en: row.valueEn, ig: row.valueIg };
  }

  const collectionValues: Record<string, Record<string, string>[]> = {};
  for (const row of collections) {
    collectionValues[row.id] = parseItems(row.items);
  }

  return { fields: fieldValues, collections: collectionValues };
}

/** MariaDB stores JSON as LONGTEXT, so the driver hands back a string. */
function parseItems(value: unknown): Record<string, string>[] {
  if (Array.isArray(value)) return value as Record<string, string>[];
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value) as unknown;
      return Array.isArray(parsed) ? (parsed as Record<string, string>[]) : [];
    } catch {
      return [];
    }
  }
  return [];
}

router.get("/content", async (_req, res): Promise<void> => {
  res.json(await readContent());
});

router.get("/admin/content", requireAdmin, async (_req, res): Promise<void> => {
  res.json(await readContent());
});

router.put("/admin/content/fields", requireAdmin, async (req, res): Promise<void> => {
  const input = (req.body ?? {}) as { fields?: Record<string, unknown> };
  const incoming = input.fields;
  if (!incoming || typeof incoming !== "object") {
    res.status(400).json({ error: "Expected a `fields` object." });
    return;
  }

  const rows: Array<{ id: string; valueEn: string; valueIg: string }> = [];
  for (const [id, value] of Object.entries(incoming)) {
    if (!fieldIds.has(id)) continue;
    if (!value || typeof value !== "object") continue;
    const { en, ig } = value as Partial<LocalizedPayload>;
    if (typeof en !== "string" || typeof ig !== "string") continue;
    rows.push({ id, valueEn: en, valueIg: ig });
  }

  if (rows.length === 0) {
    res.status(400).json({ error: "No valid fields to update." });
    return;
  }

  await db
    .insert(siteContentTable)
    .values(rows)
    .onConflictDoUpdate({
      target: siteContentTable.id,
      set: {
        valueEn: sql`excluded.${siteContentTable.valueEn}`,
        valueIg: sql`excluded.${siteContentTable.valueIg}`,
        updatedAt: new Date(),
      },
    });

  res.json(await readContent());
});

router.put("/admin/content/collections/:collectionId", requireAdmin, async (req, res): Promise<void> => {
  const collectionId = String(req.params.collectionId);
  const definition = collectionById.get(collectionId);
  if (!definition) {
    res.status(404).json({ error: "Unknown collection." });
    return;
  }

  const input = (req.body ?? {}) as { items?: unknown };
  if (!Array.isArray(input.items)) {
    res.status(400).json({ error: "Expected an `items` array." });
    return;
  }

  const allowedKeys = new Set(definition.columns.map((column) => column.key));
  const items: Record<string, string>[] = input.items.map((raw) => {
    const item = (raw ?? {}) as Record<string, unknown>;
    const clean: Record<string, string> = {};
    for (const key of allowedKeys) {
      const value = item[key];
      if (typeof value === "string") clean[key] = value;
    }
    return clean;
  });

  await db
    .insert(siteCollectionsTable)
    .values({ id: collectionId, items })
    .onConflictDoUpdate({
      target: siteCollectionsTable.id,
      set: { items, updatedAt: new Date() },
    });

  res.json(await readContent());
});

export default router;
