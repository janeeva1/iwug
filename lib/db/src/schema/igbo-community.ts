import { createInsertSchema } from "drizzle-zod";
import {
  boolean,
  doublePrecision,
  integer,
  json,
  pgTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { z } from "zod/v4";
import { usersTable } from "./auth";

export type WikimediaAccount = {
  project:
    | "igwiki"
    | "igwikt"
    | "igwikiquote"
    | "wikidata"
    | "commons"
    | "wikifunctions"
    | "enwiki"
    | "wikisource"
    | "meta";
  username: string;
};

export const cmsPagesTable = pgTable("cms_pages", {
  slug: varchar("slug", { length: 191 }).primaryKey(),
  titleEn: text("title_en").notNull(),
  titleIg: text("title_ig").notNull(),
  summaryEn: text("summary_en").notNull(),
  summaryIg: text("summary_ig").notNull(),
  bodyEn: text("body_en").notNull(),
  bodyIg: text("body_ig").notNull(),
  heroImage: text("hero_image"),
  published: boolean("published").notNull().default(false),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const insertCmsPageSchema = createInsertSchema(cmsPagesTable).omit({
  updatedAt: true,
});
export type InsertCmsPage = z.infer<typeof insertCmsPageSchema>;
export type CmsPage = typeof cmsPagesTable.$inferSelect;

export const communityEventsTable = pgTable("community_events", {
  id: varchar("id", { length: 36 }).primaryKey(),
  titleEn: text("title_en").notNull(),
  titleIg: text("title_ig").notNull(),
  descriptionEn: text("description_en").notNull(),
  descriptionIg: text("description_ig").notNull(),
  startsAt: timestamp("starts_at", { withTimezone: true, mode: "date" }).notNull(),
  endsAt: timestamp("ends_at", { withTimezone: true, mode: "date" }),
  location: text("location").notNull(),
  venue: text("venue"),
  latitude: doublePrecision("latitude"),
  longitude: doublePrecision("longitude"),
  imageUrl: text("image_url"),
  project: text("project").notNull(),
  status: text("status")
    .$type<"upcoming" | "completed">()
    .notNull()
    .default("upcoming"),
  published: boolean("published").notNull().default(false),
  reportUrl: text("report_url"),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
    .notNull()
    .defaultNow(),
});

export const insertCommunityEventSchema = createInsertSchema(
  communityEventsTable,
).omit({ createdAt: true });
export type InsertCommunityEvent = z.infer<typeof insertCommunityEventSchema>;
export type CommunityEvent = typeof communityEventsTable.$inferSelect;

export type TierInterval = "free" | "monthly" | "annual" | "once";

export const membershipTiersTable = pgTable("membership_tiers", {
  id: varchar("id", { length: 36 }).primaryKey(),
  nameEn: text("name_en").notNull(),
  nameIg: text("name_ig").notNull(),
  descriptionEn: text("description_en").notNull(),
  descriptionIg: text("description_ig").notNull(),
  priceNgn: integer("price_ngn").notNull().default(0),
  interval: text("interval")
    .$type<TierInterval>()
    .notNull()
    .default("free"),
  active: boolean("active").notNull().default(true),
  benefitsEn: json("benefits_en").$type<string[]>().notNull().$defaultFn(() => []),
  benefitsIg: json("benefits_ig").$type<string[]>().notNull().$defaultFn(() => []),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
    .notNull()
    .defaultNow(),
});

export const insertMembershipTierSchema = createInsertSchema(
  membershipTiersTable,
).omit({ createdAt: true });
export type InsertMembershipTier = z.infer<typeof insertMembershipTierSchema>;
export type MembershipTier = typeof membershipTiersTable.$inferSelect;

/** Persisted membership lifecycle. Expiry is derived from `renewsAt`, not stored. */
export type MemberStatus = "pending" | "active" | "paused";

export const membersTable = pgTable("members", {
  id: varchar("id", { length: 36 }).primaryKey(),
  userId: varchar("user_id", { length: 36 })
    .notNull()
    .unique()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  displayName: text("display_name").notNull(),
  location: text("location").notNull(),
  tierId: varchar("tier_id", { length: 36 })
    .notNull()
    .references(() => membershipTiersTable.id),
  status: text("status").$type<MemberStatus>().notNull().default("pending"),
  shareWikiStats: boolean("share_wiki_stats").notNull().default(false),
  wikiAccounts: json("wiki_accounts")
    .$type<WikimediaAccount[]>()
    .notNull()
    .$defaultFn(() => []),
  /** Money actually settled for this membership, in kobo (1 NGN = 100 kobo). */
  totalPaidKobo: integer("total_paid_kobo").notNull().default(0),
  lastPaymentReference: varchar("last_payment_reference", { length: 191 }),
  membershipStartedAt: timestamp("membership_started_at", {
    withTimezone: true,
    mode: "date",
  }),
  renewsAt: timestamp("renews_at", { withTimezone: true, mode: "date" }),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
    .notNull()
    .defaultNow(),
});

export const insertMemberSchema = createInsertSchema(membersTable).omit({
  createdAt: true,
});
export type InsertMember = z.infer<typeof insertMemberSchema>;
export type Member = typeof membersTable.$inferSelect;

export const siteSettingsTable = pgTable("site_settings", {
  id: varchar("id", { length: 36 }).primaryKey().default("default"),
  donationUrl: text("donation_url"),
  contactEmail: varchar("contact_email", { length: 320 })
    .notNull()
    .default("ndewo@wikimediaigbo.org"),
  contactAddress: varchar("contact_address", { length: 500 })
    .notNull()
    .default(
      "Cavic Nigeria, No. 30 Agadez Street, opposite Glo Office, off Aminu Kano Crescent, Wuse 2, Abuja, Nigeria",
    ),
  currency: text("currency")
    .$type<"NGN" | "USD">()
    .notNull()
    .default("NGN"),
  donationEnabled: boolean("donation_enabled").notNull().default(false),
});

export const insertSiteSettingsSchema = createInsertSchema(siteSettingsTable);
export type InsertSiteSettings = z.infer<typeof insertSiteSettingsSchema>;
export type SiteSettingsRow = typeof siteSettingsTable.$inferSelect;

/**
 * Editable, bilingual site copy. `id` is a stable slug; `source` (the English
 * literal) lives in the shared content model and is not stored here.
 */
export const siteContentTable = pgTable("site_content", {
  id: varchar("id", { length: 64 }).primaryKey(),
  valueEn: text("value_en").notNull(),
  valueIg: text("value_ig").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export type SiteContentRow = typeof siteContentTable.$inferSelect;

/** Repeatable bilingual content lists (projects, photos, timeline…). */
export const siteCollectionsTable = pgTable("site_collections", {
  id: varchar("id", { length: 64 }).primaryKey(),
  items: json("items").$type<unknown[]>().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export type SiteCollectionRow = typeof siteCollectionsTable.$inferSelect;

export type PaymentPurpose = "membership" | "donation";
export type PaymentStatus = "pending" | "success" | "failed" | "abandoned";

/**
 * Every Paystack transaction we initiate, whether it funds a membership tier
 * or a one-off donation. Amounts are stored in the smallest currency unit
 * (kobo for NGN) exactly as Paystack reports them.
 */
export const paymentsTable = pgTable("payments", {
  id: varchar("id", { length: 36 }).primaryKey(),
  reference: varchar("reference", { length: 191 }).notNull().unique(),
  provider: varchar("provider", { length: 32 }).notNull().default("paystack"),
  purpose: text("purpose").$type<PaymentPurpose>().notNull(),
  userId: varchar("user_id", { length: 36 }).references(() => usersTable.id, {
    onDelete: "set null",
  }),
  memberId: varchar("member_id", { length: 36 }).references(
    () => membersTable.id,
    { onDelete: "set null" },
  ),
  tierId: varchar("tier_id", { length: 36 }).references(
    () => membershipTiersTable.id,
    { onDelete: "set null" },
  ),
  amountKobo: integer("amount_kobo").notNull(),
  currency: varchar("currency", { length: 8 }).notNull().default("NGN"),
  email: varchar("email", { length: 320 }),
  status: text("status")
    .$type<PaymentStatus>()
    .notNull()
    .default("pending"),
  channel: varchar("channel", { length: 64 }),
  paidAt: timestamp("paid_at", { withTimezone: true, mode: "date" }),
  metadata: json("metadata").$type<Record<string, unknown>>(),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const insertPaymentSchema = createInsertSchema(paymentsTable).omit({
  createdAt: true,
  updatedAt: true,
});
export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type Payment = typeof paymentsTable.$inferSelect;
