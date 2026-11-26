import { NextResponse } from "next/server";
import { z } from "zod";
import { eq, getDb, liveConversations, liveInvoices, liveMessages } from "@servyn/db";
import { getCurrentIdentity } from "@/lib/auth";

const InvoiceActionSchema = z.object({
  action: z.enum([
    "pay_held",
    "mark_delivered",
    "confirm_release",
    "report_problem",
    "resolve_dispute",
    "update_booking_details",
  ]),
  stripeSessionId: z.string().optional(),
  referralApplied: z.boolean().optional(),
  reason: z.string().trim().max(500).optional(),
  resolution: z.enum(["release", "refund"]).optional(),
  title: z.string().trim().min(1).max(160).optional(),
  agreedDate: z.string().trim().max(80).optional(),
  agreedLocation: z.string().trim().max(120).optional(),
  subtotalMinor: z.number().int().min(100).max(10_000_000).optional(),
});

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const current = await getCurrentIdentity();
  if (!current) {
    return NextResponse.json(
      { ok: false, error: { code: "UNAUTHORIZED", message: "Sign in required" } },
      { status: 401 },
    );
  }

  const { id } = await context.params;
  const body: unknown = await request.json().catch(() => null);
  const parsed = InvoiceActionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: { code: "VALIDATION_ERROR", message: "Invalid invoice action" } },
      { status: 400 },
    );
  }

  const user = current.identity.user;
  const v = parsed.data;

  try {
    const db = getDb();
    const [inv] = await db
      .select()
      .from(liveInvoices)
      .where(eq(liveInvoices.id, id))
      .limit(1);

    if (!inv) {
      return NextResponse.json(
        { ok: false, error: { code: "NOT_FOUND", message: "Invoice not found" } },
        { status: 404 },
      );
    }

    if (inv.customerUserId !== user.id && inv.providerUserId !== user.id && !user.isAdmin) {
      return NextResponse.json(
        { ok: false, error: { code: "FORBIDDEN", message: "Forbidden" } },
        { status: 403 },
      );
    }

    const now = new Date();
    let messageBody: string | null = null;
    let senderRole: "customer" | "provider" = "customer";

    if (v.action === "pay_held" && inv.status === "sent") {
      const referral = Boolean(v.referralApplied);
      const feeMinor = referral ? Math.round(inv.subtotalMinor * 0.05) : inv.feeMinor;
      await db
        .update(liveInvoices)
        .set({
          status: "paid_held",
          referralApplied: referral || inv.referralApplied,
          feeMinor,
          totalMinor: inv.subtotalMinor + feeMinor,
          stripeSessionId: v.stripeSessionId ?? inv.stripeSessionId ?? `cs_${Date.now()}`,
          paidAt: now,
        })
        .where(eq(liveInvoices.id, inv.id));
      messageBody = `Purchase successful (${inv.refId}) — £${((inv.subtotalMinor + feeMinor) / 100).toFixed(2)} protected via Stripe.`;
    } else if (v.action === "mark_delivered" && inv.status === "paid_held") {
      await db
        .update(liveInvoices)
        .set({ status: "delivered", deliveredAt: now })
        .where(eq(liveInvoices.id, inv.id));
      senderRole = "provider";
      messageBody =
        inv.kind === "service"
          ? `Service completed (${inv.refId}). Please confirm everything is OK to release payment.`
          : `Order shipped / delivered (${inv.refId}). Please confirm everything is OK to release payment.`;
    } else if (
      v.action === "confirm_release" &&
      (inv.status === "paid_held" || inv.status === "delivered")
    ) {
      await db
        .update(liveInvoices)
        .set({
          status: "released",
          deliveredAt: inv.deliveredAt ?? now,
          releasedAt: now,
        })
        .where(eq(liveInvoices.id, inv.id));
      messageBody = `Order accepted (${inv.refId}) — payment released to ${inv.providerName}.`;
    } else if (
      v.action === "report_problem" &&
      (inv.status === "paid_held" || inv.status === "delivered")
    ) {
      const reason = v.reason?.trim() || "Customer reported an issue";
      await db
        .update(liveInvoices)
        .set({
          status: "disputed",
          disputeReason: reason,
          disputedAt: now,
        })
        .where(eq(liveInvoices.id, inv.id));
      messageBody = `Issue reported (${inv.refId}): ${reason}. Payout paused for review.`;
    } else if (v.action === "resolve_dispute" && inv.status === "disputed") {
      const nextStatus = v.resolution === "refund" ? "refunded" : "released";
      await db
        .update(liveInvoices)
        .set({
          status: nextStatus,
          releasedAt: nextStatus === "released" ? now : inv.releasedAt,
        })
        .where(eq(liveInvoices.id, inv.id));
      messageBody =
        nextStatus === "refunded"
          ? `Dispute resolved (${inv.refId}): refunded to customer.`
          : `Dispute resolved (${inv.refId}): payment released to ${inv.providerName}.`;
    } else if (v.action === "update_booking_details" && inv.status === "sent") {
      const nextSubtotal = v.subtotalMinor ?? inv.subtotalMinor;
      const nextFee = Math.round(nextSubtotal * 0.1);
      const nextTotal = nextSubtotal + nextFee;
      await db
        .update(liveInvoices)
        .set({
          title: v.title ?? inv.title,
          agreedDate: v.agreedDate ?? inv.agreedDate,
          agreedLocation: v.agreedLocation ?? inv.agreedLocation,
          subtotalMinor: nextSubtotal,
          feeMinor: nextFee,
          totalMinor: nextTotal,
        })
        .where(eq(liveInvoices.id, inv.id));
    }

    if (messageBody) {
      await db.insert(liveMessages).values({
        id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        conversationId: inv.conversationId,
        senderUserId: user.id,
        senderRole,
        senderName: senderRole === "provider" ? inv.providerName : inv.customerName,
        body: messageBody,
        createdAt: now,
      });

      await db
        .update(liveConversations)
        .set({ updatedAt: now })
        .where(eq(liveConversations.id, inv.conversationId));
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { ok: false, error: { code: "DB_ERROR", message: "Could not update invoice" } },
      { status: 500 },
    );
  }
}
