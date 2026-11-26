import { NextResponse } from "next/server";
import {
  asc,
  desc,
  eq,
  getDb,
  inArray,
  liveConversations,
  liveInvoices,
  liveMessages,
  liveReviews,
  or,
} from "@servyn/db";
import { getCurrentIdentity } from "@/lib/auth";
import { canAutoReleaseAt48h } from "@/lib/payout-rules";

export async function GET(): Promise<NextResponse> {
  const current = await getCurrentIdentity();
  if (!current) {
    return NextResponse.json(
      { ok: false, error: { code: "UNAUTHORIZED", message: "Sign in required" } },
      { status: 401 },
    );
  }

  const userId = current.identity.user.id;

  try {
    const db = getDb();
    const convRows = await db
      .select()
      .from(liveConversations)
      .where(
        or(
          eq(liveConversations.customerUserId, userId),
          eq(liveConversations.providerUserId, userId),
        ),
      )
      .orderBy(desc(liveConversations.updatedAt));

    const convIds = convRows.map((c) => c.id);

    const msgRows =
      convIds.length > 0
        ? await db
            .select()
            .from(liveMessages)
            .where(inArray(liveMessages.conversationId, convIds))
            .orderBy(asc(liveMessages.createdAt))
        : [];

    const invRows =
      convIds.length > 0
        ? await db
            .select()
            .from(liveInvoices)
            .where(inArray(liveInvoices.conversationId, convIds))
            .orderBy(desc(liveInvoices.createdAt))
        : [];

    const invIds = invRows.map((i) => i.id);
    const revRows =
      invIds.length > 0
        ? await db
            .select()
            .from(liveReviews)
            .where(inArray(liveReviews.invoiceId, invIds))
            .orderBy(desc(liveReviews.createdAt))
        : [];

    const conversations = convRows.map((c) => ({
      id: c.id,
      kind: c.kind,
      listingId: c.listingId ?? undefined,
      providerName: c.providerName,
      providerSlug: c.providerSlug,
      providerUserId: c.providerUserId ?? undefined,
      customerUserId: c.customerUserId,
      listingTitle: c.listingTitle,
      area: c.area,
      customerName: c.customerName,
      updatedAt: c.updatedAt.toISOString(),
      messages: msgRows
        .filter((m) => m.conversationId === c.id)
        .map((m) => ({
          id: m.id,
          sender: m.senderRole,
          senderName: m.senderName,
          text: m.body,
          at: m.createdAt.toISOString(),
          invoiceId: m.invoiceId ?? undefined,
        })),
    }));

    const now = new Date();
    for (const inv of invRows) {
      if (
        canAutoReleaseAt48h(
          {
            status: inv.status,
            disputed: inv.disputed,
            customerConfirmedAt: inv.customerConfirmedAt,
            providerConfirmedAt: inv.providerConfirmedAt,
            autoReleaseAt: inv.autoReleaseAt,
          },
          now,
        )
      ) {
        await db
          .update(liveInvoices)
          .set({ status: "released", releasedAt: now, autoReleaseAt: null })
          .where(eq(liveInvoices.id, inv.id));
        inv.status = "released";
        inv.releasedAt = now;
        inv.autoReleaseAt = null;
      }
    }

    const invoices = invRows.map((i) => ({
      id: i.id,
      refId: i.refId,
      conversationId: i.conversationId,
      kind: i.kind,
      customerUserId: i.customerUserId,
      providerUserId: i.providerUserId ?? undefined,
      providerName: i.providerName,
      customerName: i.customerName,
      title: i.title,
      agreedDate: i.agreedDate ?? undefined,
      agreedLocation: i.agreedLocation ?? undefined,
      originalAmountMinor: i.originalAmountMinor ?? undefined,
      discountNote: i.discountNote ?? undefined,
      referralApplied: i.referralApplied,
      subtotalMinor: i.subtotalMinor,
      feeMinor: i.feeMinor,
      totalMinor: i.totalMinor,
      status: i.status,
      disputed: i.disputed,
      disputeReason: i.disputeReason ?? undefined,
      stripeSessionId: i.stripeSessionId ?? undefined,
      paidAt: i.paidAt?.toISOString(),
      deliveredAt: i.deliveredAt?.toISOString(),
      customerConfirmedAt: i.customerConfirmedAt?.toISOString(),
      providerConfirmedAt: i.providerConfirmedAt?.toISOString(),
      autoReleaseAt: i.autoReleaseAt?.toISOString(),
      disputedAt: i.disputedAt?.toISOString(),
      releasedAt: i.releasedAt?.toISOString(),
      createdAt: i.createdAt.toISOString(),
    }));

    const reviews = revRows.map((r) => ({
      id: r.id,
      invoiceId: r.invoiceId,
      providerName: r.providerName,
      title: r.title,
      rating: r.rating as 1 | 2 | 3 | 4 | 5,
      comment: r.comment,
      authorName: r.authorName,
      createdAt: r.createdAt.toISOString(),
    }));

    return NextResponse.json({
      ok: true,
      currentUserId: userId,
      conversations,
      invoices,
      reviews,
    });
  } catch {
    return NextResponse.json(
      { ok: false, error: { code: "DB_ERROR", message: "Could not load marketplace state" } },
      { status: 500 },
    );
  }
}
