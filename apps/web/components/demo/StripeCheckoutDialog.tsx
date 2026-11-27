"use client";

import * as React from "react";
import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import { loadStripe, type Stripe, type StripeCardElement } from "@stripe/stripe-js";
import { Check, CheckCircle2, Copy, CreditCard, Gift, Lock, ShieldCheck } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  computeServynFeeMinor,
  formatMinorGBP,
  markInvoicePaidHeld,
  useDemoFlow,
  type DemoInvoice,
} from "@/lib/demo-flow-store";

const stripePublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "";
const stripePromise = stripePublishableKey ? loadStripe(stripePublishableKey) : null;

export interface StripeCheckoutDialogProps {
  invoice: DemoInvoice | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPaid?: (invoiceId: string) => void;
}

export function StripeCheckoutDialog({
  invoice,
  open,
  onOpenChange,
  onPaid,
}: StripeCheckoutDialogProps) {
  const { isSignedIn } = useAuth();
  const { referralCreditActive } = useDemoFlow();
  const [applyReferral, setApplyReferral] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [paidDone, setPaidDone] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [cardReady, setCardReady] = React.useState(false);
  const [copiedCard, setCopiedCard] = React.useState(false);

  const cardMountRef = React.useRef<HTMLDivElement | null>(null);
  const stripeRef = React.useRef<Stripe | null>(null);
  const cardRef = React.useRef<StripeCardElement | null>(null);

  React.useEffect(() => {
    if (!open || paidDone || !isSignedIn || !stripePromise) return;
    let active = true;
    let mountedCard: StripeCardElement | null = null;

    void stripePromise.then((stripe) => {
      if (!active || !stripe || !cardMountRef.current) return;
      stripeRef.current = stripe;
      const elements = stripe.elements();
      const card = elements.create("card", {
        hidePostalCode: false,
        style: {
          base: {
            fontSize: "14px",
            color: "#152b22",
            fontFamily: "Inter, system-ui, sans-serif",
            "::placeholder": { color: "#687a71" },
          },
          invalid: {
            color: "#9d2b2b",
          },
        },
      });
      card.mount(cardMountRef.current);
      card.on("ready", () => {
        if (active) setCardReady(true);
      });
      card.on("change", (ev) => {
        if (active) setError(ev.error ? ev.error.message : null);
      });
      mountedCard = card;
      cardRef.current = card;
    });

    return () => {
      active = false;
      setCardReady(false);
      if (mountedCard) {
        mountedCard.destroy();
      }
      cardRef.current = null;
    };
  }, [open, paidDone, isSignedIn]);

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      setPaidDone(false);
      setError(null);
      setLoading(false);
      setApplyReferral(false);
    }
    onOpenChange(nextOpen);
  }

  if (!invoice) return null;

  const useReferral = referralCreditActive && applyReferral;
  const effectiveFeeMinor = computeServynFeeMinor(invoice.subtotalMinor, useReferral);
  const effectiveTotalMinor = invoice.subtotalMinor + effectiveFeeMinor;

  async function handlePay() {
    if (!invoice) return;
    setLoading(true);
    setError(null);

    try {
      if (stripeRef.current && cardRef.current) {
        const { error: pmError } = await stripeRef.current.createPaymentMethod({
          type: "card",
          card: cardRef.current,
        });
        if (pmError) {
          setError(pmError.message ?? "Please check your card details.");
          setLoading(false);
          return;
        }
      }

      const res = await fetch("/api/demo/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoiceId: invoice.id,
          title: invoice.title,
          subtotalMinor: invoice.subtotalMinor,
          feeMinor: effectiveFeeMinor,
          totalMinor: effectiveTotalMinor,
          kind: invoice.kind,
          providerName: invoice.providerName,
        }),
      });

      const data = (await res.json().catch(() => null)) as {
        ok?: boolean;
        mode?: "stripe" | "test_checkout";
        sessionId?: string;
        url?: string;
        error?: { message?: string };
      } | null;

      if (!res.ok || !data?.ok) {
        setError(data?.error?.message ?? "Could not start Stripe checkout.");
        setLoading(false);
        return;
      }

      if (data.mode === "stripe" && data.url) {
        window.location.assign(data.url);
        return;
      }

      markInvoicePaidHeld(invoice.id, data.sessionId, useReferral);
      setPaidDone(true);
      setLoading(false);
      onPaid?.(invoice.id);
    } catch {
      setError("Network error starting Stripe checkout.");
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90dvh] w-[calc(100%-1.5rem)] max-w-md overflow-y-auto overscroll-contain border-line bg-surface p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl text-ink">
            {paidDone ? "Payment protected by Servyn" : "Stripe Protected Checkout"}
          </DialogTitle>
          <DialogDescription className="text-xs text-mut">
            {paidDone
              ? "Your payment succeeded. Funds are held in Stripe (not escrow) until you and your provider both confirm, or 48 hours after one of you does."
              : "Processed and held in Stripe (not escrow) until you and your provider both confirm, or 48 hours after one of you does."}
          </DialogDescription>
        </DialogHeader>

        {!isSignedIn ? (
          <div className="space-y-4 py-2">
            <div className="rounded-md border border-line bg-surface-2 p-4 text-xs text-ink-2">
              <p className="font-semibold text-ink">Sign in required to complete payment</p>
              <p className="mt-1 leading-relaxed text-mut">
                Every booking and protected payment is linked to your Servyn account so you can
                track delivery, message the provider, and request support if needed.
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Link
                href="/sign-in"
                onClick={() => handleOpenChange(false)}
                className="inline-flex flex-1 items-center justify-center rounded-full bg-leaf-800 px-4 py-2.5 text-xs font-semibold text-cream hover:bg-leaf-700"
              >
                Sign in to pay
              </Link>
              <Link
                href="/sign-up"
                onClick={() => handleOpenChange(false)}
                className="inline-flex flex-1 items-center justify-center rounded-full bg-linear-to-b from-grad-gold-1 to-grad-gold-2 px-4 py-2.5 text-xs font-semibold text-gold-ink shadow-gold"
              >
                Create account
              </Link>
            </div>
          </div>
        ) : paidDone ? (
          <div className="space-y-4 py-2">
            <div className="flex items-start gap-3 rounded-md border border-leaf-200 bg-leaf-50 p-4">
              <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-leaf-700" aria-hidden="true" />
              <div className="space-y-1 text-xs text-ink-2">
                <p className="font-semibold text-ink">
                  {formatMinorGBP(effectiveTotalMinor)} paid · Protected ({invoice.refId})
                </p>
                <p>
                  {invoice.providerName} has been notified. Once delivered, open your dashboard to
                  confirm satisfaction and release the payout.
                </p>
              </div>
            </div>

            <DialogFooter>
              <Link
                href="/dashboard"
                onClick={() => handleOpenChange(false)}
                className="inline-flex w-full items-center justify-center rounded-full bg-leaf-800 px-5 py-2.5 text-sm font-semibold text-cream transition-colors hover:bg-leaf-700"
              >
                Go to Customer Dashboard
              </Link>
            </DialogFooter>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-md border border-line bg-surface-2 p-4 text-xs">
              <div className="flex items-center justify-between gap-2">
                <p className="font-semibold text-ink">{invoice.title}</p>
                <span className="rounded bg-surface px-2 py-0.5 text-[10.5px] font-bold text-mut">
                  {invoice.refId}
                </span>
              </div>
              <p className="mt-0.5 text-mut">Provider: {invoice.providerName}</p>
              {invoice.agreedDate ? (
                <p className="mt-1 text-ink-2">Slot: {invoice.agreedDate}</p>
              ) : null}
              {invoice.agreedLocation ? (
                <p className="text-ink-2">Location: {invoice.agreedLocation}</p>
              ) : null}
              {invoice.discountNote ? (
                <p className="mt-1 inline-block rounded-full bg-mint px-2 py-0.5 text-[11px] font-bold text-mint-d">
                  {invoice.discountNote}
                </p>
              ) : null}

              {referralCreditActive ? (
                <label className="mt-3 flex cursor-pointer items-center justify-between rounded-md border border-leaf-200 bg-mint/40 px-3 py-2 text-[11.5px] font-semibold text-mint-d">
                  <span className="inline-flex items-center gap-1.5">
                    <Gift className="size-3.5" aria-hidden="true" />
                    <span>Apply 5% referral fee discount</span>
                  </span>
                  <input
                    type="checkbox"
                    checked={applyReferral}
                    onChange={(e) => setApplyReferral(e.target.checked)}
                    className="size-3.5 accent-leaf-700"
                  />
                </label>
              ) : null}

              <div className="mt-3 space-y-1.5 border-t border-line pt-3">
                <div className="flex justify-between text-ink-2">
                  <span>Agreed price (100% to provider)</span>
                  <span className="tabular-nums">{formatMinorGBP(invoice.subtotalMinor)}</span>
                </div>
                <div className="flex justify-between text-mut">
                  <span>
                    Servyn protected payment fee ({useReferral ? "5% referral rate" : "10%"})
                  </span>
                  <span className="tabular-nums">{formatMinorGBP(effectiveFeeMinor)}</span>
                </div>
                <div className="flex justify-between border-t border-line pt-1.5 font-serif text-base font-semibold text-ink">
                  <span>Total due today</span>
                  <span className="tabular-nums">{formatMinorGBP(effectiveTotalMinor)}</span>
                </div>
              </div>
            </div>

            {/* Real Stripe.js CardElement */}
            <div className="space-y-2 rounded-md border border-line bg-surface p-3.5 text-xs">
              <div className="flex items-center justify-between text-ink-2">
                <span className="inline-flex items-center gap-1.5 font-semibold">
                  <CreditCard className="size-4 text-leaf-700" aria-hidden="true" />
                  <span>Card details</span>
                </span>
                <span className="text-[10.5px] font-semibold text-mut">Secured by Stripe</span>
              </div>
              {stripePromise ? (
                <div
                  ref={cardMountRef}
                  className="min-h-[38px] rounded-md border border-line-2 bg-surface-2 px-3 py-2.5"
                />
              ) : (
                <p className="text-[11.5px] text-blush-d">
                  Stripe publishable key is not configured.
                </p>
              )}
              {stripePublishableKey.startsWith("pk_test_") ? (
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-line bg-surface-2 px-3 py-2 text-[11px] text-ink-2">
                  <div>
                    <span className="font-semibold text-leaf-700">Stripe Test Card: </span>
                    <span className="font-mono font-semibold">4242 4242 4242 4242</span>
                    <span className="text-mut"> · Exp 12/30 · CVC 123 · M15 5RN</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      void navigator.clipboard?.writeText("4242424242424242").catch(() => {});
                      setCopiedCard(true);
                      window.setTimeout(() => setCopiedCard(false), 1800);
                    }}
                    className="inline-flex cursor-pointer items-center gap-1 rounded-full border border-line-2 bg-surface px-2.5 py-0.5 text-[10.5px] font-semibold text-ink hover:border-gold-400"
                  >
                    {copiedCard ? (
                      <>
                        <Check className="size-3 text-leaf-700" aria-hidden="true" />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="size-3" aria-hidden="true" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
              ) : null}
              <p className="text-[11px] text-mut">
                Card details go directly into Stripe&apos;s secure fields — Servyn never sees or
                stores card numbers.
              </p>
            </div>

            <div className="flex items-start gap-2 rounded-md border border-gold-300 bg-gold-50 p-3 text-[11.5px] text-ink-2">
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-gold-600" aria-hidden="true" />
              <span>
                <strong>Protected payment (not escrow):</strong> Held in Stripe until you and your
                provider both confirm, or 48 hours after one of you does.
              </span>
            </div>

            {error ? (
              <p role="alert" className="rounded-md bg-blush px-3 py-2 text-xs font-semibold text-blush-d">
                {error}
              </p>
            ) : null}

            <DialogFooter className="gap-2 sm:justify-between">
              <button
                type="button"
                onClick={() => handleOpenChange(false)}
                className="cursor-pointer rounded-full border-[1.5px] border-line-2 px-4 py-2 text-xs font-semibold text-ink-2 hover:border-leaf-500"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={loading || (Boolean(stripePromise) && !cardReady)}
                onClick={() => void handlePay()}
                className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-full bg-linear-to-b from-grad-gold-1 to-grad-gold-2 px-6 py-2.5 text-sm font-semibold text-gold-ink shadow-gold transition-all hover:brightness-105 disabled:opacity-60"
              >
                <Lock className="size-3.5" aria-hidden="true" />
                <span>
                  {loading ? "Processing with Stripe..." : `Pay ${formatMinorGBP(effectiveTotalMinor)}`}
                </span>
              </button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
