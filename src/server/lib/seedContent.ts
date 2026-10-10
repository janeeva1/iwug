import {
  db,
  siteCollectionsTable,
  siteContentTable,
} from "@workspace/db";
import { scalarContentDefaults, siteCollections } from "../../shared/site-content";

let seedPromise: Promise<void> | undefined;

async function seedOnce(): Promise<void> {
  const [existingFields, existingCollections] = await Promise.all([
    db.select({ id: siteContentTable.id }).from(siteContentTable),
    db.select({ id: siteCollectionsTable.id }).from(siteCollectionsTable),
  ]);

  const fieldIds = new Set(existingFields.map((row) => row.id));
  const collectionIds = new Set(existingCollections.map((row) => row.id));

  const missingFields = scalarContentDefaults.filter((field) => !fieldIds.has(field.id));
  const missingCollections = siteCollections.filter((collection) => !collectionIds.has(collection.id));

  const operations: Array<Promise<unknown>> = [];
  if (missingFields.length > 0) {
    operations.push(
      db.insert(siteContentTable).values(
        missingFields.map((field) => ({
          id: field.id,
          valueEn: field.en,
          valueIg: field.ig,
        })),
      ),
    );
  }
  if (missingCollections.length > 0) {
    operations.push(
      db.insert(siteCollectionsTable).values(
        missingCollections.map((collection) => ({
          id: collection.id,
          items: collection.items,
        })),
      ),
    );
  }

  await Promise.all(operations);
}

/** Idempotently seeds any missing editable content rows. */
export function ensureContentSeed(): Promise<void> {
  if (!seedPromise) {
    seedPromise = seedOnce().catch((error: unknown) => {
      seedPromise = undefined;
      throw error;
    });
  }
  return seedPromise;
}
