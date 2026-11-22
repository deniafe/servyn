import { z } from "zod/v4";

export const ReviewModerationStateSchema = z.enum(["pending", "published", "hidden"]);
export type ReviewModerationState = z.infer<typeof ReviewModerationStateSchema>;

export const RatingSchema = z.number().int().min(1).max(5);
export type Rating = z.infer<typeof RatingSchema>;
