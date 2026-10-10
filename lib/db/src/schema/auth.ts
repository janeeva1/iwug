import { createInsertSchema } from "drizzle-zod";
import {
  boolean,
  integer,
  json,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";
import { z } from "zod/v4";

export type UserRole = "member" | "admin";
export type OAuthProvider = "google" | "wikimedia";
export type AuthTokenKind = "email_verify" | "password_reset";

/**
 * Core account record. A user is created by email/password registration,
 * Google sign-in, or Wikimedia (MediaWiki) OAuth. `username` is the Wikimedia
 * username and is required for a complete profile; it is verified against the
 * Wikimedia global account directory before it can be saved.
 */
export const usersTable = pgTable("users", {
  id: varchar("id", { length: 36 }).primaryKey(),
  username: varchar("username", { length: 191 }).unique(),
  displayName: varchar("display_name", { length: 191 }),
  email: varchar("email", { length: 320 }).unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  passwordHash: varchar("password_hash", { length: 255 }),
  avatarUrl: varchar("avatar_url", { length: 500 }),
  role: text("role").$type<UserRole>().notNull().default("member"),
  wikimediaUserId: varchar("wikimedia_user_id", { length: 64 }),
  wikimediaEditCount: integer("wikimedia_edit_count").notNull().default(0),
  wikimediaVerified: boolean("wikimedia_verified").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const insertUserSchema = createInsertSchema(usersTable).omit({
  createdAt: true,
  updatedAt: true,
});
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof usersTable.$inferSelect;

/**
 * Linked third-party identity (Google or Wikimedia). One row per provider
 * account; a user may link both.
 */
export const oauthAccountsTable = pgTable(
  "oauth_accounts",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    userId: varchar("user_id", { length: 36 })
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    provider: text("provider").$type<OAuthProvider>().notNull(),
    providerAccountId: varchar("provider_account_id", { length: 191 }).notNull(),
    email: varchar("email", { length: 320 }),
    username: varchar("username", { length: 191 }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    expiresAt: timestamp("expires_at", { withTimezone: true, mode: "date" }),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("oauth_accounts_provider_account_idx").on(
      table.provider,
      table.providerAccountId,
    ),
  ],
);

export type OAuthAccount = typeof oauthAccountsTable.$inferSelect;

/** Server-side session. The opaque `id` is stored in an httpOnly cookie. */
export const sessionsTable = pgTable("sessions", {
  id: varchar("id", { length: 64 }).primaryKey(),
  userId: varchar("user_id", { length: 36 })
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  userAgent: varchar("user_agent", { length: 255 }),
  ip: varchar("ip", { length: 64 }),
  expiresAt: timestamp("expires_at", { withTimezone: true, mode: "date" }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
    .notNull()
    .defaultNow(),
});

export type Session = typeof sessionsTable.$inferSelect;

/** One-time tokens for email verification and password resets. */
export const authTokensTable = pgTable("auth_tokens", {
  id: varchar("id", { length: 64 }).primaryKey(),
  userId: varchar("user_id", { length: 36 })
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  kind: text("kind").$type<AuthTokenKind>().notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true, mode: "date" }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
    .notNull()
    .defaultNow(),
});

export type AuthToken = typeof authTokensTable.$inferSelect;

/** Key/value store for small server-managed settings (e.g. webhooks). */
export const appSettingsTable = pgTable("app_settings", {
  key: varchar("key", { length: 191 }).primaryKey(),
  value: json("value").$type<unknown>(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export type AppSetting = typeof appSettingsTable.$inferSelect;
