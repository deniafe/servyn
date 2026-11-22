import { ulid as generateUlid } from "ulid";
import { randomUUID } from "node:crypto";

export type Brand<T, B extends string> = T & { readonly __brand: B };

// ── User / Identity ──────────────────────────────────────────────────────────
export type UserId = Brand<string, "UserId">;
export type VendorMemberId = Brand<string, "VendorMemberId">;

// ── Customer / Vendor / Seller ───────────────────────────────────────────────
export type CustomerId = Brand<string, "CustomerId">;
export type VendorId = Brand<string, "VendorId">;
export type SellerId = Brand<string, "SellerId">;

// ── Verification / Safeguarding ──────────────────────────────────────────────
export type VerificationId = Brand<string, "VerificationId">;
export type SafeguardingReportId = Brand<string, "SafeguardingReportId">;

// ── Catalog ──────────────────────────────────────────────────────────────────
export type CategoryId = Brand<string, "CategoryId">;
export type ServiceId = Brand<string, "ServiceId">;
export type ProductId = Brand<string, "ProductId">;

// ── Discovery ────────────────────────────────────────────────────────────────
export type ListingEmbeddingId = Brand<string, "ListingEmbeddingId">;

// ── Booking ──────────────────────────────────────────────────────────────────
export type AvailabilityRuleId = Brand<string, "AvailabilityRuleId">;
export type AvailabilityExceptionId = Brand<string, "AvailabilityExceptionId">;
export type QuoteId = Brand<string, "QuoteId">;
export type BookingId = Brand<string, "BookingId">;
export type BookingEventId = Brand<string, "BookingEventId">;
export type PolicyVersionId = Brand<string, "PolicyVersionId">;
export type FavouriteId = Brand<string, "FavouriteId">;

// ── Payments ─────────────────────────────────────────────────────────────────
export type FeeWaiverId = Brand<string, "FeeWaiverId">;
export type PaymentId = Brand<string, "PaymentId">;
export type TransferId = Brand<string, "TransferId">;
export type RefundId = Brand<string, "RefundId">;

// ── Disputes ─────────────────────────────────────────────────────────────────
export type DisputeId = Brand<string, "DisputeId">;
export type EvidenceId = Brand<string, "EvidenceId">;

// ── Messaging ────────────────────────────────────────────────────────────────
export type ConversationId = Brand<string, "ConversationId">;
export type MessageId = Brand<string, "MessageId">;

// ── Reviews ──────────────────────────────────────────────────────────────────
export type ReviewId = Brand<string, "ReviewId">;

// ── Commerce ─────────────────────────────────────────────────────────────────
export type OrderId = Brand<string, "OrderId">;
export type OrderItemId = Brand<string, "OrderItemId">;
export type BulkEnquiryId = Brand<string, "BulkEnquiryId">;

// ── Notifications ────────────────────────────────────────────────────────────
export type NotificationId = Brand<string, "NotificationId">;

// ── Admin ────────────────────────────────────────────────────────────────────
export type SupportTicketId = Brand<string, "SupportTicketId">;
export type ExportJobId = Brand<string, "ExportJobId">;
export type AuditLogId = Brand<string, "AuditLogId">;

// ── Webhooks ─────────────────────────────────────────────────────────────────
export type WebhookEventId = Brand<string, "WebhookEventId">;

// ── Helpers ──────────────────────────────────────────────────────────────────

function brandId<B extends string>(value: string): Brand<string, B> {
  if (value.trim().length === 0) {
    throw new Error("ID must be a non-empty string");
  }
  return value as Brand<string, B>;
}

/** Generate a new ULID string (sortable, URL-safe). */
export function newUlid(): string {
  return generateUlid();
}

/** Generate a new UUIDv4 string (for internal/non-sortable references). */
export function newUuid(): string {
  return randomUUID();
}

// ── Casting helpers ───────────────────────────────────────────────────────────
export const asUserId = (id: string): UserId => brandId<"UserId">(id);
export const asVendorMemberId = (id: string): VendorMemberId => brandId<"VendorMemberId">(id);
export const asCustomerId = (id: string): CustomerId => brandId<"CustomerId">(id);
export const asVendorId = (id: string): VendorId => brandId<"VendorId">(id);
export const asSellerId = (id: string): SellerId => brandId<"SellerId">(id);
export const asVerificationId = (id: string): VerificationId => brandId<"VerificationId">(id);
export const asSafeguardingReportId = (id: string): SafeguardingReportId =>
  brandId<"SafeguardingReportId">(id);
export const asCategoryId = (id: string): CategoryId => brandId<"CategoryId">(id);
export const asServiceId = (id: string): ServiceId => brandId<"ServiceId">(id);
export const asProductId = (id: string): ProductId => brandId<"ProductId">(id);
export const asListingEmbeddingId = (id: string): ListingEmbeddingId =>
  brandId<"ListingEmbeddingId">(id);
export const asAvailabilityRuleId = (id: string): AvailabilityRuleId =>
  brandId<"AvailabilityRuleId">(id);
export const asAvailabilityExceptionId = (id: string): AvailabilityExceptionId =>
  brandId<"AvailabilityExceptionId">(id);
export const asQuoteId = (id: string): QuoteId => brandId<"QuoteId">(id);
export const asBookingId = (id: string): BookingId => brandId<"BookingId">(id);
export const asBookingEventId = (id: string): BookingEventId => brandId<"BookingEventId">(id);
export const asPolicyVersionId = (id: string): PolicyVersionId => brandId<"PolicyVersionId">(id);
export const asFavouriteId = (id: string): FavouriteId => brandId<"FavouriteId">(id);
export const asFeeWaiverId = (id: string): FeeWaiverId => brandId<"FeeWaiverId">(id);
export const asPaymentId = (id: string): PaymentId => brandId<"PaymentId">(id);
export const asTransferId = (id: string): TransferId => brandId<"TransferId">(id);
export const asRefundId = (id: string): RefundId => brandId<"RefundId">(id);
export const asDisputeId = (id: string): DisputeId => brandId<"DisputeId">(id);
export const asEvidenceId = (id: string): EvidenceId => brandId<"EvidenceId">(id);
export const asConversationId = (id: string): ConversationId => brandId<"ConversationId">(id);
export const asMessageId = (id: string): MessageId => brandId<"MessageId">(id);
export const asReviewId = (id: string): ReviewId => brandId<"ReviewId">(id);
export const asOrderId = (id: string): OrderId => brandId<"OrderId">(id);
export const asOrderItemId = (id: string): OrderItemId => brandId<"OrderItemId">(id);
export const asBulkEnquiryId = (id: string): BulkEnquiryId => brandId<"BulkEnquiryId">(id);
export const asNotificationId = (id: string): NotificationId => brandId<"NotificationId">(id);
export const asSupportTicketId = (id: string): SupportTicketId => brandId<"SupportTicketId">(id);
export const asExportJobId = (id: string): ExportJobId => brandId<"ExportJobId">(id);
export const asAuditLogId = (id: string): AuditLogId => brandId<"AuditLogId">(id);
export const asWebhookEventId = (id: string): WebhookEventId => brandId<"WebhookEventId">(id);
