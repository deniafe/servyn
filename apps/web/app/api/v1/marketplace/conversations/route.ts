import { NextResponse } from "next/server";
import { z } from "zod";
import { and, eq, getDb, liveConversations, liveMessages } from "@servyn/db";
import { getCurrentIdentity } from "@/lib/auth";

const CreateConversationSchema = z.object({
  id: z.string().min(4).max(80).optional(),
  kind: z.enum(["service", "product"]),
  listingId: z.string().optional(),
  providerName: z.string().trim().min(1).max(120),
  providerSlug: z.string().trim().min(1).max(120),
  providerUserId: z.string().optional(),
  listingTitle: z.string().trim().min(1).max(160),
  area: z.string().trim().min(1).max(80),
  customerName: z.string().trim().min(1).max(120).optional(),
  initialMessage: z.string().trim().max(2000).optional(),
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
  const parsed = CreateConversationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: { code: "VALIDATION_ERROR", message: "Invalid conversation payload" } },
      { status: 400 },
    );
  }

  const v = parsed.data;
  const user = current.identity.user;

  if (v.providerUserId && v.providerUserId === user.id) {
    return NextResponse.json(
      { ok: false, error: { code: "SELF_MESSAGE_FORBIDDEN", message: "You cannot message your own listing." } },
      { status: 400 },
    );
  }
  const resolvedCustomerName =
    v.customerName ||
    current.identity.customerProfile?.displayName ||
    user.email.split("@")[0] ||
    "Customer";

  try {
    const db = getDb();
    const existingRows = await db
      .select()
      .from(liveConversations)
      .where(
        and(
          eq(liveConversations.customerUserId, user.id),
          eq(liveConversations.providerSlug, v.providerSlug),
          eq(liveConversations.listingTitle, v.listingTitle),
        ),
      )
      .limit(1);

    const now = new Date();
    let conv = existingRows[0];

    if (!conv) {
      const id = v.id ?? `conv-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const [inserted] = await db
        .insert(liveConversations)
        .values({
          id,
          kind: v.kind,
          listingId: v.listingId ?? null,
          listingTitle: v.listingTitle,
          area: v.area,
          customerUserId: user.id,
          customerName: resolvedCustomerName,
          providerUserId: v.providerUserId ?? null,
          providerName: v.providerName,
          providerSlug: v.providerSlug,
          updatedAt: now,
        })
        .returning();
      conv = inserted!;
    } else {
      await db
        .update(liveConversations)
        .set({ updatedAt: now, customerName: resolvedCustomerName })
        .where(eq(liveConversations.id, conv.id));
    }

    if (v.initialMessage) {
      await db.insert(liveMessages).values({
        id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        conversationId: conv.id,
        senderUserId: user.id,
        senderRole: "customer",
        senderName: resolvedCustomerName,
        body: v.initialMessage,
      });
    }

    return NextResponse.json({
      ok: true,
      conversation: {
        id: conv.id,
        kind: conv.kind,
        listingId: conv.listingId ?? undefined,
        providerName: conv.providerName,
        providerSlug: conv.providerSlug,
        providerUserId: conv.providerUserId ?? undefined,
        customerUserId: conv.customerUserId,
        listingTitle: conv.listingTitle,
        area: conv.area,
        customerName: resolvedCustomerName,
        updatedAt: now.toISOString(),
      },
    });
  } catch {
    return NextResponse.json(
      { ok: false, error: { code: "DB_ERROR", message: "Could not start conversation" } },
      { status: 500 },
    );
  }
}
