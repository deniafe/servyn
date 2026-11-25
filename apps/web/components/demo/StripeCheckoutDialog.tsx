"use client";

import * as React from "react";
import Link from "next/link";
import { CheckCircle2, CreditCard, Lock, ShieldCheck } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  formatMinorGBP,
  markInvoicePaidHeld,
  type DemoInvoice,
} from "@/lib/demo-flow-store";

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
  const [loading, setLoading] = React.useState(false);
  const [paidDone, setPaidDone] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      setPaidDone(false);
      setError(null);
      setLoading(false);
    }
    onOpenChange(nextOpen);
  }

  if (!invoice) return null;

  async function handlePay() {
    if (!invoice) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/demo/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoiceId: invoice.id,
          title: invoice.title,
          subtotalMinor: invoice.subtotalMinor,
          feeMinor: invoice.feeMinor,
          totalMinor: invoice.totalMinor,
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

      markInvoicePaidHeld(invoice.id, data.sessionId);
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
      <DialogContent className="max-w-md border-line bg-surface">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl text-ink">
            {paidDone ? "Payment held securely by Servyn" : "Stripe Protected Checkout"}
          </DialogTitle>
          <DialogDescription className="text-xs text-mut">
            {paidDone
              ? "Your payment succeeded. Funds stay protected within Servyn until you confirm satisfaction."
              : "Powered by Stripe. Your payment is held within Servyn until you confirm the service or goods are delivered."}
          </DialogDescription>
        </DialogHeader>

        {paidDone ? (
          <div className="space-y-4 py-2">
            <div className="flex items-start gap-3 rounded-md border border-leaf-200 bg-leaf-50 p-4">
              <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-leaf-700" aria-hidden="true" />
              <div className="space-y-1 text-xs text-ink-2">
                <p className="font-semibold text-ink">
                  {formatMinorGBP(invoice.totalMinor)} paid · Held by Servyn
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
                onClick={() => onOpenChange(false)}
                className="inline-flex w-full items-center justify-center rounded-full bg-leaf-800 px-5 py-2.5 text-sm font-semibold text-cream transition-colors hover:bg-leaf-700"
              >
                Go to Customer Dashboard
              </Link>
            </DialogFooter>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-md border border-line bg-surface-2 p-4 text-xs">
              <p className="font-semibold text-ink">{invoice.title}</p>
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

              <div className="mt-3 space-y-1.5 border-t border-line pt-3">
                <div className="flex justify-between text-ink-2">
                  <span>Agreed price</span>
                  <span className="tabular-nums">{formatMinorGBP(invoice.subtotalMinor)}</span>
                </div>
                <div className="flex justify-between text-mut">
                  <span>Servyn protected payment fee (10%)</span>
                  <span className="tabular-nums">{formatMinorGBP(invoice.feeMinor)}</span>
                </div>
                <div className="flex justify-between border-t border-line pt-1.5 font-serif text-base font-semibold text-ink">
                  <span>Total due today</span>
                  <span className="tabular-nums">{formatMinorGBP(invoice.totalMinor)}</span>
                </div>
              </div>
            </div>

            <div className="space-y-2 rounded-md border border-line bg-surface p-3.5 text-xs">
              <div className="flex items-center justify-between text-ink-2">
                <span className="inline-flex items-center gap-1.5 font-semibold">
                  <CreditCard className="size-4 text-leaf-700" aria-hidden="true" />
                  Stripe Card (Test Mode)
                </span>
                <span className="rounded bg-surface-2 px-2 py-0.5 text-[10.5px] font-semibold text-mut">
                  VISA •••• 4242
                </span>
              </div>
              <p className="text-[11.5px] text-mut">
                Card details are handled by Stripe — Servyn never stores card numbers.
              </p>
            </div>

            <div className="flex items-start gap-2 rounded-md border border-gold-300 bg-gold-50 p-3 text-[11.5px] text-ink-2">
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-gold-600" aria-hidden="true" />
              <span>
                <strong>Protected payment (not escrow):</strong> Held within Servyn until you
                confirm the service or goods arrived satisfactorily.
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
                onClick={() => onOpenChange(false)}
                className="cursor-pointer rounded-full border-[1.5px] border-line-2 px-4 py-2 text-xs font-semibold text-ink-2 hover:border-leaf-500"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={() => void handlePay()}
                className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-full bg-linear-to-b from-grad-gold-1 to-grad-gold-2 px-6 py-2.5 text-sm font-semibold text-gold-ink shadow-gold transition-all hover:brightness-105 disabled:opacity-60"
              >
                <Lock className="size-3.5" aria-hidden="true" />
                <span>
                  {loading ? "Processing with Stripe..." : `Pay ${formatMinorGBP(invoice.totalMinor)}`}
                </span>
              </button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
