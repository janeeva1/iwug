import { randomUUID } from "node:crypto";
import { eq, or } from "drizzle-orm";
import { db, usersTable, type User } from "@workspace/db";
import { ADMIN_EMAIL, ADMIN_USERNAME } from "./session";
import { hashPassword } from "./passwords";
import { logger } from "./logger";

/**
 * The CMS has exactly one administrator. Unlike members, the admin account is
 * never self-registered — it is provisioned here on boot from the fixed
 * identity in `session.ts` plus the `IWUG_ADMIN_PASSWORD` environment secret.
 */
async function findAdmin(): Promise<User | undefined> {
  const rows = await db
    .select()
    .from(usersTable)
    .where(
      or(
        eq(usersTable.email, ADMIN_EMAIL),
        eq(usersTable.username, ADMIN_USERNAME),
      ),
    )
    .limit(1);
  return rows[0];
}

async function seedOnce(): Promise<void> {
  const password = process.env.IWUG_ADMIN_PASSWORD?.trim();
  const passwordHash = password ? await hashPassword(password) : null;
  const existing = await findAdmin();

  if (existing) {
    await db
      .update(usersTable)
      .set({
        email: ADMIN_EMAIL,
        username: ADMIN_USERNAME,
        role: "admin",
        emailVerified: true,
        ...(passwordHash ? { passwordHash } : {}),
      })
      .where(eq(usersTable.id, existing.id));
    logger.info("Admin account ensured");
    return;
  }

  await db.insert(usersTable).values({
    id: randomUUID(),
    email: ADMIN_EMAIL,
    username: ADMIN_USERNAME,
    displayName: ADMIN_USERNAME,
    role: "admin",
    emailVerified: true,
    passwordHash,
  });
  logger.info(
    { passwordConfigured: Boolean(passwordHash) },
    passwordHash
      ? "Admin account provisioned"
      : "Admin account provisioned without a password (set IWUG_ADMIN_PASSWORD to enable sign-in)",
  );
}

let seedPromise: Promise<void> | undefined;

export function ensureAdminSeed(): Promise<void> {
  if (!seedPromise) {
    seedPromise = seedOnce().catch((error: unknown) => {
      seedPromise = undefined;
      throw error;
    });
  }
  return seedPromise;
}
