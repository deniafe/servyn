import { NextResponse } from "next/server";
import { z } from "zod";
import { eq, getDb, inArray, liveConversations, liveInvoices, liveMessages, users } from "@servyn/db";
import { getCurrentIdentity } from "@/lib/auth";
import { inngest } from "@/inngest/client";
import { evaluateConfirmation, normalizeSlotKey, validateServiceSlotNotice } from "@/lib/payout-rules";
import { buildFirstConfirmationEmail, sendPayoutNotificationEmail } from "@/lib/payout-emails";

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

async function safeEmitInngest(name: string, data: Record<string, unknown>): Promise<void> {
  try {
    await inngest.send({ name, data });
  } catch {
    // Ignore when INNGEST_EVENT_KEY is not configured in local dev.
  }
}

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
      if (inv.kind === "service" && inv.agreedDate) {
        const targetKey = normalizeSlotKey(inv.agreedDate);
        const existingBookings = await db
          .select({
            id: liveInvoices.id,
            agreedDate: liveInvoices.agreedDate,
            providerUserId: liveInvoices.providerUserId,
            providerName: liveInvoices.providerName,
          })
          .from(liveInvoices)
          .where(inArray(liveInvoices.status, ["paid_held", "delivered", "released"]));
        const conflict = existingBookings.some((other) => {
          if (other.id === inv.id || !other.agreedDate) return false;
          const sameProvider = inv.providerUserId
            ? other.providerUserId === inv.providerUserId
            : other.providerName.trim().toLowerCase() === inv.providerName.trim().toLowerCase();
          return sameProvider && normalizeSlotKey(other.agreedDate) === targetKey;
        });
        if (conflict) {
          return NextResponse.json(
            {
              ok: false,
              error: {
                code: "SLOT_ALREADY_BOOKED",
                message:
                  "That date and time slot has already been booked by another customer. Please pick a different slot.",
              },
            },
            { status: 409 },
          );
        }
      }
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
      messageBody = `Purchase successful (${inv.refId}) — £${((inv.subtotalMinor + feeMinor) / 100).toFixed(2)} held in Stripe.`;
    } else if (v.action === "mark_delivered" || v.action === "confirm_release") {
      const actor: "customer" | "provider" =
        v.action === "mark_delivered" ? "provider" : "customer";
      const decision = evaluateConfirmation(
        {
          status: inv.status,
          disputed: inv.disputed,
          customerConfirmedAt: inv.customerConfirmedAt,
          providerConfirmedAt: inv.providerConfirmedAt,
          autoReleaseAt: inv.autoReleaseAt,
        },
        actor,
        now,
      );

      if (decision.action === "blocked_disputed") {
        return NextResponse.json(
          {
            ok: false,
            error: {
              code: "DISPUTED",
              message: "This booking is disputed — nothing can be paid out until it is cleared.",
            },
          },
          { status: 409 },
        );
      }

      if (decision.action === "release_now") {
        await db
          .update(liveInvoices)
          .set({
            status: "released",
            deliveredAt: inv.deliveredAt ?? now,
            customerConfirmedAt: decision.customerConfirmedAt,
            providerConfirmedAt: decision.providerConfirmedAt,
            autoReleaseAt: null,
            releasedAt: decision.releasedAt,
          })
          .where(eq(liveInvoices.id, inv.id));
        senderRole = actor;
        messageBody = `Both parties confirmed (${inv.refId}) — £${(inv.subtotalMinor / 100).toFixed(2)} released to ${inv.providerName} straight away.`;
        await safeEmitInngest("invoice/released", { invoiceId: inv.id });
      } else if (decision.action === "await_second_or_48h") {
        await db
          .update(liveInvoices)
          .set({
            status: "delivered",
            deliveredAt: inv.deliveredAt ?? now,
            customerConfirmedAt: decision.customerConfirmedAt,
            providerConfirmedAt: decision.providerConfirmedAt,
            autoReleaseAt: decision.autoReleaseAt,
          })
          .where(eq(liveInvoices.id, inv.id));
        senderRole = actor;
        messageBody =
          actor === "provider"
            ? `${inv.providerName} confirmed completion (${inv.refId}). Payout releases in 48 hours, or straight away once ${inv.customerName} confirms.`
            : `${inv.customerName} confirmed completion (${inv.refId}). Payout releases in 48 hours, or straight away once ${inv.providerName} confirms.`;

        const recipientUserId =
          decision.notifyParty === "provider" ? inv.providerUserId : inv.customerUserId;
        if (recipientUserId) {
          const [recipient] = await db
            .select({ email: users.email })
            .from(users)
            .where(eq(users.id, recipientUserId))
            .limit(1);
          if (recipient?.email) {
            const emailContent = buildFirstConfirmationEmail({
              recipientName:
                decision.notifyParty === "provider" ? inv.providerName : inv.customerName,
              confirmedByName: actor === "provider" ? inv.providerName : inv.customerName,
              title: inv.title,
              refId: inv.refId,
              amountLabel: `£${(inv.subtotalMinor / 100).toFixed(2)}`,
            });
            await sendPayoutNotificationEmail({
              to: recipient.email,
              ...emailContent,
            });
          }
        }

        await safeEmitInngest("invoice/first-confirmed", {
          invoiceId: inv.id,
          notifyParty: decision.notifyParty,
        });
      }
    } else if (
      v.action === "report_problem" &&
      (inv.status === "paid_held" || inv.status === "delivered")
    ) {
      const reason = v.reason?.trim() || "Customer reported an issue";
      await db
        .update(liveInvoices)
        .set({
          status: "disputed",
          disputed: true,
          autoReleaseAt: null,
          disputeReason: reason,
          disputedAt: now,
        })
        .where(eq(liveInvoices.id, inv.id));
      messageBody = `Issue reported (${inv.refId}): ${reason}. Payout paused until cleared.`;
      await safeEmitInngest("invoice/disputed", { invoiceId: inv.id });
    } else if (v.action === "resolve_dispute" && (inv.status === "disputed" || inv.disputed)) {
      const nextStatus = v.resolution === "refund" ? "refunded" : "released";
      await db
        .update(liveInvoices)
        .set({
          status: nextStatus,
          disputed: false,
          autoReleaseAt: null,
          releasedAt: nextStatus === "released" ? now : inv.releasedAt,
        })
        .where(eq(liveInvoices.id, inv.id));
      messageBody =
        nextStatus === "refunded"
          ? `Dispute cleared (${inv.refId}): refunded to customer.`
          : `Dispute cleared (${inv.refId}): payment released to ${inv.providerName}.`;
      if (nextStatus === "released") {
        await safeEmitInngest("invoice/released", { invoiceId: inv.id });
      }
    } else if (v.action === "update_booking_details" && inv.status === "sent") {
      if (inv.kind === "service" && v.agreedDate) {
        const slotCheck = validateServiceSlotNotice(v.agreedDate, now);
        if (!slotCheck.ok) {
          return NextResponse.json(
            { ok: false, error: { code: "SLOT_EXPIRED", message: slotCheck.message } },
            { status: 400 },
          );
        }
        const targetKey = normalizeSlotKey(v.agreedDate);
        const existingBookings = await db
          .select({
            id: liveInvoices.id,
            agreedDate: liveInvoices.agreedDate,
            providerUserId: liveInvoices.providerUserId,
            providerName: liveInvoices.providerName,
          })
          .from(liveInvoices)
          .where(inArray(liveInvoices.status, ["paid_held", "delivered", "released"]));
        const conflict = existingBookings.some((other) => {
          if (other.id === inv.id || !other.agreedDate) return false;
          const sameProvider = inv.providerUserId
            ? other.providerUserId === inv.providerUserId
            : other.providerName.trim().toLowerCase() === inv.providerName.trim().toLowerCase();
          return sameProvider && normalizeSlotKey(other.agreedDate) === targetKey;
        });
        if (conflict) {
          return NextResponse.json(
            {
              ok: false,
              error: {
                code: "SLOT_ALREADY_BOOKED",
                message:
                  "That date and time slot has already been booked. Please choose another slot.",
              },
            },
            { status: 409 },
          );
        }
      }
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
