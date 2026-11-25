import { NextResponse } from "next/server";
import { z } from "zod/v4";
import { createApiLogger } from "@/lib/api-guard";

const logger = createApiLogger("api.demo.stripe.checkout");

const CheckoutRequestSchema = z.object({
  invoiceId: z.string().min(1),
  title: z.string().min(1).max(160),
  subtotalMinor: z.number().int().positive(),
  feeMinor: z.number().int().nonnegative(),
  totalMinor: z.number().int().positive(),
  kind: z.enum(["service", "product"]),
  providerName: z.string().min(1).max(120),
});

export async function POST(request: Request): Promise<NextResponse> {
  const body: unknown = await request.json().catch(() => null);
  const parsed = CheckoutRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: { code: "VALIDATION_ERROR", message: "Invalid checkout request" } },
      { status: 400 },
    );
  }

  const stripeKey = process.env["STRIPE_SECRET_KEY"]?.trim();
  const origin = new URL(request.url).origin;

  if (!stripeKey) {
    const sessionId = `cs_test_servyn_${Date.now()}`;
    logger.info("demo_stripe_test_checkout", {
      invoiceId: parsed.data.invoiceId,
      totalMinor: parsed.data.totalMinor,
    });
    return NextResponse.json({
      ok: true,
      mode: "test_checkout",
      sessionId,
    });
  }

  try {
    const params = new URLSearchParams();
    params.set("mode", "payment");
    params.set(
      "success_url",
      `${origin}/dashboard?stripe_paid=${encodeURIComponent(parsed.data.invoiceId)}&session_id={CHECKOUT_SESSION_ID}`,
    );
    params.set(
      "cancel_url",
      `${origin}/dashboard?stripe_cancelled=${encodeURIComponent(parsed.data.invoiceId)}`,
    );
    params.set("line_items[0][price_data][currency]", "gbp");
    params.set(
      "line_items[0][price_data][product_data][name]",
      `${parsed.data.title} — ${parsed.data.providerName}`,
    );
    params.set("line_items[0][price_data][unit_amount]", String(parsed.data.subtotalMinor));
    params.set("line_items[0][quantity]", "1");

    if (parsed.data.feeMinor > 0) {
      params.set("line_items[1][price_data][currency]", "gbp");
      params.set(
        "line_items[1][price_data][product_data][name]",
        "Servyn Protected Payment Fee (10%)",
      );
      params.set("line_items[1][price_data][unit_amount]", String(parsed.data.feeMinor));
      params.set("line_items[1][quantity]", "1");
    }

    params.set("metadata[invoiceId]", parsed.data.invoiceId);
    params.set("metadata[kind]", parsed.data.kind);

    const stripeRes = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${stripeKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
      signal: AbortSignal.timeout(10_000),
    });

    const stripeJson = (await stripeRes.json()) as {
      id?: string;
      url?: string;
      error?: { message?: string };
    };

    if (!stripeRes.ok || !stripeJson.url || !stripeJson.id) {
      logger.warn("stripe_checkout_fallback", {
        invoiceId: parsed.data.invoiceId,
        status: stripeRes.status,
      });
      return NextResponse.json({
        ok: true,
        mode: "test_checkout",
        sessionId: `cs_test_servyn_${Date.now()}`,
      });
    }

    logger.info("stripe_checkout_created", {
      invoiceId: parsed.data.invoiceId,
      sessionId: stripeJson.id,
    });

    return NextResponse.json({
      ok: true,
      mode: "stripe",
      sessionId: stripeJson.id,
      url: stripeJson.url,
    });
  } catch (err) {
    logger.error("stripe_checkout_error", {
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json({
      ok: true,
      mode: "test_checkout",
      sessionId: `cs_test_servyn_${Date.now()}`,
    });
  }
}
