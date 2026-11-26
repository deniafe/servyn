ALTER TABLE "live_invoices" ADD COLUMN "disputed" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "live_invoices" ADD COLUMN "customer_confirmed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "live_invoices" ADD COLUMN "provider_confirmed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "live_invoices" ADD COLUMN "auto_release_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "live_invoices" ADD COLUMN "reminder_sent_at" timestamp with time zone;