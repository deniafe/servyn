"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowRight,
  CalendarCheck,
  CheckCircle2,
  CreditCard,
  MessageSquare,
  Search,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
} from "lucide-react";
import { StripeCheckoutDialog } from "@/components/demo/StripeCheckoutDialog";
import {
  confirmSatisfactionAndRelease,
  formatMinorGBP,
  markInvoicePaidHeld,
  useDemoFlow,
  type DemoInvoice,
} from "@/lib/demo-flow-store";
import { cn } from "@/lib/utils";

export function CustomerDashboardClient({
  displayName,
  email,
  hasMfa,
  isVendor,
  isSeller,
}: {
  displayName: string;
  email: string;
  hasMfa: boolean;
  isVendor: boolean;
  isSeller: boolean;
}) {
  const searchParams = useSearchParams();
  const stripePaidId = searchParams.get("stripe_paid");
  const stripeSessionId = searchParams.get("session_id");

  const { invoices } = useDemoFlow();
  const [checkoutInvoice, setCheckoutInvoice] = React.useState<DemoInvoice | null>(null);
  const [checkoutOpen, setCheckoutOpen] = React.useState(false);

  React.useEffect(() => {
    if (stripePaidId) {
      markInvoicePaidHeld(stripePaidId, stripeSessionId ?? undefined);
    }
  }, [stripePaidId, stripeSessionId]);

  const heldMinor = invoices
    .filter((i) => i.status === "paid_held" || i.status === "delivered")
    .reduce((sum, i) => sum + i.totalMinor, 0);

  return (
    <div className="grid gap-6 lg:grid-cols-[270px_1fr]">
      {/* Dark leaf-950 left rail matching uploaded screenshots */}
      <aside className="flex flex-col justify-between rounded-[18px] bg-leaf-950 p-5 text-cream shadow-lift">
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-gold-200 px-3 py-1 text-[11.5px] font-bold text-gold-ink">
              <CalendarCheck className="size-3.5" aria-hidden="true" />
              <span>Customer</span>
            </span>
            {hasMfa ? (
              <span className="text-[11px] font-semibold text-gold-300">2FA Verified</span>
            ) : null}
          </div>

          <nav className="space-y-2 text-xs font-semibold">
            <div className="flex items-center justify-between rounded-md border border-gold-500/50 bg-leaf-800/90 px-3 py-2.5 text-cream">
              <span>Bookings &amp; Orders</span>
              <span className="rounded-full bg-gold-500 px-2 py-0.5 text-[10px] font-bold text-gold-ink">
                {invoices.length}
              </span>
            </div>
            <Link
              href="/messages"
              className="flex items-center justify-between rounded-md border border-cream/10 bg-leaf-900/50 px-3 py-2.5 text-cream-75 transition-colors hover:border-cream/25 hover:text-cream"
            >
              <span>Messages &amp; Invoices</span>
              <MessageSquare className="size-3.5 text-gold-300" aria-hidden="true" />
            </Link>
            <Link
              href="/services?mode=ai"
              className="flex items-center justify-between rounded-md border border-cream/10 bg-leaf-900/50 px-3 py-2.5 text-cream-75 transition-colors hover:border-cream/25 hover:text-cream"
            >
              <span>AI Match Search</span>
              <Sparkles className="size-3.5 text-gold-300" aria-hidden="true" />
            </Link>
            <Link
              href="/market"
              className="flex items-center justify-between rounded-md border border-cream/10 bg-leaf-900/50 px-3 py-2.5 text-cream-75 transition-colors hover:border-cream/25 hover:text-cream"
            >
              <span>African Market</span>
              <ShoppingBag className="size-3.5 text-gold-300" aria-hidden="true" />
            </Link>
          </nav>
        </div>

        <div className="mt-6 space-y-2 border-t border-cream/12 pt-4">
          <Link
            href={isVendor ? "/vendor" : "/onboarding/vendor"}
            className="flex w-full items-center justify-between rounded-full border border-cream/20 px-4 py-2 text-xs font-semibold text-cream transition-colors hover:bg-leaf-900"
          >
            <span>{isVendor ? "Switch to Vendor" : "Become a Vendor"}</span>
            <ArrowRight className="size-3.5" aria-hidden="true" />
          </Link>
          <Link
            href={isSeller ? "/seller" : "/onboarding/seller"}
            className="flex w-full items-center justify-between rounded-full border border-cream/20 px-4 py-2 text-xs font-semibold text-cream transition-colors hover:bg-leaf-900"
          >
            <span>{isSeller ? "Switch to Seller" : "Become a Seller"}</span>
            <ArrowRight className="size-3.5" aria-hidden="true" />
          </Link>
        </div>
      </aside>

      {/* Main customer surface */}
      <div className="space-y-6">
        {stripePaidId ? (
          <div className="flex items-center gap-3 rounded-lg border border-leaf-300 bg-mint p-4 text-xs font-semibold text-mint-d">
            <CheckCircle2 className="size-5 shrink-0" aria-hidden="true" />
            <span>
              Stripe payment succeeded! Funds are now held securely within Servyn until you confirm
              delivery below.
            </span>
          </div>
        ) : null}

        <section className="rounded-[18px] border border-line bg-surface p-6 shadow-soft">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="inline-block rounded-full bg-gold-100 px-2.5 py-0.5 text-[11px] font-bold text-butter-d">
                Customer Dashboard
              </span>
              <h1 className="mt-2 font-serif text-2xl font-semibold text-ink sm:text-3xl">
                Welcome back, {displayName}
              </h1>
              <p className="mt-1 text-xs text-mut">{email}</p>
            </div>

            <div className="rounded-lg border border-line bg-surface-2 px-4 py-3 text-right">
              <p className="text-[11px] font-bold uppercase tracking-wider text-mut">
                Held in Protected Payment
              </p>
              <p className="font-serif text-2xl font-semibold tabular-nums text-leaf-900">
                {formatMinorGBP(heldMinor)}
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <Link
              href="/services?mode=ai"
              className="flex items-center gap-3 rounded-md border border-line bg-mint/40 p-3.5 transition-colors hover:border-gold-400"
            >
              <Search className="size-4 text-mint-d" aria-hidden="true" />
              <div className="text-xs">
                <p className="font-semibold text-ink">AI Match Search</p>
                <p className="text-mut">Describe what you need</p>
              </div>
            </Link>
            <Link
              href="/market"
              className="flex items-center gap-3 rounded-md border border-line bg-peach/50 p-3.5 transition-colors hover:border-gold-400"
            >
              <ShoppingBag className="size-4 text-peach-d" aria-hidden="true" />
              <div className="text-xs">
                <p className="font-semibold text-ink">African Market</p>
                <p className="text-mut">Retail &amp; bulk goods</p>
              </div>
            </Link>
            <Link
              href="/messages"
              className="flex items-center gap-3 rounded-md border border-line bg-butter/60 p-3.5 transition-colors hover:border-gold-400"
            >
              <MessageSquare className="size-4 text-butter-d" aria-hidden="true" />
              <div className="text-xs">
                <p className="font-semibold text-ink">Chat &amp; Invoices</p>
                <p className="text-mut">Negotiate &amp; pay</p>
              </div>
            </Link>
          </div>
        </section>

        {/* Protected Payment Bookings & Orders */}
        <section className="space-y-4 rounded-[18px] border border-line bg-surface p-6 shadow-soft">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="font-serif text-xl font-semibold text-ink">
                Your Bookings &amp; Product Orders
              </h2>
              <p className="text-xs text-mut">
                Payments stay held within Servyn until you confirm the service or goods arrived
                satisfactorily.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {invoices.map((inv) => {
              const stepIdx =
                inv.status === "sent"
                  ? 1
                  : inv.status === "paid_held"
                    ? 2
                    : inv.status === "delivered"
                      ? 3
                      : 4;

              return (
                <div
                  key={inv.id}
                  className="rounded-lg border border-line bg-surface-2 p-4 transition-colors hover:border-gold-300"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-surface px-2.5 py-0.5 text-[10.5px] font-bold uppercase text-ink-2">
                          {inv.kind}
                        </span>
                        <span
                          className={cn(
                            "rounded-full px-2.5 py-0.5 text-[11px] font-bold",
                            inv.status === "released"
                              ? "bg-mint text-mint-d"
                              : inv.status === "paid_held" || inv.status === "delivered"
                                ? "bg-sky text-sky-d"
                                : "bg-butter text-butter-d",
                          )}
                        >
                          {inv.status === "sent"
                            ? "Invoice awaiting payment"
                            : inv.status === "paid_held"
                              ? "Paid · Held by Servyn"
                              : inv.status === "delivered"
                                ? "Marked delivered · Confirm below"
                                : "Confirmed & Released to provider"}
                        </span>
                      </div>
                      <h3 className="mt-1.5 font-serif text-lg font-semibold text-ink">
                        {inv.title}
                      </h3>
                      <p className="text-xs text-mut">
                        {inv.providerName}
                        {inv.agreedDate ? ` · ${inv.agreedDate}` : ""}
                        {inv.agreedLocation ? ` · ${inv.agreedLocation}` : ""}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="font-serif text-lg font-semibold tabular-nums text-ink">
                        {formatMinorGBP(inv.totalMinor)}
                      </p>
                      <p className="text-[11px] text-mut">
                        {formatMinorGBP(inv.subtotalMinor)} + {formatMinorGBP(inv.feeMinor)} fee
                      </p>
                    </div>
                  </div>

                  {/* 4-step Protected Payment progress */}
                  <div className="mt-3 grid grid-cols-4 gap-1.5 text-[10.5px] font-semibold">
                    {[
                      "1. Invoice agreed",
                      "2. Held by Servyn",
                      "3. Delivered",
                      "4. Released",
                    ].map((label, idx) => {
                      const done = stepIdx >= idx + 1;
                      return (
                        <div
                          key={label}
                          className={cn(
                            "rounded px-2 py-1 text-center",
                            done ? "bg-leaf-900 text-gold-300" : "bg-surface text-mut",
                          )}
                        >
                          {label}
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 pt-1">
                    <Link
                      href={`/messages?thread=${encodeURIComponent(inv.conversationId)}`}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-leaf-700 hover:text-leaf-900"
                    >
                      <MessageSquare className="size-3.5" aria-hidden="true" />
                      <span>Open chat</span>
                    </Link>

                    <div className="flex flex-wrap gap-2">
                      {inv.status === "sent" ? (
                        <button
                          type="button"
                          onClick={() => {
                            setCheckoutInvoice(inv);
                            setCheckoutOpen(true);
                          }}
                          className="inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-linear-to-b from-grad-gold-1 to-grad-gold-2 px-4 py-2 text-xs font-semibold text-gold-ink shadow-gold hover:brightness-105"
                        >
                          <CreditCard className="size-3.5" aria-hidden="true" />
                          <span>Pay with Stripe</span>
                        </button>
                      ) : null}

                      {inv.status === "paid_held" || inv.status === "delivered" ? (
                        <button
                          type="button"
                          onClick={() => confirmSatisfactionAndRelease(inv.id)}
                          className="inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-leaf-800 px-4 py-2 text-xs font-semibold text-cream hover:bg-leaf-700"
                        >
                          <ShieldCheck className="size-3.5" aria-hidden="true" />
                          <span>
                            {inv.kind === "service"
                              ? "Confirm service delivered & release payment"
                              : "Confirm goods received & release payment"}
                          </span>
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      <StripeCheckoutDialog
        invoice={checkoutInvoice}
        open={checkoutOpen}
        onOpenChange={setCheckoutOpen}
      />
    </div>
  );
}
