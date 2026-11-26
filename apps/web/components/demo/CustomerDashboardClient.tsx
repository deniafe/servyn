"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AlertTriangle,
  ArrowRight,
  CalendarCheck,
  Check,
  CheckCircle2,
  Copy,
  CreditCard,
  Download,
  Gift,
  Heart,
  MessageSquare,
  RotateCcw,
  Search,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Star,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { StripeCheckoutDialog } from "@/components/demo/StripeCheckoutDialog";
import {
  confirmSatisfactionAndRelease,
  formatMinorGBP,
  markInvoicePaidHeld,
  reportProblemAndPausePayout,
  slugify,
  startOrGetConversation,
  submitVerifiedReview,
  toggleSavedVendor,
  useDemoFlow,
  type DemoInvoice,
} from "@/lib/demo-flow-store";
import { SERVICE_PROVIDERS } from "@/lib/mock-services";
import { cn } from "@/lib/utils";

const DISPUTE_REASONS = [
  "Service not delivered / no-show",
  "Not as described",
  "Damaged or missing product",
  "Quality concern — request review",
] as const;

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
  const router = useRouter();
  const searchParams = useSearchParams();
  const stripePaidId = searchParams.get("stripe_paid");
  const stripeSessionId = searchParams.get("session_id");

  const { invoices, reviews, referralCreditActive, savedVendorSlugs } = useDemoFlow();
  const [lookupQuery, setLookupQuery] = React.useState("");
  const [copiedInvite, setCopiedInvite] = React.useState(false);

  const [checkoutInvoice, setCheckoutInvoice] = React.useState<DemoInvoice | null>(null);
  const [checkoutOpen, setCheckoutOpen] = React.useState(false);

  // Report problem dialog
  const [disputeInvoice, setDisputeInvoice] = React.useState<DemoInvoice | null>(null);
  const [disputeReason, setDisputeReason] = React.useState<string>(DISPUTE_REASONS[0]);
  const [disputeNotes, setDisputeNotes] = React.useState("");

  // Verified review dialog
  const [reviewInvoice, setReviewInvoice] = React.useState<DemoInvoice | null>(null);
  const [reviewRating, setReviewRating] = React.useState<1 | 2 | 3 | 4 | 5>(5);
  const [reviewComment, setReviewComment] = React.useState("");

  React.useEffect(() => {
    if (stripePaidId) {
      markInvoicePaidHeld(stripePaidId, stripeSessionId ?? undefined);
    }
  }, [stripePaidId, stripeSessionId]);

  const heldMinor = invoices
    .filter((i) => i.status === "paid_held" || i.status === "delivered" || i.status === "disputed")
    .reduce((sum, i) => sum + i.totalMinor, 0);

  const trimmedLookup = lookupQuery.trim().toLowerCase();
  const visibleInvoices = trimmedLookup
    ? invoices.filter((inv) =>
        `${inv.refId} ${inv.title} ${inv.providerName}`.toLowerCase().includes(trimmedLookup),
      )
    : invoices;

  function handleCopyInvite() {
    const url =
      typeof window !== "undefined" ? `${window.location.origin}/?ref=servyn-demo` : "/?ref=servyn-demo";
    void navigator.clipboard?.writeText(url).catch(() => {});
    setCopiedInvite(true);
    window.setTimeout(() => setCopiedInvite(false), 2000);
  }

  function handleRebook(inv: DemoInvoice) {
    const conv = startOrGetConversation({
      kind: inv.kind,
      providerName: inv.providerName,
      providerSlug: slugify(inv.providerName),
      listingTitle: inv.title,
      area: inv.agreedLocation ?? "Manchester",
      customerName: displayName,
      initialMessage: `Hi ${inv.providerName}! I'd love to rebook "${inv.title}" (previous ref ${inv.refId}). What dates do you have free?`,
    });
    router.push(`/messages?thread=${encodeURIComponent(conv.id)}`);
  }

  function handleExportPaymentsCsv() {
    const header = ["RefID", "Type", "Provider", "Item", "TotalGBP", "Status", "Date"];
    const rows = invoices.map((inv) => [
      inv.refId,
      inv.kind,
      `"${inv.providerName.replace(/"/g, '""')}"`,
      `"${inv.title.replace(/"/g, '""')}"`,
      (inv.totalMinor / 100).toFixed(2),
      inv.status,
      inv.createdAt.slice(0, 10),
    ]);
    const csv = [header.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `servyn-payments-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleSubmitDispute(e: React.FormEvent) {
    e.preventDefault();
    if (!disputeInvoice) return;
    const detail = disputeNotes.trim() ? `${disputeReason}: ${disputeNotes.trim()}` : disputeReason;
    reportProblemAndPausePayout(disputeInvoice.id, detail);
    setDisputeInvoice(null);
    setDisputeNotes("");
  }

  function handleSubmitReview(e: React.FormEvent) {
    e.preventDefault();
    if (!reviewInvoice || !reviewComment.trim()) return;
    submitVerifiedReview({
      invoiceId: reviewInvoice.id,
      providerName: reviewInvoice.providerName,
      title: reviewInvoice.title,
      rating: reviewRating,
      comment: reviewComment,
      authorName: displayName,
    });
    setReviewInvoice(null);
    setReviewComment("");
    setReviewRating(5);
  }

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
              href="/ai-match"
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

          {/* Referral card in sidebar */}
          <div className="rounded-md border border-gold-500/30 bg-leaf-900/80 p-3.5 text-xs">
            <p className="flex items-center gap-1.5 font-bold text-gold-300">
              <Gift className="size-3.5" aria-hidden="true" />
              <span>Share Servyn · 5% Off</span>
            </p>
            <p className="mt-1 text-[11px] leading-relaxed text-cream-75">
              Invite a friend and you both get 5% off the Servyn fee (10% → 5%).
            </p>
            <button
              type="button"
              onClick={handleCopyInvite}
              className="mt-2.5 inline-flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-full bg-gold-500 px-3 py-1.5 text-[11px] font-bold text-gold-ink hover:bg-gold-400"
            >
              {copiedInvite ? (
                <>
                  <Check className="size-3" aria-hidden="true" />
                  <span>Invite link copied!</span>
                </>
              ) : (
                <>
                  <Copy className="size-3" aria-hidden="true" />
                  <span>Copy invite link</span>
                </>
              )}
            </button>
          </div>
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
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-block rounded-full bg-gold-100 px-2.5 py-0.5 text-[11px] font-bold text-butter-d">
                  Customer Dashboard
                </span>
                {referralCreditActive ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-mint px-2.5 py-0.5 text-[11px] font-bold text-mint-d">
                    <Gift className="size-3" aria-hidden="true" />
                    5% Referral Fee Discount Ready
                  </span>
                ) : null}
              </div>
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

        {/* Protected Payment Bookings & Orders + Reference ID Lookup */}
        <section className="space-y-4 rounded-[18px] border border-line bg-surface p-6 shadow-soft">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-serif text-xl font-semibold text-ink">
                Your Bookings &amp; Product Orders
              </h2>
              <p className="text-xs text-mut">
                Every booking has a reference ID and full audit trail. Funds stay held until you
                confirm satisfaction.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="relative w-full sm:w-64">
                <Search
                  className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-mut"
                  aria-hidden="true"
                />
                <input
                  type="search"
                  value={lookupQuery}
                  onChange={(e) => setLookupQuery(e.target.value)}
                  placeholder="Look up ID (e.g. SRV-8K2M4P)..."
                  aria-label="Look up booking reference ID"
                  className="w-full rounded-full border border-line-2 bg-surface-2 py-1.5 pr-3 pl-8 text-xs text-ink placeholder:text-mut focus:border-gold-500 focus:outline-none"
                />
              </div>
              <button
                type="button"
                onClick={handleExportPaymentsCsv}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-line-2 bg-surface-2 px-3.5 py-1.5 text-xs font-semibold text-ink-2 hover:border-gold-400"
              >
                <Download className="size-3.5" aria-hidden="true" />
                <span>CSV</span>
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {visibleInvoices.map((inv) => {
              const existingReview = reviews.find((r) => r.invoiceId === inv.id);
              const stepIdx =
                inv.status === "sent"
                  ? 1
                  : inv.status === "paid_held" || inv.status === "disputed"
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
                        <span className="rounded bg-leaf-900 px-2 py-0.5 text-[10.5px] font-bold tracking-wider text-gold-300">
                          {inv.refId}
                        </span>
                        <span className="rounded-full bg-surface px-2.5 py-0.5 text-[10.5px] font-bold uppercase text-ink-2">
                          {inv.kind}
                        </span>
                        <span
                          className={cn(
                            "rounded-full px-2.5 py-0.5 text-[11px] font-bold",
                            inv.status === "released"
                              ? "bg-mint text-mint-d"
                              : inv.status === "disputed" || inv.status === "refunded"
                                ? "bg-blush text-blush-d"
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
                                : inv.status === "disputed"
                                  ? "Payout paused · Under human review"
                                  : inv.status === "refunded"
                                    ? "Refunded to customer"
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
                      {inv.status === "disputed" && inv.disputeReason ? (
                        <p className="mt-1.5 rounded bg-blush/60 px-2.5 py-1 text-[11.5px] font-semibold text-blush-d">
                          Issue reported: {inv.disputeReason}
                        </p>
                      ) : null}
                    </div>

                    <div className="text-right">
                      <p className="font-serif text-lg font-semibold tabular-nums text-ink">
                        {formatMinorGBP(inv.totalMinor)}
                      </p>
                      <p className="text-[11px] text-mut">
                        {formatMinorGBP(inv.subtotalMinor)} + {formatMinorGBP(inv.feeMinor)} fee
                        {inv.referralApplied ? " (5% referral)" : ""}
                      </p>
                    </div>
                  </div>

                  {/* 4-step Protected Payment progress */}
                  <div className="mt-3 grid grid-cols-4 gap-1.5 text-[10.5px] font-semibold">
                    {[
                      "1. Invoice agreed",
                      inv.status === "disputed" ? "2. Payout paused" : "2. Held by Servyn",
                      "3. Delivered",
                      "4. Released",
                    ].map((label, idx) => {
                      const done = stepIdx >= idx + 1;
                      return (
                        <div
                          key={label}
                          className={cn(
                            "rounded px-2 py-1 text-center",
                            inv.status === "disputed" && idx === 1
                              ? "bg-blush text-blush-d"
                              : done
                                ? "bg-leaf-900 text-gold-300"
                                : "bg-surface text-mut",
                          )}
                        >
                          {label}
                        </div>
                      );
                    })}
                  </div>

                  {/* Audit trail */}
                  <p className="mt-2.5 text-[10.5px] text-mut">
                    Audit trail: Created {inv.createdAt.slice(0, 10)}
                    {inv.paidAt ? ` · Paid ${inv.paidAt.slice(0, 10)}` : ""}
                    {inv.deliveredAt ? ` · Delivered ${inv.deliveredAt.slice(0, 10)}` : ""}
                    {inv.disputedAt ? ` · Paused ${inv.disputedAt.slice(0, 10)}` : ""}
                    {inv.releasedAt ? ` · Released ${inv.releasedAt.slice(0, 10)}` : ""}
                  </p>

                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-3">
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
                        <>
                          <button
                            type="button"
                            onClick={() => setDisputeInvoice(inv)}
                            className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-line-2 bg-surface px-3.5 py-2 text-xs font-semibold text-ink-2 hover:border-blush-d hover:text-blush-d"
                          >
                            <AlertTriangle className="size-3.5" aria-hidden="true" />
                            <span>Report a problem</span>
                          </button>
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
                        </>
                      ) : null}

                      {inv.status === "released" ? (
                        <button
                          type="button"
                          onClick={() => handleRebook(inv)}
                          className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-line-2 bg-surface px-3.5 py-2 text-xs font-semibold text-ink hover:border-gold-400"
                        >
                          <RotateCcw className="size-3.5" aria-hidden="true" />
                          <span>Rebook</span>
                        </button>
                      ) : null}

                      {inv.status === "released" && !existingReview ? (
                        <button
                          type="button"
                          onClick={() => {
                            setReviewInvoice(inv);
                            setReviewRating(5);
                            setReviewComment("");
                          }}
                          className="inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-linear-to-b from-grad-gold-1 to-grad-gold-2 px-4 py-2 text-xs font-semibold text-gold-ink shadow-gold"
                        >
                          <Star className="size-3.5" aria-hidden="true" />
                          <span>Leave verified review</span>
                        </button>
                      ) : null}

                      {existingReview ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-mint px-3 py-1 text-xs font-bold text-mint-d">
                          <Star className="size-3 fill-current" aria-hidden="true" />
                          Reviewed ({existingReview.rating}.0)
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Saved Vendors */}
        <section className="space-y-3 rounded-[18px] border border-line bg-surface p-6 shadow-soft">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2 className="font-serif text-xl font-semibold text-ink">Saved Providers</h2>
              <p className="text-xs text-mut">Quick access to your favourite Manchester specialists.</p>
            </div>
            <Link href="/services" className="text-xs font-semibold text-leaf-700 hover:underline">
              Browse all →
            </Link>
          </div>
          {savedVendorSlugs.length === 0 ? (
            <p className="text-xs text-mut">No saved providers yet.</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {savedVendorSlugs.map((slug) => {
                const provider = SERVICE_PROVIDERS.find((p) => p.id === slug);
                if (!provider) return null;
                return (
                  <div
                    key={provider.id}
                    className="flex items-center justify-between gap-3 rounded-lg border border-line bg-surface-2 p-3.5 text-xs"
                  >
                    <div>
                      <Link
                        href={`/services/${provider.id}`}
                        className="font-serif text-base font-semibold text-ink hover:text-leaf-700"
                      >
                        {provider.name}
                      </Link>
                      <p className="text-mut">
                        {provider.categoryLabel} · {provider.area}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleSavedVendor(provider.id)}
                      aria-label={`Remove ${provider.name} from saved`}
                      className="inline-flex cursor-pointer items-center gap-1 rounded-full bg-blush/70 px-2.5 py-1 font-semibold text-blush-d"
                    >
                      <Heart className="size-3 fill-current" aria-hidden="true" />
                      <span>Saved</span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {/* Report a problem / pause payout dialog */}
      <Dialog
        open={disputeInvoice !== null}
        onOpenChange={(open) => {
          if (!open) setDisputeInvoice(null);
        }}
      >
        <DialogContent className="max-w-md border-line bg-surface">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl text-ink">
              Report a problem &amp; pause payout
            </DialogTitle>
            <DialogDescription className="text-xs text-mut">
              Reporting an issue immediately pauses release of {disputeInvoice?.refId} so a Servyn
              reviewer can inspect your chat and booking trail.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmitDispute} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-ink-2">What went wrong?</label>
              <select
                value={disputeReason}
                onChange={(e) => setDisputeReason(e.target.value)}
                className="w-full rounded-md border-[1.5px] border-line-2 bg-surface-2 px-3 py-2 text-sm text-ink focus:border-gold-500 focus:outline-none"
              >
                {DISPUTE_REASONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-ink-2">Details (optional)</label>
              <textarea
                rows={3}
                value={disputeNotes}
                onChange={(e) => setDisputeNotes(e.target.value)}
                placeholder="Share what happened so our team can resolve this quickly..."
                className="w-full rounded-md border-[1.5px] border-line-2 bg-surface-2 px-3 py-2 text-sm text-ink focus:border-gold-500 focus:outline-none"
              />
            </div>
            <DialogFooter>
              <button
                type="button"
                onClick={() => setDisputeInvoice(null)}
                className="cursor-pointer rounded-full border-[1.5px] border-line-2 px-4 py-2 text-xs font-semibold text-ink-2"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="cursor-pointer rounded-full bg-blush-d px-5 py-2 text-xs font-semibold text-cream"
              >
                Pause payout &amp; submit
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Verified review dialog */}
      <Dialog
        open={reviewInvoice !== null}
        onOpenChange={(open) => {
          if (!open) setReviewInvoice(null);
        }}
      >
        <DialogContent className="max-w-md border-line bg-surface">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl text-ink">Leave a verified review</DialogTitle>
            <DialogDescription className="text-xs text-mut">
              Only customers who completed a booking or order can review {reviewInvoice?.providerName}.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmitReview} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-ink-2">Rating</label>
              <div className="flex gap-1.5">
                {([1, 2, 3, 4, 5] as const).map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setReviewRating(star)}
                    aria-label={`${star} star${star > 1 ? "s" : ""}`}
                    className={cn(
                      "cursor-pointer rounded-md border px-3 py-2 transition-colors",
                      reviewRating >= star
                        ? "border-gold-400 bg-gold-50 text-gold-600"
                        : "border-line bg-surface-2 text-mut",
                    )}
                  >
                    <Star
                      className={cn("size-4", reviewRating >= star ? "fill-current" : "")}
                      aria-hidden="true"
                    />
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-ink-2">Your feedback</label>
              <textarea
                rows={3}
                required
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder="How was the service or product quality?"
                className="w-full rounded-md border-[1.5px] border-line-2 bg-surface-2 px-3 py-2 text-sm text-ink focus:border-gold-500 focus:outline-none"
              />
            </div>
            <DialogFooter>
              <button
                type="button"
                onClick={() => setReviewInvoice(null)}
                className="cursor-pointer rounded-full border-[1.5px] border-line-2 px-4 py-2 text-xs font-semibold text-ink-2"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="cursor-pointer rounded-full bg-linear-to-b from-grad-gold-1 to-grad-gold-2 px-5 py-2 text-xs font-semibold text-gold-ink shadow-gold"
              >
                Publish verified review
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <StripeCheckoutDialog
        invoice={checkoutInvoice}
        open={checkoutOpen}
        onOpenChange={setCheckoutOpen}
      />
    </div>
  );
}
