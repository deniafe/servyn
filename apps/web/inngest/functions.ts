import "server-only";
import { eq, getDb, liveConversations, liveInvoices, liveMessages, users } from "@servyn/db";
import { canAutoReleaseAt48h } from "@/lib/payout-rules";
import { build24hReminderEmail, sendPayoutNotificationEmail } from "@/lib/payout-emails";
import { inngest } from "./client";

export const healthPing = inngest.createFunction(
  { id: "health.ping" },
  { event: "health/ping" },
  async ({ event }) => {
    return {
      ok: true,
      receivedAt: new Date().toISOString(),
      eventId: event.id ?? null,
    };
  },
);

export const invoiceAutoRelease = inngest.createFunction(
  {
    id: "invoice.auto-release-48h",
    cancelOn: [
      { event: "invoice/disputed", match: "data.invoiceId" },
      { event: "invoice/released", match: "data.invoiceId" },
    ],
  },
  { event: "invoice/first-confirmed" },
  async ({ event, step }) => {
    const data = event.data as {
      invoiceId?: string;
      notifyParty?: "customer" | "provider";
    };
    const invoiceId = data?.invoiceId;
    if (!invoiceId) return { skipped: true, reason: "missing_invoice_id" };

    await step.sleep("wait-24h-for-reminder", "24h");

    await step.run("send-24h-reminder", async () => {
      const db = getDb();
      const [inv] = await db
        .select()
        .from(liveInvoices)
        .where(eq(liveInvoices.id, invoiceId))
        .limit(1);

      if (!inv || inv.disputed || inv.status !== "delivered") {
        return { skipped: true };
      }

      const recipientUserId =
        data.notifyParty === "provider" ? inv.providerUserId : inv.customerUserId;
      if (!recipientUserId) return { skipped: true };

      const [recipient] = await db
        .select({ email: users.email })
        .from(users)
        .where(eq(users.id, recipientUserId))
        .limit(1);

      if (recipient?.email) {
        const emailContent = build24hReminderEmail({
          recipientName:
            data.notifyParty === "provider" ? inv.providerName : inv.customerName,
          title: inv.title,
          refId: inv.refId,
          amountLabel: `£${(inv.subtotalMinor / 100).toFixed(2)}`,
        });
        await sendPayoutNotificationEmail({
          to: recipient.email,
          ...emailContent,
        });
      }

      await db
        .update(liveInvoices)
        .set({ reminderSentAt: new Date() })
        .where(eq(liveInvoices.id, invoiceId));

      return { reminded: true };
    });

    await step.sleep("wait-remaining-24h-for-payout", "24h");

    return step.run("release-payout-at-48h", async () => {
      const db = getDb();
      const [inv] = await db
        .select()
        .from(liveInvoices)
        .where(eq(liveInvoices.id, invoiceId))
        .limit(1);

      if (!inv) return { released: false, reason: "not_found" };

      const now = new Date();
      if (
        !canAutoReleaseAt48h(
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
        return { released: false, reason: inv.disputed ? "disputed" : "not_eligible" };
      }

      await db
        .update(liveInvoices)
        .set({
          status: "released",
          releasedAt: now,
          autoReleaseAt: null,
        })
        .where(eq(liveInvoices.id, invoiceId));

      await db.insert(liveMessages).values({
        id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        conversationId: inv.conversationId,
        senderUserId: inv.customerUserId,
        senderRole: "customer",
        senderName: "Servyn",
        body: `48-hour confirmation window elapsed (${inv.refId}) — £${(inv.subtotalMinor / 100).toFixed(2)} released to ${inv.providerName}.`,
        createdAt: now,
      });

      await db
        .update(liveConversations)
        .set({ updatedAt: now })
        .where(eq(liveConversations.id, inv.conversationId));

      return { released: true, invoiceId };
    });
  },
);

export const inngestFunctions = [healthPing, invoiceAutoRelease];
