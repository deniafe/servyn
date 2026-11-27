import { NextResponse } from "next/server";
import { z } from "zod";
import { eq, getDb, inArray, liveConversations, liveInvoices, liveMessages } from "@servyn/db";
import { getCurrentIdentity } from "@/lib/auth";
import { normalizeSlotKey, validateServiceSlotNotice } from "@/lib/payout-rules";

const CreateInvoiceSchema = z.object({
  id: z.string().min(4).max(80).optional(),
  refId: z.string().min(4).max(32).optional(),
  conversationId: z.string().min(1),
  title: z.string().trim().min(1).max(160),
  subtotalMinor: z.number().int().min(100).max(10_000_000),
  agreedDate: z.string().trim().max(80).optional(),
  agreedLocation: z.string().trim().max(120).optional(),
  originalAmountMinor: z.number().int().min(100).optional(),
  discountNote: z.string().trim().max(160).optional(),
  messageText: z.string().trim().max(500).optional(),
});

export async function POST(request: Request): Promise<NextResponse> {
  const current = await getCurrentIdentity();
  if (!current) {
    return NextResponse.json(
      { ok: false, error: { code: "UNAUTHORIZED", message: "Sign in required" } },
      { status: 401 },
    );
  }

  const body: unknown = await request.json().catch(() => null);
  const parsed = CreateInvoiceSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: { code: "VALIDATION_ERROR", message: "Invalid invoice payload" } },
      { status: 400 },
    );
  }

  const v = parsed.data;
  const user = current.identity.user;

  try {
    const db = getDb();
    const [conv] = await db
      .select()
      .from(liveConversations)
      .where(eq(liveConversations.id, v.conversationId))
      .limit(1);

    if (!conv) {
      return NextResponse.json(
        { ok: false, error: { code: "NOT_FOUND", message: "Conversation not found" } },
        { status: 404 },
      );
    }

    if (conv.customerUserId !== user.id && conv.providerUserId !== user.id) {
      return NextResponse.json(
        { ok: false, error: { code: "FORBIDDEN", message: "Not part of this conversation" } },
        { status: 403 },
      );
    }

    if (conv.kind === "service" && v.agreedDate) {
      const slotCheck = validateServiceSlotNotice(v.agreedDate, new Date());
      if (!slotCheck.ok) {
        return NextResponse.json(
          { ok: false, error: { code: "SLOT_EXPIRED", message: slotCheck.message } },
          { status: 400 },
        );
      }
      const targetKey = normalizeSlotKey(v.agreedDate);
      const existingBookings = await db
        .select({
          agreedDate: liveInvoices.agreedDate,
          providerUserId: liveInvoices.providerUserId,
          providerName: liveInvoices.providerName,
        })
        .from(liveInvoices)
        .where(inArray(liveInvoices.status, ["paid_held", "delivered", "released"]));
      const conflict = existingBookings.some((other) => {
        if (!other.agreedDate) return false;
        const sameProvider = conv.providerUserId
          ? other.providerUserId === conv.providerUserId
          : other.providerName.trim().toLowerCase() === conv.providerName.trim().toLowerCase();
        return sameProvider && normalizeSlotKey(other.agreedDate) === targetKey;
      });
      if (conflict) {
        return NextResponse.json(
          {
            ok: false,
            error: {
              code: "SLOT_ALREADY_BOOKED",
              message: "That date and time slot has already been booked. Please choose another slot.",
            },
          },
          { status: 409 },
        );
      }
    }

    const feeMinor = Math.round(v.subtotalMinor * 0.1);
    const totalMinor = v.subtotalMinor + feeMinor;
    const invId = v.id ?? `inv-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const refId = v.refId ?? `SRV-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    const now = new Date();

    const [inserted] = await db
      .insert(liveInvoices)
      .values({
        id: invId,
        refId,
        conversationId: conv.id,
        kind: conv.kind,
        customerUserId: conv.customerUserId,
        customerName: conv.customerName,
        providerUserId: conv.providerUserId,
        providerName: conv.providerName,
        title: v.title,
        agreedDate: v.agreedDate ?? null,
        agreedLocation: v.agreedLocation ?? null,
        originalAmountMinor: v.originalAmountMinor ?? null,
        discountNote: v.discountNote ?? null,
        subtotalMinor: v.subtotalMinor,
        feeMinor,
        totalMinor,
        status: "sent",
        createdAt: now,
      })
      .returning();

    const msgBody =
      v.messageText ||
      `Sent agreed invoice ${refId} for ${v.title} (£${(v.subtotalMinor / 100).toFixed(2)} + £${(feeMinor / 100).toFixed(2)} Servyn fee).`;

    await db.insert(liveMessages).values({
      id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      conversationId: conv.id,
      senderUserId: user.id,
      senderRole: "provider",
      senderName: conv.providerName,
      body: msgBody,
      invoiceId: invId,
      createdAt: now,
    });

    await db
      .update(liveConversations)
      .set({ updatedAt: now })
      .where(eq(liveConversations.id, conv.id));

    return NextResponse.json(
      {
        ok: true,
        invoice: {
          ...inserted,
          agreedDate: inserted?.agreedDate ?? undefined,
          agreedLocation: inserted?.agreedLocation ?? undefined,
          originalAmountMinor: inserted?.originalAmountMinor ?? undefined,
          discountNote: inserted?.discountNote ?? undefined,
          createdAt: now.toISOString(),
        },
      },
      { status: 201 },
    );
  } catch {
    return NextResponse.json(
      { ok: false, error: { code: "DB_ERROR", message: "Could not create invoice" } },
      { status: 500 },
    );
  }
}
