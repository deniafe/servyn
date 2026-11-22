import "server-only";
import { eq } from "drizzle-orm";
import type { DbExecutor } from "@servyn/db";
import {
  orders,
  orderItems,
  bulkEnquiries,
  type OrderRow,
  type NewOrderRow,
  type OrderItemRow,
  type NewOrderItemRow,
  type BulkEnquiryRow,
  type NewBulkEnquiryRow,
} from "@servyn/db";
import {
  asOrderId,
  asOrderItemId,
  asBulkEnquiryId,
  asPaymentId,
  asProductId,
  asUserId,
  newUlid,
  money,
  type OrderId,
  type OrderItemId,
  type BulkEnquiryId,
  type PaymentId,
  type ProductId,
  type UserId,
  type Money,
} from "@servyn/core";
import {
  OrderStatusSchema,
  DeliveryDetailsSchema,
  BulkEnquiryRequestSchema,
  BulkQuoteLinesSchema,
  type OrderStatus,
  type DeliveryDetails,
  type BulkEnquiryRequest,
  type BulkQuoteLines,
} from "./schema.js";

export interface Order {
  id: OrderId;
  customerId: UserId;
  sellerId: UserId;
  status: OrderStatus;
  total: Money;
  delivery: DeliveryDetails;
  paymentId: PaymentId | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderItem {
  id: OrderItemId;
  orderId: OrderId;
  productId: ProductId;
  qty: number;
  unitPrice: Money;
  isBulk: boolean;
  createdAt: Date;
}

export interface BulkEnquiry {
  id: BulkEnquiryId;
  customerId: UserId;
  sellerId: UserId;
  productId: ProductId;
  state: "enquired" | "quoted" | "converted" | "declined";
  request: BulkEnquiryRequest;
  quoteLines: BulkQuoteLines | null;
  createdAt: Date;
  updatedAt: Date;
}

export function mapOrder(row: OrderRow): Order {
  return {
    id: asOrderId(row.id),
    customerId: asUserId(row.customerId),
    sellerId: asUserId(row.sellerId),
    status: OrderStatusSchema.parse(row.status),
    total: money(row.totalMinor),
    delivery: DeliveryDetailsSchema.parse(row.delivery),
    paymentId:
      row.paymentId !== null && row.paymentId !== undefined ? asPaymentId(row.paymentId) : null,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function mapOrderItem(row: OrderItemRow): OrderItem {
  return {
    id: asOrderItemId(row.id),
    orderId: asOrderId(row.orderId),
    productId: asProductId(row.productId),
    qty: row.qty,
    unitPrice: money(row.unitPriceMinor),
    isBulk: row.isBulk,
    createdAt: row.createdAt,
  };
}

export function mapBulkEnquiry(row: BulkEnquiryRow): BulkEnquiry {
  return {
    id: asBulkEnquiryId(row.id),
    customerId: asUserId(row.customerId),
    sellerId: asUserId(row.sellerId),
    productId: asProductId(row.productId),
    state: row.state,
    request: BulkEnquiryRequestSchema.parse(row.request),
    quoteLines:
      row.quoteLines !== null && row.quoteLines !== undefined
        ? BulkQuoteLinesSchema.parse(row.quoteLines)
        : null,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function createCommerceRepository(executor: DbExecutor) {
  return {
    async insertOrder(
      data: Omit<NewOrderRow, "id" | "totalMinor" | "delivery"> & {
        total: Money;
        delivery: DeliveryDetails;
      },
    ): Promise<Order> {
      const id = newUlid();
      const [row] = await executor
        .insert(orders)
        .values({ ...data, id, totalMinor: data.total.amountMinor, delivery: data.delivery })
        .returning();
      if (!row) throw new Error("Insert order returned no row");
      return mapOrder(row);
    },

    async findOrderById(id: OrderId): Promise<Order | null> {
      const [row] = await executor.select().from(orders).where(eq(orders.id, id)).limit(1);
      return row ? mapOrder(row) : null;
    },

    async findOrdersByCustomerId(customerId: UserId): Promise<Order[]> {
      const rows = await executor.select().from(orders).where(eq(orders.customerId, customerId));
      return rows.map(mapOrder);
    },

    async insertOrderItem(
      data: Omit<NewOrderItemRow, "id" | "unitPriceMinor"> & { unitPrice: Money },
    ): Promise<OrderItem> {
      const id = newUlid();
      const [row] = await executor
        .insert(orderItems)
        .values({ ...data, id, unitPriceMinor: data.unitPrice.amountMinor })
        .returning();
      if (!row) throw new Error("Insert order item returned no row");
      return mapOrderItem(row);
    },

    async findOrderItemsByOrderId(orderId: OrderId): Promise<OrderItem[]> {
      const rows = await executor.select().from(orderItems).where(eq(orderItems.orderId, orderId));
      return rows.map(mapOrderItem);
    },

    async insertBulkEnquiry(
      data: Omit<NewBulkEnquiryRow, "id" | "request" | "quoteLines"> & {
        request: BulkEnquiryRequest;
        quoteLines?: BulkQuoteLines;
      },
    ): Promise<BulkEnquiry> {
      const id = newUlid();
      const [row] = await executor
        .insert(bulkEnquiries)
        .values({
          ...data,
          id,
          request: data.request,
          quoteLines: data.quoteLines ?? null,
        })
        .returning();
      if (!row) throw new Error("Insert bulk enquiry returned no row");
      return mapBulkEnquiry(row);
    },

    async findBulkEnquiriesBySellerId(sellerId: UserId): Promise<BulkEnquiry[]> {
      const rows = await executor
        .select()
        .from(bulkEnquiries)
        .where(eq(bulkEnquiries.sellerId, sellerId));
      return rows.map(mapBulkEnquiry);
    },
  };
}

export type CommerceRepository = ReturnType<typeof createCommerceRepository>;
