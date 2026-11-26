import { NextResponse } from "next/server";
import { and, eq, getDb, liveConversations, liveMessages } from "@servyn/db";
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
    const [msg] = await db
      .select()
      .from(liveMessages)
      .where(eq(liveMessages.id, id))
      .limit(1);

    if (!msg) {
      return NextResponse.json(
        { ok: false, error: { code: "NOT_FOUND", message: "Message not found" } },
        { status: 404 },
      );
    }

    const [conv] = await db
      .select()
      .from(liveConversations)
      .where(eq(liveConversations.id, msg.conversationId))
      .limit(1);

    if (!conv || (conv.customerUserId !== user.id && conv.providerUserId !== user.id)) {
      return NextResponse.json(
        { ok: false, error: { code: "FORBIDDEN", message: "Not allowed to delete this message" } },
        { status: 403 },
      );
    }

    await db
      .delete(liveMessages)
      .where(and(eq(liveMessages.id, id), eq(liveMessages.conversationId, conv.id)));

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { ok: false, error: { code: "DB_ERROR", message: "Could not delete message" } },
      { status: 500 },
    );
  }
}
