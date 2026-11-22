import "server-only";
import { eq } from "drizzle-orm";
import type { DbExecutor } from "@servyn/db";
import {
  categories,
  services,
  products,
  type CategoryRow,
  type NewCategoryRow,
  type ServiceRow,
  type NewServiceRow,
  type ProductRow,
  type NewProductRow,
} from "@servyn/db";
import {
  asCategoryId,
  asServiceId,
  asProductId,
  asVendorId,
  asUserId,
  newUlid,
  type CategoryId,
  type ServiceId,
  type ProductId,
  type VendorId,
  type UserId,
  money,
  type Money,
} from "@servyn/core";
import {
  ServiceImagesSchema,
  ProductBulkOptionsSchema,
  ProductImagesSchema,
  type ServiceImages,
  type ProductBulkOptions,
  type ProductImages,
} from "./schema.js";

// ── Domain types ──────────────────────────────────────────────────────────────

export interface Category {
  id: CategoryId;
  parentId: CategoryId | null;
  slug: string;
  name: string;
  kind: "service" | "product";
  trustTier: "standard" | "enhanced";
  createdAt: Date;
}

export interface Service {
  id: ServiceId;
  vendorId: VendorId;
  categoryId: CategoryId;
  slug: string;
  title: string;
  description: string | null;
  durationMinutes: number;
  price: Money;
  images: ServiceImages;
  serviceArea: string | null;
  bookingModel: "request" | "instant" | "quote";
  listingStatus: "draft" | "active" | "paused" | "deleted";
  createdAt: Date;
  updatedAt: Date;
}

export interface Product {
  id: ProductId;
  sellerId: UserId;
  categoryId: CategoryId;
  slug: string;
  title: string;
  description: string | null;
  price: Money;
  stock: number;
  bulkOptions: ProductBulkOptions;
  images: ProductImages;
  listingStatus: "draft" | "active" | "paused" | "deleted";
  createdAt: Date;
  updatedAt: Date;
}

// ── Mappers ───────────────────────────────────────────────────────────────────

export function mapCategory(row: CategoryRow): Category {
  return {
    id: asCategoryId(row.id),
    parentId:
      row.parentId !== null && row.parentId !== undefined ? asCategoryId(row.parentId) : null,
    slug: row.slug,
    name: row.name,
    kind: row.kind,
    trustTier: row.trustTier,
    createdAt: row.createdAt,
  };
}

export function mapService(row: ServiceRow): Service {
  const images =
    row.images !== null && row.images !== undefined ? ServiceImagesSchema.parse(row.images) : [];
  return {
    id: asServiceId(row.id),
    vendorId: asVendorId(row.vendorId),
    categoryId: asCategoryId(row.categoryId),
    slug: row.slug,
    title: row.title,
    description: row.description ?? null,
    durationMinutes: row.durationMinutes,
    price: money(row.priceMinor),
    images,
    serviceArea: row.serviceArea ?? null,
    bookingModel: row.bookingModel,
    listingStatus: row.listingStatus,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function mapProduct(row: ProductRow): Product {
  const bulkOptions =
    row.bulkOptions !== null && row.bulkOptions !== undefined
      ? ProductBulkOptionsSchema.parse(row.bulkOptions)
      : [];
  const images =
    row.images !== null && row.images !== undefined ? ProductImagesSchema.parse(row.images) : [];
  return {
    id: asProductId(row.id),
    sellerId: asUserId(row.sellerId),
    categoryId: asCategoryId(row.categoryId),
    slug: row.slug,
    title: row.title,
    description: row.description ?? null,
    price: money(row.priceMinor),
    stock: row.stock,
    bulkOptions,
    images,
    listingStatus: row.listingStatus,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

// ── Repository factory ────────────────────────────────────────────────────────

export function createCatalogRepository(executor: DbExecutor) {
  return {
    // ── Categories ──────────────────────────────────────────────────────────

    async insertCategory(data: Omit<NewCategoryRow, "id">): Promise<Category> {
      const id = newUlid();
      const [row] = await executor
        .insert(categories)
        .values({ ...data, id })
        .returning();
      if (!row) throw new Error("Insert category returned no row");
      return mapCategory(row);
    },

    async findCategoryBySlug(slug: string): Promise<Category | null> {
      const [row] = await executor
        .select()
        .from(categories)
        .where(eq(categories.slug, slug))
        .limit(1);
      return row ? mapCategory(row) : null;
    },

    async findCategoriesByKind(kind: "service" | "product"): Promise<Category[]> {
      const rows = await executor.select().from(categories).where(eq(categories.kind, kind));
      return rows.map(mapCategory);
    },

    // ── Services ────────────────────────────────────────────────────────────

    async insertService(
      data: Omit<NewServiceRow, "id" | "priceMinor" | "images"> & {
        price: Money;
        images?: ServiceImages;
      },
    ): Promise<Service> {
      const id = newUlid();
      const [row] = await executor
        .insert(services)
        .values({
          ...data,
          id,
          priceMinor: data.price.amountMinor,
          images: data.images ?? null,
        })
        .returning();
      if (!row) throw new Error("Insert service returned no row");
      return mapService(row);
    },

    async findServiceBySlug(slug: string): Promise<Service | null> {
      const [row] = await executor.select().from(services).where(eq(services.slug, slug)).limit(1);
      return row ? mapService(row) : null;
    },

    async findServicesByVendorId(vendorId: VendorId): Promise<Service[]> {
      const rows = await executor.select().from(services).where(eq(services.vendorId, vendorId));
      return rows.map(mapService);
    },

    // ── Products ────────────────────────────────────────────────────────────

    async insertProduct(
      data: Omit<NewProductRow, "id" | "priceMinor" | "bulkOptions" | "images"> & {
        price: Money;
        bulkOptions?: ProductBulkOptions;
        images?: ProductImages;
      },
    ): Promise<Product> {
      const id = newUlid();
      const [row] = await executor
        .insert(products)
        .values({
          ...data,
          id,
          priceMinor: data.price.amountMinor,
          bulkOptions: data.bulkOptions ?? null,
          images: data.images ?? null,
        })
        .returning();
      if (!row) throw new Error("Insert product returned no row");
      return mapProduct(row);
    },

    async findProductBySlug(slug: string): Promise<Product | null> {
      const [row] = await executor.select().from(products).where(eq(products.slug, slug)).limit(1);
      return row ? mapProduct(row) : null;
    },

    async findProductsBySellerId(sellerId: UserId): Promise<Product[]> {
      const rows = await executor.select().from(products).where(eq(products.sellerId, sellerId));
      return rows.map(mapProduct);
    },
  };
}

export type CatalogRepository = ReturnType<typeof createCatalogRepository>;
