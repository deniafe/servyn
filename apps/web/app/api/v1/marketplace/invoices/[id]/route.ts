import { NextResponse } from "next/server";
import { eq, getDb, liveInvoices, liveMessages } from "@servyn/db";
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

    if (inv.providerUserId !== user.id && !user.isAdmin) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: "FORBIDDEN",
            message: "Only the vendor or seller can retract this invoice",
          },
        },
        { status: 403 },
      );
    }

    if (inv.status !== "sent") {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: "INVOICE_ALREADY_PAID",
            message: "Only unpaid invoices can be retracted and deleted",
          },
        },
        { status: 409 },
      );
    }

    await db.delete(liveMessages).where(eq(liveMessages.invoiceId, id));
    await db.delete(liveInvoices).where(eq(liveInvoices.id, id));

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { ok: false, error: { code: "DB_ERROR", message: "Could not retract invoice" } },
      { status: 500 },
    );
  }
}
