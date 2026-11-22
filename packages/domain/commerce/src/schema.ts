import { z } from "zod/v4";

export const OrderStatusSchema = z.enum([
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "completed",
  "cancelled",
  "refunded",
]);
export type OrderStatus = z.infer<typeof OrderStatusSchema>;

export const DeliveryDetailsSchema = z.object({
  fullName: z.string(),
  addressLine1: z.string(),
  addressLine2: z.string().optional(),
  city: z.string(),
  postcode: z.string(),
  country: z.string().default("GB"),
  phone: z.string().optional(),
  instructions: z.string().optional(),
});
export type DeliveryDetails = z.infer<typeof DeliveryDetailsSchema>;

export const BulkEnquiryRequestSchema = z.object({
  quantity: z.number().int().positive(),
  notes: z.string().optional(),
  preferredDeliveryDate: z.string().optional(),
});
export type BulkEnquiryRequest = z.infer<typeof BulkEnquiryRequestSchema>;

export const BulkQuoteLineSchema = z.object({
  description: z.string(),
  unitPriceMinor: z.number().int().nonnegative(),
  quantity: z.number().int().positive(),
});
export const BulkQuoteLinesSchema = z.array(BulkQuoteLineSchema);
export type BulkQuoteLines = z.infer<typeof BulkQuoteLinesSchema>;
