import { z } from "zod/v4";

export const EventDetailsSchema = z.object({
  guestCount: z.number().int().optional(),
  venue: z.string().optional(),
  notes: z.string().optional(),
  addOns: z.array(z.string()).optional(),
});
export type EventDetails = z.infer<typeof EventDetailsSchema>;

export const QuoteRequestSchema = z.object({
  description: z.string(),
  preferredDates: z.array(z.string()).optional(),
  guestCount: z.number().int().optional(),
  budget: z.number().int().optional(), // pence
});
export type QuoteRequest = z.infer<typeof QuoteRequestSchema>;

export const QuoteLineSchema = z.object({
  description: z.string(),
  amountMinor: z.number().int().nonnegative(),
});
export const QuoteLinesSchema = z.array(QuoteLineSchema);
export type QuoteLines = z.infer<typeof QuoteLinesSchema>;

export const CancellationRuleSchema = z.object({
  vendorCancelPct: z.number().int().min(0).max(100),
  customerMoreThan48hPct: z.number().int().min(0).max(100),
  customer24to48hPct: z.number().int().min(0).max(100),
  customerLess24hPct: z.number().int().min(0).max(100),
});
export type CancellationRule = z.infer<typeof CancellationRuleSchema>;

export const RefundRuleSchema = z.object({
  noShowRefundPct: z.number().int().min(0).max(100),
});
export type RefundRule = z.infer<typeof RefundRuleSchema>;

export const BookingStatusSchema = z.enum([
  "requested",
  "accepted",
  "declined",
  "confirmed",
  "in_progress",
  "vendor_complete",
  "completed",
  "cancelled",
  "disputed",
  "under_review",
  "refunded",
]);
export type BookingStatus = z.infer<typeof BookingStatusSchema>;

export const BookingEventMetadataSchema = z.object({
  reason: z.string().optional(),
  actorNote: z.string().optional(),
});
export type BookingEventMetadata = z.infer<typeof BookingEventMetadataSchema>;
