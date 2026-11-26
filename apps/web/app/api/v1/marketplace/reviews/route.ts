import { NextResponse } from "next/server";
import { z } from "zod";
import { eq, getDb, liveInvoices, liveReviews } from "@servyn/db";
import { getCurrentIdentity } from "@/lib/auth";

const CreateReviewSchema = z.object({
  invoiceId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().min(2).max(1000),
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
  const parsed = CreateReviewSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: { code: "VALIDATION_ERROR", message: "Invalid review" } },
      { status: 400 },
    );
  }

  const user = current.identity.user;

  try {
    const db = getDb();
    const [inv] = await db
      .select()
      .from(liveInvoices)
      .where(eq(liveInvoices.id, parsed.data.invoiceId))
      .limit(1);

    if (!inv) {
      return NextResponse.json(
        { ok: false, error: { code: "NOT_FOUND", message: "Invoice not found" } },
        { status: 404 },
      );
    }

    if (inv.customerUserId !== user.id) {
      return NextResponse.json(
        { ok: false, error: { code: "FORBIDDEN", message: "Only the buyer can review" } },
        { status: 403 },
      );
    }

    const [existing] = await db
      .select()
      .from(liveReviews)
      .where(eq(liveReviews.invoiceId, inv.id))
      .limit(1);

    if (existing) {
      await db
        .update(liveReviews)
        .set({
          rating: parsed.data.rating,
          comment: parsed.data.comment,
        })
        .where(eq(liveReviews.id, existing.id));

      return NextResponse.json({ ok: true, reviewId: existing.id });
    }

    const revId = `rev-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    await db.insert(liveReviews).values({
      id: revId,
      invoiceId: inv.id,
      providerName: inv.providerName,
      providerUserId: inv.providerUserId,
      title: inv.title,
      rating: parsed.data.rating,
      comment: parsed.data.comment,
      authorUserId: user.id,
      authorName: inv.customerName,
    });

    return NextResponse.json({ ok: true, reviewId: revId }, { status: 201 });
  } catch {
    return NextResponse.json(
      { ok: false, error: { code: "DB_ERROR", message: "Could not save review" } },
      { status: 500 },
    );
  }
}
