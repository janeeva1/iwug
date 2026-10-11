ALTER TABLE "community_events" ADD COLUMN "ends_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "community_events" ADD COLUMN "venue" text;--> statement-breakpoint
ALTER TABLE "community_events" ADD COLUMN "latitude" double precision;--> statement-breakpoint
ALTER TABLE "community_events" ADD COLUMN "longitude" double precision;--> statement-breakpoint
ALTER TABLE "community_events" ADD COLUMN "image_url" text;