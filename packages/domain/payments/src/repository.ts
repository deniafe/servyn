import "server-only";
import { eq } from "drizzle-orm";
import type { DbExecutor } from "@servyn/db";
import {
  payments,
  transfers,
  refunds,
  feeWaivers,
  type PaymentRow,
  type NewPaymentRow,
  type TransferRow,
  type NewTransferRow,
  type RefundRow,
  type NewRefundRow,
  type FeeWaiverRow,
  type NewFeeWaiverRow,
} from "@servyn/db";
import {
  asPaymentId,
  asTransferId,
  asRefundId,
  asFeeWaiverId,
  asBookingId,
  asOrderId,
  asVendorId,
  newUlid,
  money,
  type PaymentId,
  type TransferId,
  type RefundId,
  type FeeWaiverId,
  type BookingId,
  type OrderId,
  type VendorId,
  type Money,
} from "@servyn/core";
import {
  PaymentStateSchema,
  type PaymentState,
  type ReleaseBasis,
  type RefundReason,
  type FeeWaiverKind,
} from "./schema.js";

// ── Domain types ──────────────────────────────────────────────────────────────

export interface Payment {
  id: PaymentId;
  bookingId: BookingId | null;
  orderId: OrderId | null;
  stripePaymentIntentId: string | null;
  amount: Money;
  vendorShare: Money;
  platformFee: Money;
  state: PaymentState;
  heldAt: Date | null;
  releasableAt: Date | null;
  releasedAt: Date | null;
  releaseBasis: ReleaseBasis | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Transfer {
  id: TransferId;
  paymentId: PaymentId;
  stripeTransferId: string;
  amount: Money;
  createdAt: Date;
}

export interface Refund {
  id: RefundId;
  paymentId: PaymentId;
  stripeRefundId: string;
  amount: Money;
  vendorShareReturned: Money;
  reason: RefundReason;
  createdAt: Date;
}

export interface FeeWaiver {
  id: FeeWaiverId;
  vendorId: VendorId;
  kind: FeeWaiverKind;
  startsOn: Date;
  endsOn: Date;
  feeOverrideBps: number;
  promoCode: string | null;
  createdAt: Date;
}

// ── Mappers ───────────────────────────────────────────────────────────────────

export function mapPayment(row: PaymentRow): Payment {
  return {
    id: asPaymentId(row.id),
    bookingId:
      row.bookingId !== null && row.bookingId !== undefined ? asBookingId(row.bookingId) : null,
    orderId: row.orderId !== null && row.orderId !== undefined ? asOrderId(row.orderId) : null,
    stripePaymentIntentId: row.stripePaymentIntentId ?? null,
    amount: money(row.amountMinor),
    vendorShare: money(row.vendorShareMinor),
    platformFee: money(row.platformFeeMinor),
    state: PaymentStateSchema.parse(row.state),
    heldAt: row.heldAt ?? null,
    releasableAt: row.releasableAt ?? null,
    releasedAt: row.releasedAt ?? null,
    releaseBasis: row.releaseBasis ?? null,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function mapTransfer(row: TransferRow): Transfer {
  return {
    id: asTransferId(row.id),
    paymentId: asPaymentId(row.paymentId),
    stripeTransferId: row.stripeTransferId,
    amount: money(row.amountMinor),
    createdAt: row.createdAt,
  };
}

export function mapRefund(row: RefundRow): Refund {
  return {
    id: asRefundId(row.id),
    paymentId: asPaymentId(row.paymentId),
    stripeRefundId: row.stripeRefundId,
    amount: money(row.amountMinor),
    vendorShareReturned: money(row.vendorShareReturnedMinor),
    reason: row.reason,
    createdAt: row.createdAt,
  };
}

export function mapFeeWaiver(row: FeeWaiverRow): FeeWaiver {
  return {
    id: asFeeWaiverId(row.id),
    vendorId: asVendorId(row.vendorId),
    kind: row.kind,
    startsOn: row.startsOn,
    endsOn: row.endsOn,
    feeOverrideBps: row.feeOverrideBps,
    promoCode: row.promoCode ?? null,
    createdAt: row.createdAt,
  };
}

// ── Repository factory ────────────────────────────────────────────────────────

export function createPaymentsRepository(executor: DbExecutor) {
  return {
    // ── Payments ────────────────────────────────────────────────────────────

    async insertPayment(
      data: Omit<NewPaymentRow, "id" | "amountMinor" | "vendorShareMinor" | "platformFeeMinor"> & {
        amount: Money;
        vendorShare: Money;
        platformFee: Money;
      },
    ): Promise<Payment> {
      const id = newUlid();
      const [row] = await executor
        .insert(payments)
        .values({
          ...data,
          id,
          amountMinor: data.amount.amountMinor,
          vendorShareMinor: data.vendorShare.amountMinor,
          platformFeeMinor: data.platformFee.amountMinor,
        })
        .returning();
      if (!row) throw new Error("Insert payment returned no row");
      return mapPayment(row);
    },

    async findPaymentById(id: PaymentId): Promise<Payment | null> {
      const [row] = await executor.select().from(payments).where(eq(payments.id, id)).limit(1);
      return row ? mapPayment(row) : null;
    },

    async findPaymentByBookingId(bookingId: BookingId): Promise<Payment | null> {
      const [row] = await executor
        .select()
        .from(payments)
        .where(eq(payments.bookingId, bookingId))
        .limit(1);
      return row ? mapPayment(row) : null;
    },

    async findPaymentByOrderId(orderId: OrderId): Promise<Payment | null> {
      const [row] = await executor
        .select()
        .from(payments)
        .where(eq(payments.orderId, orderId))
        .limit(1);
      return row ? mapPayment(row) : null;
    },

    async updatePaymentState(
      id: PaymentId,
      state: PaymentState,
      extra?: Partial<
        Pick<NewPaymentRow, "heldAt" | "releasableAt" | "releasedAt" | "releaseBasis">
      >,
    ): Promise<Payment> {
      const [row] = await executor
        .update(payments)
        .set({ state, updatedAt: new Date(), ...extra })
        .where(eq(payments.id, id))
        .returning();
      if (!row) throw new Error("Payment state update returned no row");
      return mapPayment(row);
    },

    // ── Transfers ───────────────────────────────────────────────────────────

    async insertTransfer(
      data: Omit<NewTransferRow, "id" | "amountMinor"> & { amount: Money },
    ): Promise<Transfer> {
      const id = newUlid();
      const [row] = await executor
        .insert(transfers)
        .values({ ...data, id, amountMinor: data.amount.amountMinor })
        .returning();
      if (!row) throw new Error("Insert transfer returned no row");
      return mapTransfer(row);
    },

    async findTransfersByPaymentId(paymentId: PaymentId): Promise<Transfer[]> {
      const rows = await executor
        .select()
        .from(transfers)
        .where(eq(transfers.paymentId, paymentId));
      return rows.map(mapTransfer);
    },

    // ── Refunds ─────────────────────────────────────────────────────────────

    async insertRefund(
      data: Omit<NewRefundRow, "id" | "amountMinor" | "vendorShareReturnedMinor"> & {
        amount: Money;
        vendorShareReturned: Money;
      },
    ): Promise<Refund> {
      const id = newUlid();
      const [row] = await executor
        .insert(refunds)
        .values({
          ...data,
          id,
          amountMinor: data.amount.amountMinor,
          vendorShareReturnedMinor: data.vendorShareReturned.amountMinor,
        })
        .returning();
      if (!row) throw new Error("Insert refund returned no row");
      return mapRefund(row);
    },

    async findRefundsByPaymentId(paymentId: PaymentId): Promise<Refund[]> {
      const rows = await executor.select().from(refunds).where(eq(refunds.paymentId, paymentId));
      return rows.map(mapRefund);
    },

    // ── FeeWaivers ──────────────────────────────────────────────────────────

    async insertFeeWaiver(data: Omit<NewFeeWaiverRow, "id">): Promise<FeeWaiver> {
      const id = newUlid();
      const [row] = await executor
        .insert(feeWaivers)
        .values({ ...data, id })
        .returning();
      if (!row) throw new Error("Insert fee waiver returned no row");
      return mapFeeWaiver(row);
    },

    async findActiveFeeWaiverForVendor(vendorId: VendorId, asOf: Date): Promise<FeeWaiver | null> {
      const rows = await executor
        .select()
        .from(feeWaivers)
        .where(eq(feeWaivers.vendorId, vendorId));

      const active = rows.map(mapFeeWaiver).find((fw) => fw.startsOn <= asOf && fw.endsOn >= asOf);

      return active ?? null;
    },
  };
}

export type PaymentsRepository = ReturnType<typeof createPaymentsRepository>;
