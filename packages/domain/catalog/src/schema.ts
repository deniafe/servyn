import { z } from "zod/v4";

export const ServiceImageSchema = z.object({
  key: z.string(), // R2 public bucket key
  alt: z.string().optional(),
  order: z.number().int().optional(),
});

export const ServiceImagesSchema = z.array(ServiceImageSchema);
export type ServiceImages = z.infer<typeof ServiceImagesSchema>;

export const ProductBulkOptionSchema = z.object({
  minQty: z.number().int().positive(),
  priceMinor: z.number().int().nonnegative(), // pence
  label: z.string().optional(),
});

export const ProductBulkOptionsSchema = z.array(ProductBulkOptionSchema);
export type ProductBulkOptions = z.infer<typeof ProductBulkOptionsSchema>;

export const ProductImagesSchema = z.array(ServiceImageSchema);
export type ProductImages = z.infer<typeof ProductImagesSchema>;

export const CategoryKindSchema = z.enum(["service", "product"]);
export type CategoryKind = z.infer<typeof CategoryKindSchema>;

export const TrustTierSchema = z.enum(["standard", "enhanced"]);
export type TrustTier = z.infer<typeof TrustTierSchema>;

export const ListingStatusSchema = z.enum(["draft", "active", "paused", "deleted"]);
export type ListingStatus = z.infer<typeof ListingStatusSchema>;

export const BookingModelSchema = z.enum(["request", "instant", "quote"]);
export type BookingModel = z.infer<typeof BookingModelSchema>;
