ALTER TABLE "users" ADD COLUMN "is_admin" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "vendor_profiles" ADD COLUMN "is_seller" boolean DEFAULT false NOT NULL;