CREATE TABLE "live_conversations" (
	"id" text PRIMARY KEY NOT NULL,
	"kind" text NOT NULL,
	"listing_id" text,
	"listing_title" text NOT NULL,
	"area" text NOT NULL,
	"customer_user_id" text NOT NULL,
	"customer_name" text NOT NULL,
	"provider_user_id" text,
	"provider_name" text NOT NULL,
	"provider_slug" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "live_conversations_kind_check" CHECK ("live_conversations"."kind" IN ('service', 'product'))
);
--> statement-breakpoint
CREATE TABLE "live_invoices" (
	"id" text PRIMARY KEY NOT NULL,
	"ref_id" text NOT NULL,
	"conversation_id" text NOT NULL,
	"kind" text NOT NULL,
	"customer_user_id" text NOT NULL,
	"customer_name" text NOT NULL,
	"provider_user_id" text,
	"provider_name" text NOT NULL,
	"title" text NOT NULL,
	"agreed_date" text,
	"agreed_location" text,
	"original_amount_minor" integer,
	"discount_note" text,
	"referral_applied" boolean DEFAULT false NOT NULL,
	"subtotal_minor" integer NOT NULL,
	"fee_minor" integer NOT NULL,
	"total_minor" integer NOT NULL,
	"status" text DEFAULT 'sent' NOT NULL,
	"dispute_reason" text,
	"stripe_session_id" text,
	"paid_at" timestamp with time zone,
	"delivered_at" timestamp with time zone,
	"disputed_at" timestamp with time zone,
	"released_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "live_invoices_kind_check" CHECK ("live_invoices"."kind" IN ('service', 'product')),
	CONSTRAINT "live_invoices_status_check" CHECK ("live_invoices"."status" IN ('sent', 'paid_held', 'delivered', 'disputed', 'released', 'refunded'))
);
--> statement-breakpoint
CREATE TABLE "live_listings" (
	"id" text PRIMARY KEY NOT NULL,
	"kind" text NOT NULL,
	"owner_user_id" text NOT NULL,
	"owner_name" text NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"category" text NOT NULL,
	"area" text NOT NULL,
	"description" text NOT NULL,
	"price_minor" integer NOT NULL,
	"bulk_price_minor" integer,
	"min_bulk_qty" integer,
	"duration_mins" integer,
	"stock" integer,
	"unit" text,
	"photos" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "live_listings_kind_check" CHECK ("live_listings"."kind" IN ('service', 'product'))
);
--> statement-breakpoint
CREATE TABLE "live_messages" (
	"id" text PRIMARY KEY NOT NULL,
	"conversation_id" text NOT NULL,
	"sender_user_id" text,
	"sender_role" text NOT NULL,
	"sender_name" text NOT NULL,
	"body" text NOT NULL,
	"invoice_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "live_messages_role_check" CHECK ("live_messages"."sender_role" IN ('customer', 'provider'))
);
--> statement-breakpoint
CREATE TABLE "live_reviews" (
	"id" text PRIMARY KEY NOT NULL,
	"invoice_id" text NOT NULL,
	"provider_name" text NOT NULL,
	"provider_user_id" text,
	"title" text NOT NULL,
	"rating" integer NOT NULL,
	"comment" text NOT NULL,
	"author_user_id" text NOT NULL,
	"author_name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "live_reviews_rating_check" CHECK ("live_reviews"."rating" >= 1 AND "live_reviews"."rating" <= 5)
);
--> statement-breakpoint
ALTER TABLE "live_conversations" ADD CONSTRAINT "live_conversations_customer_user_id_users_id_fk" FOREIGN KEY ("customer_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "live_conversations" ADD CONSTRAINT "live_conversations_provider_user_id_users_id_fk" FOREIGN KEY ("provider_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "live_invoices" ADD CONSTRAINT "live_invoices_conversation_id_live_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."live_conversations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "live_invoices" ADD CONSTRAINT "live_invoices_customer_user_id_users_id_fk" FOREIGN KEY ("customer_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "live_invoices" ADD CONSTRAINT "live_invoices_provider_user_id_users_id_fk" FOREIGN KEY ("provider_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "live_listings" ADD CONSTRAINT "live_listings_owner_user_id_users_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "live_messages" ADD CONSTRAINT "live_messages_conversation_id_live_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."live_conversations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "live_reviews" ADD CONSTRAINT "live_reviews_invoice_id_live_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."live_invoices"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "live_reviews" ADD CONSTRAINT "live_reviews_author_user_id_users_id_fk" FOREIGN KEY ("author_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "live_conversations_customer_idx" ON "live_conversations" USING btree ("customer_user_id");--> statement-breakpoint
CREATE INDEX "live_conversations_provider_idx" ON "live_conversations" USING btree ("provider_user_id");--> statement-breakpoint
CREATE INDEX "live_conversations_updated_idx" ON "live_conversations" USING btree ("updated_at");--> statement-breakpoint
CREATE UNIQUE INDEX "live_invoices_ref_id_idx" ON "live_invoices" USING btree ("ref_id");--> statement-breakpoint
CREATE INDEX "live_invoices_conversation_idx" ON "live_invoices" USING btree ("conversation_id");--> statement-breakpoint
CREATE INDEX "live_invoices_customer_idx" ON "live_invoices" USING btree ("customer_user_id");--> statement-breakpoint
CREATE INDEX "live_invoices_provider_idx" ON "live_invoices" USING btree ("provider_user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "live_listings_slug_idx" ON "live_listings" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "live_listings_kind_idx" ON "live_listings" USING btree ("kind");--> statement-breakpoint
CREATE INDEX "live_listings_owner_idx" ON "live_listings" USING btree ("owner_user_id");--> statement-breakpoint
CREATE INDEX "live_messages_conversation_idx" ON "live_messages" USING btree ("conversation_id");--> statement-breakpoint
CREATE INDEX "live_messages_created_idx" ON "live_messages" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "live_reviews_invoice_id_idx" ON "live_reviews" USING btree ("invoice_id");--> statement-breakpoint
CREATE INDEX "live_reviews_provider_idx" ON "live_reviews" USING btree ("provider_user_id");