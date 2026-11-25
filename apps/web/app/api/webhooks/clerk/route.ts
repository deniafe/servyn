import { NextResponse } from "next/server";
import { Webhook } from "svix";
import { asWebhookEventId } from "@servyn/core";
import { getDb } from "@servyn/db";
import { createAdminRepository } from "@servyn/domain-admin";
import {
  ClerkWebhookEventSchema,
  createIdentityRepository,
  processClerkWebhookEvent,
} from "@servyn/domain-identity";

export async function POST(request: Request): Promise<NextResponse> {
  const svixId = request.headers.get("svix-id");
  const svixTimestamp = request.headers.get("svix-timestamp");
  const svixSignature = request.headers.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json(
      { ok: false, error: { code: "VALIDATION_ERROR", message: "Missing Svix headers" } },
      { status: 400 },
    );
  }

  const signingSecret = process.env["CLERK_WEBHOOK_SECRET"];
  if (!signingSecret) {
    return NextResponse.json(
      { ok: false, error: { code: "INTERNAL_ERROR", message: "Webhook secret not configured" } },
      { status: 500 },
    );
  }

  const rawBody = await request.text();

  let verifiedPayload: unknown;
  try {
    const wh = new Webhook(signingSecret);
    verifiedPayload = wh.verify(rawBody, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    });
  } catch {
    return NextResponse.json(
      { ok: false, error: { code: "UNAUTHORIZED", message: "Invalid webhook signature" } },
      { status: 400 },
    );
  }

  const parsed = ClerkWebhookEventSchema.safeParse(verifiedPayload);
  if (!parsed.success) {
    // Acknowledge unsupported Clerk event types cleanly after signature verification
    return NextResponse.json({ ok: true, ignored: true });
  }

  const db = getDb();
  const adminRepo = createAdminRepository(db);
  const identityRepo = createIdentityRepository(db);

  const result = await processClerkWebhookEvent(
    {
      identityRepo,
      upsertWebhookEvent: (input) => adminRepo.upsertWebhookEvent(input),
      updateWebhookEventState: async (id, state, processedAt) => {
        await adminRepo.updateWebhookEventState(asWebhookEventId(id), state, processedAt);
      },
    },
    parsed.data,
    svixId,
  );

  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: { code: "INTERNAL_ERROR", message: "Webhook processing failed" } },
      { status: 500 },
    );
  }

  return NextResponse.json(result);
}
