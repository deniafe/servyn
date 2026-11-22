import { z } from "zod/v4";

export const EmbeddingEntityTypeSchema = z.enum(["service", "product", "vendor"]);
export type EmbeddingEntityType = z.infer<typeof EmbeddingEntityTypeSchema>;

export const EmbeddingVectorSchema = z.array(z.number()).min(1).max(4096);
export type EmbeddingVector = z.infer<typeof EmbeddingVectorSchema>;
