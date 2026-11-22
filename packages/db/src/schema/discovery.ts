import { sql } from "drizzle-orm";
import { check, customType, index, pgTable, text, timestamp } from "drizzle-orm/pg-core";

/**
 * pgvector `vector(1536)` column for AI Match embeddings.
 * Dimension 1536 matches OpenAI text-embedding-3-small / ada-002.
 * If the model changes, expand-then-contract the column dimension.
 */
const vector = customType<{ data: number[]; driverData: string }>({
  dataType() {
    return "vector(1536)";
  },
  toDriver(value: number[]): string {
    return `[${value.join(",")}]`;
  },
  fromDriver(value: string): number[] {
    return value.replace(/^\[/, "").replace(/\]$/, "").split(",").map(Number);
  },
});

// ── listing_embeddings ────────────────────────────────────────────────────────
// Separate table keeps regular SSR/SEO catalog reads fast and decouples
// embedding model dimensions from the core catalog schema.
export const listingEmbeddings = pgTable(
  "listing_embeddings",
  {
    id: text("id").primaryKey(), // ULID
    entityType: text("entity_type").notNull().$type<"service" | "product" | "vendor">(),
    entityId: text("entity_id").notNull(),
    model: text("model").notNull(), // e.g. "text-embedding-3-small"
    embedding: vector("embedding").notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("listing_embeddings_entity_idx").on(t.entityType, t.entityId),
    index("listing_embeddings_embedding_hnsw_idx").using(
      "hnsw",
      sql`${t.embedding} vector_cosine_ops`,
    ),
    check(
      "listing_embeddings_entity_type_check",
      sql`${t.entityType} IN ('service', 'product', 'vendor')`,
    ),
  ],
);

export type ListingEmbeddingRow = typeof listingEmbeddings.$inferSelect;
export type NewListingEmbeddingRow = typeof listingEmbeddings.$inferInsert;
