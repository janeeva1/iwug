CREATE TABLE "cms_pages" (
	"slug" varchar(191) PRIMARY KEY NOT NULL,
	"title_en" text NOT NULL,
	"title_ig" text NOT NULL,
	"summary_en" text NOT NULL,
	"summary_ig" text NOT NULL,
	"body_en" text NOT NULL,
	"body_ig" text NOT NULL,
	"hero_image" text,
	"published" boolean DEFAULT false NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "community_events" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"title_en" text NOT NULL,
	"title_ig" text NOT NULL,
	"description_en" text NOT NULL,
	"description_ig" text NOT NULL,
	"starts_at" timestamp with time zone NOT NULL,
	"location" text NOT NULL,
	"project" text NOT NULL,
	"status" text DEFAULT 'upcoming' NOT NULL,
	"published" boolean DEFAULT false NOT NULL,
	"report_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "members" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"user_id" varchar(36) NOT NULL,
	"display_name" text NOT NULL,
	"location" text NOT NULL,
	"tier_id" varchar(36) NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"share_wiki_stats" boolean DEFAULT false NOT NULL,
	"wiki_accounts" json NOT NULL,
	"total_paid_kobo" integer DEFAULT 0 NOT NULL,
	"last_payment_reference" varchar(191),
	"membership_started_at" timestamp with time zone,
	"renews_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "members_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "membership_tiers" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"name_en" text NOT NULL,
	"name_ig" text NOT NULL,
	"description_en" text NOT NULL,
	"description_ig" text NOT NULL,
	"price_ngn" integer DEFAULT 0 NOT NULL,
	"interval" text DEFAULT 'free' NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"benefits_en" json NOT NULL,
	"benefits_ig" json NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"reference" varchar(191) NOT NULL,
	"provider" varchar(32) DEFAULT 'paystack' NOT NULL,
	"purpose" text NOT NULL,
	"user_id" varchar(36),
	"member_id" varchar(36),
	"tier_id" varchar(36),
	"amount_kobo" integer NOT NULL,
	"currency" varchar(8) DEFAULT 'NGN' NOT NULL,
	"email" varchar(320),
	"status" text DEFAULT 'pending' NOT NULL,
	"channel" varchar(64),
	"paid_at" timestamp with time zone,
	"metadata" json,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "payments_reference_unique" UNIQUE("reference")
);
--> statement-breakpoint
CREATE TABLE "site_collections" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"items" json NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "site_content" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"value_en" text NOT NULL,
	"value_ig" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "site_settings" (
	"id" varchar(36) PRIMARY KEY DEFAULT 'default' NOT NULL,
	"donation_url" text,
	"contact_email" varchar(320) DEFAULT 'ndewo@wikimediaigbo.org' NOT NULL,
	"contact_address" varchar(500) DEFAULT 'Cavic Nigeria, No. 30 Agadez Street, opposite Glo Office, off Aminu Kano Crescent, Wuse 2, Abuja, Nigeria' NOT NULL,
	"currency" text DEFAULT 'NGN' NOT NULL,
	"donation_enabled" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "app_settings" (
	"key" varchar(191) PRIMARY KEY NOT NULL,
	"value" json,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "auth_tokens" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"user_id" varchar(36) NOT NULL,
	"kind" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "oauth_accounts" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"user_id" varchar(36) NOT NULL,
	"provider" text NOT NULL,
	"provider_account_id" varchar(191) NOT NULL,
	"email" varchar(320),
	"username" varchar(191),
	"access_token" text,
	"refresh_token" text,
	"expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"user_id" varchar(36) NOT NULL,
	"user_agent" varchar(255),
	"ip" varchar(64),
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"username" varchar(191),
	"display_name" varchar(191),
	"email" varchar(320),
	"email_verified" boolean DEFAULT false NOT NULL,
	"password_hash" varchar(255),
	"avatar_url" varchar(500),
	"role" text DEFAULT 'member' NOT NULL,
	"wikimedia_user_id" varchar(64),
	"wikimedia_edit_count" integer DEFAULT 0 NOT NULL,
	"wikimedia_verified" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "members" ADD CONSTRAINT "members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "members" ADD CONSTRAINT "members_tier_id_membership_tiers_id_fk" FOREIGN KEY ("tier_id") REFERENCES "public"."membership_tiers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_tier_id_membership_tiers_id_fk" FOREIGN KEY ("tier_id") REFERENCES "public"."membership_tiers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth_tokens" ADD CONSTRAINT "auth_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "oauth_accounts" ADD CONSTRAINT "oauth_accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "oauth_accounts_provider_account_idx" ON "oauth_accounts" USING btree ("provider","provider_account_id");