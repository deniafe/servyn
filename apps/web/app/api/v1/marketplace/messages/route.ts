import { NextResponse } from "next/server";
import { z } from "zod";
import { eq, getDb, liveConversations, liveMessages } from "@servyn/db";
import { getCurrentIdentity } from "@/lib/auth";

const SendMessageSchema = z.object({
  conversationId: z.string().min(1),
  senderRole: z.enum(["customer", "provider"]).optional(),
  text: z.string().trim().min(1).max(2000),
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
  const parsed = SendMessageSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: { code: "VALIDATION_ERROR", message: "Invalid message" } },
      { status: 400 },
    );
  }

  const user = current.identity.user;

  try {
    const db = getDb();
    const [conv] = await db
      .select()
      .from(liveConversations)
      .where(eq(liveConversations.id, parsed.data.conversationId))
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

    const senderRole: "customer" | "provider" =
      conv.providerUserId && conv.providerUserId === user.id
        ? "provider"
        : (parsed.data.senderRole ?? "customer");

    const senderName =
      senderRole === "provider" ? conv.providerName : conv.customerName;

    const now = new Date();
    const msgId = `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

    await db.insert(liveMessages).values({
      id: msgId,
      conversationId: conv.id,
      senderUserId: user.id,
      senderRole,
      senderName,
      body: parsed.data.text,
    });

    await db
      .update(liveConversations)
      .set({ updatedAt: now })
      .where(eq(liveConversations.id, conv.id));

    return NextResponse.json({
      ok: true,
      message: {
        id: msgId,
        sender: senderRole,
        senderName,
        text: parsed.data.text,
        at: now.toISOString(),
      },
    });
  } catch {
    return NextResponse.json(
      { ok: false, error: { code: "DB_ERROR", message: "Could not send message" } },
      { status: 500 },
    );
  }
}
