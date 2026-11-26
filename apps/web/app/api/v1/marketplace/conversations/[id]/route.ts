import { NextResponse } from "next/server";
import { and, eq, getDb, liveConversations, liveInvoices, liveMessages } from "@servyn/db";
import { getCurrentIdentity } from "@/lib/auth";

export async function DELETE(
  _request: Request,
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
  const user = current.identity.user;

  try {
    const db = getDb();
    const [conv] = await db
      .select()
      .from(liveConversations)
      .where(eq(liveConversations.id, id))
      .limit(1);

    if (!conv) {
      return NextResponse.json(
        { ok: false, error: { code: "NOT_FOUND", message: "Conversation not found" } },
        { status: 404 },
      );
    }

    if (conv.customerUserId !== user.id && conv.providerUserId !== user.id && !user.isAdmin) {
      return NextResponse.json(
        { ok: false, error: { code: "FORBIDDEN", message: "Not allowed to delete this chat" } },
        { status: 403 },
      );
    }

    const convInvoices = await db
      .select({ id: liveInvoices.id, status: liveInvoices.status })
      .from(liveInvoices)
      .where(eq(liveInvoices.conversationId, id));

    const hasActiveOrder = convInvoices.some(
      (inv) =>
        inv.status === "paid_held" ||
        inv.status === "delivered" ||
        inv.status === "disputed",
    );

    if (hasActiveOrder) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: "ACTIVE_ORDER",
            message: "Chats with an active paid order cannot be deleted",
          },
        },
        { status: 409 },
      );
    }

    await db.delete(liveMessages).where(eq(liveMessages.conversationId, id));
    await db
      .delete(liveInvoices)
      .where(and(eq(liveInvoices.conversationId, id), eq(liveInvoices.status, "sent")));
    await db.delete(liveConversations).where(eq(liveConversations.id, id));

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { ok: false, error: { code: "DB_ERROR", message: "Could not delete chat" } },
      { status: 500 },
    );
  }
}
