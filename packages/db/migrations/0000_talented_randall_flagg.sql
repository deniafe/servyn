-- Enable PostGIS (spatial geometry columns and ST_* functions)
CREATE EXTENSION IF NOT EXISTS postgis;
--> statement-breakpoint
-- Enable pgvector (vector(N) columns and <=> cosine operator)
CREATE EXTENSION IF NOT EXISTS vector;
--> statement-breakpoint
CREATE TABLE "customer_profiles" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"display_name" text NOT NULL,
	"default_location" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "safeguarding_reports" (
	"id" text PRIMARY KEY NOT NULL,
	"booking_id" text NOT NULL,
	"reporter_id" text NOT NULL,
	"description" text NOT NULL,
	"state" text DEFAULT 'open' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "safeguarding_reports_state_check" CHECK ("safeguarding_reports"."state" IN ('open', 'under_review', 'resolved', 'closed'))
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"clerk_user_id" text NOT NULL,
	"email" text NOT NULL,
	"phone" text,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_status_check" CHECK ("users"."status" IN ('active', 'suspended', 'deleted'))
);
--> statement-breakpoint
CREATE TABLE "vendor_members" (
	"id" text PRIMARY KEY NOT NULL,
	"vendor_id" text NOT NULL,
	"user_id" text NOT NULL,
	"role" text DEFAULT 'member' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "vendor_members_role_check" CHECK ("vendor_members"."role" IN ('owner', 'member'))
);
--> statement-breakpoint
CREATE TABLE "vendor_profiles" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"business_name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"service_area" geometry(Geometry, 4326),
	"stripe_account_id" text,
	"verification_status" text DEFAULT 'unverified' NOT NULL,
	"rating_avg" integer DEFAULT 0 NOT NULL,
	"rating_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "vendor_profiles_verification_status_check" CHECK ("vendor_profiles"."verification_status" IN ('unverified', 'pending', 'verified', 'rejected'))
);
--> statement-breakpoint
CREATE TABLE "verifications" (
	"id" text PRIMARY KEY NOT NULL,
	"vendor_id" text NOT NULL,
	"kind" text NOT NULL,
	"state" text DEFAULT 'pending' NOT NULL,
	"object_key" text,
	"expires_on" timestamp with time zone,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "verifications_kind_check" CHECK ("verifications"."kind" IN ('identity', 'business', 'dbs', 'qualification', 'reference')),
	CONSTRAINT "verifications_state_check" CHECK ("verifications"."state" IN ('unverified', 'pending', 'verified', 'rejected', 'expired'))
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" text PRIMARY KEY NOT NULL,
	"parent_id" text,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"kind" text NOT NULL,
	"trust_tier" text DEFAULT 'standard' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "categories_kind_check" CHECK ("categories"."kind" IN ('service', 'product')),
	CONSTRAINT "categories_trust_tier_check" CHECK ("categories"."trust_tier" IN ('standard', 'enhanced'))
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" text PRIMARY KEY NOT NULL,
	"seller_id" text NOT NULL,
	"category_id" text NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"price_minor" integer NOT NULL,
	"stock" integer DEFAULT 0 NOT NULL,
	"bulk_options" jsonb,
	"images" jsonb,
	"listing_status" text DEFAULT 'draft' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "products_listing_status_check" CHECK ("products"."listing_status" IN ('draft', 'active', 'paused', 'deleted'))
);
--> statement-breakpoint
CREATE TABLE "services" (
	"id" text PRIMARY KEY NOT NULL,
	"vendor_id" text NOT NULL,
	"category_id" text NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"duration_minutes" integer NOT NULL,
	"price_minor" integer NOT NULL,
	"images" jsonb,
	"service_area" geometry(Geometry, 4326),
	"booking_model" text DEFAULT 'request' NOT NULL,
	"listing_status" text DEFAULT 'draft' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "services_booking_model_check" CHECK ("services"."booking_model" IN ('request', 'instant', 'quote')),
	CONSTRAINT "services_listing_status_check" CHECK ("services"."listing_status" IN ('draft', 'active', 'paused', 'deleted'))
);
--> statement-breakpoint
CREATE TABLE "listing_embeddings" (
	"id" text PRIMARY KEY NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" text NOT NULL,
	"model" text NOT NULL,
	"embedding" vector(1536) NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "listing_embeddings_entity_type_check" CHECK ("listing_embeddings"."entity_type" IN ('service', 'product', 'vendor'))
);
--> statement-breakpoint
CREATE TABLE "availability_exceptions" (
	"id" text PRIMARY KEY NOT NULL,
	"vendor_id" text NOT NULL,
	"date" timestamp with time zone NOT NULL,
	"kind" text NOT NULL,
	"start" time,
	"end" time,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "availability_exceptions_kind_check" CHECK ("availability_exceptions"."kind" IN ('unavailable', 'available_override'))
);
--> statement-breakpoint
CREATE TABLE "availability_rules" (
	"id" text PRIMARY KEY NOT NULL,
	"vendor_id" text NOT NULL,
	"weekday" integer NOT NULL,
	"start" time NOT NULL,
	"end" time NOT NULL,
	"effective_from" timestamp with time zone,
	"effective_to" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "availability_rules_weekday_check" CHECK ("availability_rules"."weekday" >= 0 AND "availability_rules"."weekday" <= 6)
);
--> statement-breakpoint
CREATE TABLE "booking_events" (
	"id" text PRIMARY KEY NOT NULL,
	"booking_id" text NOT NULL,
	"status" text NOT NULL,
	"actor_id" text NOT NULL,
	"at" bigint NOT NULL,
	"metadata" jsonb,
	CONSTRAINT "booking_events_status_check" CHECK ("booking_events"."status" IN ('requested', 'accepted', 'declined', 'confirmed', 'in_progress', 'vendor_complete', 'completed', 'cancelled', 'disputed', 'under_review', 'refunded'))
);
--> statement-breakpoint
CREATE TABLE "bookings" (
	"id" text PRIMARY KEY NOT NULL,
	"customer_id" text NOT NULL,
	"vendor_id" text NOT NULL,
	"service_id" text NOT NULL,
	"quote_id" text,
	"booking_model" text NOT NULL,
	"status" text DEFAULT 'requested' NOT NULL,
	"scheduled_at" timestamp with time zone NOT NULL,
	"duration_minutes" integer NOT NULL,
	"gross_price_minor" integer NOT NULL,
	"vendor_share_minor" integer NOT NULL,
	"platform_fee_minor" integer NOT NULL,
	"payment_id" text,
	"policy_version_id" text NOT NULL,
	"event_details" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "bookings_booking_model_check" CHECK ("bookings"."booking_model" IN ('request', 'instant', 'quote')),
	CONSTRAINT "bookings_status_check" CHECK ("bookings"."status" IN ('requested', 'accepted', 'declined', 'confirmed', 'in_progress', 'vendor_complete', 'completed', 'cancelled', 'disputed', 'under_review', 'refunded'))
);
--> statement-breakpoint
CREATE TABLE "favourites" (
	"id" text PRIMARY KEY NOT NULL,
	"customer_id" text NOT NULL,
	"vendor_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "policy_versions" (
	"id" text PRIMARY KEY NOT NULL,
	"version" text NOT NULL,
	"cancellation_rules" jsonb NOT NULL,
	"refund_rules" jsonb NOT NULL,
	"effective_from" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quotes" (
	"id" text PRIMARY KEY NOT NULL,
	"customer_id" text NOT NULL,
	"vendor_id" text NOT NULL,
	"state" text DEFAULT 'requested' NOT NULL,
	"request" jsonb NOT NULL,
	"quote_lines" jsonb,
	"total_minor" integer,
	"booking_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "quotes_state_check" CHECK ("quotes"."state" IN ('requested', 'quoted', 'accepted', 'declined'))
);
--> statement-breakpoint
CREATE TABLE "fee_waivers" (
	"id" text PRIMARY KEY NOT NULL,
	"vendor_id" text NOT NULL,
	"kind" text NOT NULL,
	"starts_on" timestamp with time zone NOT NULL,
	"ends_on" timestamp with time zone NOT NULL,
	"fee_override_bps" integer NOT NULL,
	"promo_code" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "fee_waivers_kind_check" CHECK ("fee_waivers"."kind" IN ('early_adopter', 'promo'))
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" text PRIMARY KEY NOT NULL,
	"booking_id" text,
	"order_id" text,
	"stripe_payment_intent_id" text,
	"amount_minor" integer NOT NULL,
	"vendor_share_minor" integer NOT NULL,
	"platform_fee_minor" integer NOT NULL,
	"state" text DEFAULT 'requires_payment' NOT NULL,
	"held_at" timestamp with time zone,
	"releasable_at" timestamp with time zone,
	"released_at" timestamp with time zone,
	"release_basis" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "payments_booking_or_order_check" CHECK (("payments"."booking_id" IS NOT NULL AND "payments"."order_id" IS NULL) OR ("payments"."booking_id" IS NULL AND "payments"."order_id" IS NOT NULL)),
	CONSTRAINT "payments_state_check" CHECK ("payments"."state" IN ('requires_payment', 'processing', 'held', 'releasable', 'released', 'refund_pending', 'refunded', 'disputed', 'under_review', 'error')),
	CONSTRAINT "payments_release_basis_check" CHECK ("payments"."release_basis" IS NULL OR "payments"."release_basis" IN ('completion_confirm', 'auto_48h', 'delivery'))
);
--> statement-breakpoint
CREATE TABLE "refunds" (
	"id" text PRIMARY KEY NOT NULL,
	"payment_id" text NOT NULL,
	"stripe_refund_id" text NOT NULL,
	"amount_minor" integer NOT NULL,
	"vendor_share_returned_minor" integer NOT NULL,
	"reason" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "refunds_reason_check" CHECK ("refunds"."reason" IN ('vendor_cancel', 'customer_cancel', 'dispute_resolved', 'admin'))
);
--> statement-breakpoint
CREATE TABLE "transfers" (
	"id" text PRIMARY KEY NOT NULL,
	"payment_id" text NOT NULL,
	"stripe_transfer_id" text NOT NULL,
	"amount_minor" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "disputes" (
	"id" text PRIMARY KEY NOT NULL,
	"booking_id" text NOT NULL,
	"opened_by" text NOT NULL,
	"reason" text NOT NULL,
	"description" text NOT NULL,
	"state" text DEFAULT 'open' NOT NULL,
	"opened_at" timestamp with time zone DEFAULT now() NOT NULL,
	"resolved_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "disputes_reason_check" CHECK ("disputes"."reason" IN ('service_not_delivered', 'quality_issue', 'no_show', 'unauthorised_charge', 'other')),
	CONSTRAINT "disputes_state_check" CHECK ("disputes"."state" IN ('open', 'under_review', 'resolved_customer', 'resolved_vendor', 'closed'))
);
--> statement-breakpoint
CREATE TABLE "evidence" (
	"id" text PRIMARY KEY NOT NULL,
	"dispute_id" text NOT NULL,
	"submitted_by" text NOT NULL,
	"kind" text NOT NULL,
	"object_key" text,
	"body" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "evidence_kind_check" CHECK ("evidence"."kind" IN ('image', 'document', 'text', 'video'))
);
--> statement-breakpoint
CREATE TABLE "conversations" (
	"id" text PRIMARY KEY NOT NULL,
	"booking_id" text,
	"order_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "conversations_booking_or_order_check" CHECK (("conversations"."booking_id" IS NOT NULL AND "conversations"."order_id" IS NULL) OR ("conversations"."booking_id" IS NULL AND "conversations"."order_id" IS NOT NULL))
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" text PRIMARY KEY NOT NULL,
	"conversation_id" text NOT NULL,
	"sender_id" text NOT NULL,
	"body" text,
	"attachments" jsonb,
	"redacted" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reviews" (
	"id" text PRIMARY KEY NOT NULL,
	"booking_id" text,
	"order_id" text,
	"customer_id" text NOT NULL,
	"vendor_id" text NOT NULL,
	"rating" integer NOT NULL,
	"body" text,
	"moderation_state" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "reviews_booking_or_order_check" CHECK (("reviews"."booking_id" IS NOT NULL AND "reviews"."order_id" IS NULL) OR ("reviews"."booking_id" IS NULL AND "reviews"."order_id" IS NOT NULL)),
	CONSTRAINT "reviews_rating_range_check" CHECK ("reviews"."rating" >= 1 AND "reviews"."rating" <= 5),
	CONSTRAINT "reviews_moderation_state_check" CHECK ("reviews"."moderation_state" IN ('pending', 'published', 'hidden'))
);
--> statement-breakpoint
CREATE TABLE "bulk_enquiries" (
	"id" text PRIMARY KEY NOT NULL,
	"customer_id" text NOT NULL,
	"seller_id" text NOT NULL,
	"product_id" text NOT NULL,
	"state" text DEFAULT 'enquired' NOT NULL,
	"request" jsonb NOT NULL,
	"quote_lines" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "bulk_enquiries_state_check" CHECK ("bulk_enquiries"."state" IN ('enquired', 'quoted', 'converted', 'declined'))
);
--> statement-breakpoint
CREATE TABLE "order_items" (
	"id" text PRIMARY KEY NOT NULL,
	"order_id" text NOT NULL,
	"product_id" text NOT NULL,
	"qty" integer NOT NULL,
	"unit_price_minor" integer NOT NULL,
	"is_bulk" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" text PRIMARY KEY NOT NULL,
	"customer_id" text NOT NULL,
	"seller_id" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"total_minor" integer NOT NULL,
	"delivery" jsonb NOT NULL,
	"payment_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "orders_status_check" CHECK ("orders"."status" IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'completed', 'cancelled', 'refunded'))
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"channel" text NOT NULL,
	"type" text NOT NULL,
	"payload" jsonb NOT NULL,
	"read_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "notifications_channel_check" CHECK ("notifications"."channel" IN ('email', 'sms', 'push', 'in_app'))
);
--> statement-breakpoint
CREATE TABLE "audit_log" (
	"id" text PRIMARY KEY NOT NULL,
	"actor_id" text NOT NULL,
	"action" text NOT NULL,
	"resource_type" text NOT NULL,
	"resource_id" text NOT NULL,
	"metadata" jsonb,
	"at" bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE "export_jobs" (
	"id" text PRIMARY KEY NOT NULL,
	"vendor_id" text NOT NULL,
	"kind" text NOT NULL,
	"format" text NOT NULL,
	"state" text DEFAULT 'pending' NOT NULL,
	"object_key" text,
	"range_from" timestamp with time zone NOT NULL,
	"range_to" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "export_jobs_kind_check" CHECK ("export_jobs"."kind" IN ('transactions', 'bookings', 'tax_summary')),
	CONSTRAINT "export_jobs_format_check" CHECK ("export_jobs"."format" IN ('csv', 'pdf')),
	CONSTRAINT "export_jobs_state_check" CHECK ("export_jobs"."state" IN ('pending', 'processing', 'completed', 'failed'))
);
--> statement-breakpoint
CREATE TABLE "support_tickets" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"subject" text NOT NULL,
	"state" text DEFAULT 'open' NOT NULL,
	"queue" text DEFAULT 'general' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "support_tickets_state_check" CHECK ("support_tickets"."state" IN ('open', 'in_progress', 'resolved', 'closed')),
	CONSTRAINT "support_tickets_queue_check" CHECK ("support_tickets"."queue" IN ('general', 'payments', 'disputes', 'safety', 'technical'))
);
--> statement-breakpoint
CREATE TABLE "webhook_events" (
	"id" text PRIMARY KEY NOT NULL,
	"provider" text NOT NULL,
	"event_id" text NOT NULL,
	"type" text NOT NULL,
	"state" text DEFAULT 'received' NOT NULL,
	"payload" jsonb NOT NULL,
	"processed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "webhook_events_provider_check" CHECK ("webhook_events"."provider" IN ('stripe', 'clerk', 'inngest')),
	CONSTRAINT "webhook_events_state_check" CHECK ("webhook_events"."state" IN ('received', 'processing', 'processed', 'failed'))
);
--> statement-breakpoint
ALTER TABLE "customer_profiles" ADD CONSTRAINT "customer_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "safeguarding_reports" ADD CONSTRAINT "safeguarding_reports_reporter_id_users_id_fk" FOREIGN KEY ("reporter_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_members" ADD CONSTRAINT "vendor_members_vendor_id_vendor_profiles_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendor_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_members" ADD CONSTRAINT "vendor_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_profiles" ADD CONSTRAINT "vendor_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "verifications" ADD CONSTRAINT "verifications_vendor_id_vendor_profiles_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendor_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_seller_id_users_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "services" ADD CONSTRAINT "services_vendor_id_vendor_profiles_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendor_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "services" ADD CONSTRAINT "services_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "availability_exceptions" ADD CONSTRAINT "availability_exceptions_vendor_id_vendor_profiles_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendor_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "availability_rules" ADD CONSTRAINT "availability_rules_vendor_id_vendor_profiles_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendor_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking_events" ADD CONSTRAINT "booking_events_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking_events" ADD CONSTRAINT "booking_events_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_customer_id_users_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_vendor_id_vendor_profiles_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendor_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_policy_version_id_policy_versions_id_fk" FOREIGN KEY ("policy_version_id") REFERENCES "public"."policy_versions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "favourites" ADD CONSTRAINT "favourites_customer_id_users_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "favourites" ADD CONSTRAINT "favourites_vendor_id_vendor_profiles_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendor_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_customer_id_users_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_vendor_id_vendor_profiles_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendor_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fee_waivers" ADD CONSTRAINT "fee_waivers_vendor_id_vendor_profiles_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendor_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_payment_id_payments_id_fk" FOREIGN KEY ("payment_id") REFERENCES "public"."payments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transfers" ADD CONSTRAINT "transfers_payment_id_payments_id_fk" FOREIGN KEY ("payment_id") REFERENCES "public"."payments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "disputes" ADD CONSTRAINT "disputes_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "disputes" ADD CONSTRAINT "disputes_opened_by_users_id_fk" FOREIGN KEY ("opened_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evidence" ADD CONSTRAINT "evidence_dispute_id_disputes_id_fk" FOREIGN KEY ("dispute_id") REFERENCES "public"."disputes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evidence" ADD CONSTRAINT "evidence_submitted_by_users_id_fk" FOREIGN KEY ("submitted_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_sender_id_users_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_customer_id_users_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_vendor_id_vendor_profiles_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendor_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bulk_enquiries" ADD CONSTRAINT "bulk_enquiries_customer_id_users_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bulk_enquiries" ADD CONSTRAINT "bulk_enquiries_seller_id_users_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bulk_enquiries" ADD CONSTRAINT "bulk_enquiries_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_customer_id_users_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_seller_id_users_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "export_jobs" ADD CONSTRAINT "export_jobs_vendor_id_users_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "customer_profiles_user_id_idx" ON "customer_profiles" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "safeguarding_reports_booking_id_idx" ON "safeguarding_reports" USING btree ("booking_id");--> statement-breakpoint
CREATE INDEX "safeguarding_reports_reporter_id_idx" ON "safeguarding_reports" USING btree ("reporter_id");--> statement-breakpoint
CREATE UNIQUE INDEX "users_clerk_user_id_idx" ON "users" USING btree ("clerk_user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "vendor_members_vendor_user_idx" ON "vendor_members" USING btree ("vendor_id","user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "vendor_profiles_user_id_idx" ON "vendor_profiles" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "vendor_profiles_slug_idx" ON "vendor_profiles" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "vendor_profiles_service_area_gist_idx" ON "vendor_profiles" USING gist ("service_area");--> statement-breakpoint
CREATE INDEX "verifications_vendor_id_idx" ON "verifications" USING btree ("vendor_id");--> statement-breakpoint
CREATE UNIQUE INDEX "categories_slug_idx" ON "categories" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "categories_kind_idx" ON "categories" USING btree ("kind");--> statement-breakpoint
CREATE INDEX "categories_parent_id_idx" ON "categories" USING btree ("parent_id");--> statement-breakpoint
CREATE UNIQUE INDEX "products_slug_idx" ON "products" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "products_seller_id_idx" ON "products" USING btree ("seller_id");--> statement-breakpoint
CREATE INDEX "products_category_id_idx" ON "products" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "products_listing_status_idx" ON "products" USING btree ("listing_status");--> statement-breakpoint
CREATE UNIQUE INDEX "services_slug_idx" ON "services" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "services_vendor_id_idx" ON "services" USING btree ("vendor_id");--> statement-breakpoint
CREATE INDEX "services_category_id_idx" ON "services" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "services_listing_status_idx" ON "services" USING btree ("listing_status");--> statement-breakpoint
CREATE INDEX "services_service_area_gist_idx" ON "services" USING gist ("service_area");--> statement-breakpoint
CREATE INDEX "listing_embeddings_entity_idx" ON "listing_embeddings" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "listing_embeddings_embedding_hnsw_idx" ON "listing_embeddings" USING hnsw ("embedding" vector_cosine_ops);--> statement-breakpoint
CREATE INDEX "availability_exceptions_vendor_date_idx" ON "availability_exceptions" USING btree ("vendor_id","date");--> statement-breakpoint
CREATE INDEX "availability_rules_vendor_id_idx" ON "availability_rules" USING btree ("vendor_id");--> statement-breakpoint
CREATE INDEX "booking_events_booking_id_idx" ON "booking_events" USING btree ("booking_id");--> statement-breakpoint
CREATE INDEX "booking_events_at_idx" ON "booking_events" USING btree ("at");--> statement-breakpoint
CREATE INDEX "bookings_customer_id_idx" ON "bookings" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "bookings_vendor_id_idx" ON "bookings" USING btree ("vendor_id");--> statement-breakpoint
CREATE INDEX "bookings_status_idx" ON "bookings" USING btree ("status");--> statement-breakpoint
CREATE INDEX "bookings_scheduled_at_idx" ON "bookings" USING btree ("scheduled_at");--> statement-breakpoint
CREATE UNIQUE INDEX "favourites_customer_vendor_idx" ON "favourites" USING btree ("customer_id","vendor_id");--> statement-breakpoint
CREATE UNIQUE INDEX "policy_versions_version_idx" ON "policy_versions" USING btree ("version");--> statement-breakpoint
CREATE INDEX "quotes_customer_id_idx" ON "quotes" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "quotes_vendor_id_idx" ON "quotes" USING btree ("vendor_id");--> statement-breakpoint
CREATE INDEX "fee_waivers_vendor_id_idx" ON "fee_waivers" USING btree ("vendor_id");--> statement-breakpoint
CREATE INDEX "fee_waivers_promo_code_idx" ON "fee_waivers" USING btree ("promo_code");--> statement-breakpoint
CREATE INDEX "payments_booking_id_idx" ON "payments" USING btree ("booking_id");--> statement-breakpoint
CREATE INDEX "payments_order_id_idx" ON "payments" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "payments_state_idx" ON "payments" USING btree ("state");--> statement-breakpoint
CREATE INDEX "payments_stripe_pi_idx" ON "payments" USING btree ("stripe_payment_intent_id");--> statement-breakpoint
CREATE INDEX "refunds_payment_id_idx" ON "refunds" USING btree ("payment_id");--> statement-breakpoint
CREATE INDEX "refunds_stripe_refund_id_idx" ON "refunds" USING btree ("stripe_refund_id");--> statement-breakpoint
CREATE INDEX "transfers_payment_id_idx" ON "transfers" USING btree ("payment_id");--> statement-breakpoint
CREATE INDEX "transfers_stripe_transfer_id_idx" ON "transfers" USING btree ("stripe_transfer_id");--> statement-breakpoint
CREATE INDEX "disputes_booking_id_idx" ON "disputes" USING btree ("booking_id");--> statement-breakpoint
CREATE INDEX "disputes_opened_by_idx" ON "disputes" USING btree ("opened_by");--> statement-breakpoint
CREATE INDEX "disputes_state_idx" ON "disputes" USING btree ("state");--> statement-breakpoint
CREATE INDEX "evidence_dispute_id_idx" ON "evidence" USING btree ("dispute_id");--> statement-breakpoint
CREATE INDEX "conversations_booking_id_idx" ON "conversations" USING btree ("booking_id");--> statement-breakpoint
CREATE INDEX "conversations_order_id_idx" ON "conversations" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "messages_conversation_id_idx" ON "messages" USING btree ("conversation_id");--> statement-breakpoint
CREATE INDEX "messages_created_at_idx" ON "messages" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "reviews_booking_id_idx" ON "reviews" USING btree ("booking_id");--> statement-breakpoint
CREATE INDEX "reviews_order_id_idx" ON "reviews" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "reviews_vendor_id_idx" ON "reviews" USING btree ("vendor_id");--> statement-breakpoint
CREATE INDEX "reviews_moderation_state_idx" ON "reviews" USING btree ("moderation_state");--> statement-breakpoint
CREATE INDEX "bulk_enquiries_customer_id_idx" ON "bulk_enquiries" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "bulk_enquiries_seller_id_idx" ON "bulk_enquiries" USING btree ("seller_id");--> statement-breakpoint
CREATE INDEX "order_items_order_id_idx" ON "order_items" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "orders_customer_id_idx" ON "orders" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "orders_seller_id_idx" ON "orders" USING btree ("seller_id");--> statement-breakpoint
CREATE INDEX "orders_status_idx" ON "orders" USING btree ("status");--> statement-breakpoint
CREATE INDEX "notifications_user_id_idx" ON "notifications" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "notifications_channel_idx" ON "notifications" USING btree ("channel");--> statement-breakpoint
CREATE INDEX "notifications_read_at_idx" ON "notifications" USING btree ("read_at");--> statement-breakpoint
CREATE INDEX "audit_log_actor_id_idx" ON "audit_log" USING btree ("actor_id");--> statement-breakpoint
CREATE INDEX "audit_log_resource_idx" ON "audit_log" USING btree ("resource_type","resource_id");--> statement-breakpoint
CREATE INDEX "audit_log_at_idx" ON "audit_log" USING btree ("at");--> statement-breakpoint
CREATE INDEX "export_jobs_vendor_id_idx" ON "export_jobs" USING btree ("vendor_id");--> statement-breakpoint
CREATE INDEX "export_jobs_state_idx" ON "export_jobs" USING btree ("state");--> statement-breakpoint
CREATE INDEX "support_tickets_user_id_idx" ON "support_tickets" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "support_tickets_state_idx" ON "support_tickets" USING btree ("state");--> statement-breakpoint
CREATE INDEX "support_tickets_queue_idx" ON "support_tickets" USING btree ("queue");--> statement-breakpoint
CREATE UNIQUE INDEX "webhook_events_provider_event_id_idx" ON "webhook_events" USING btree ("provider","event_id");--> statement-breakpoint
CREATE INDEX "webhook_events_state_idx" ON "webhook_events" USING btree ("state");--> statement-breakpoint
CREATE INDEX "webhook_events_type_idx" ON "webhook_events" USING btree ("type");