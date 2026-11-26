"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  CreditCard,
  FileText,
  Lock,
  MessageSquare,
  Plus,
  Send,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Star,
  Trash2,
  Wrench,
  X,
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
  computeServynFeeMinor,
  confirmSatisfactionAndRelease,
  createInvoiceAndSend,
  deleteConversation,
  deleteMessage,
  formatMinorGBP,
  markInvoiceDelivered,
  reportProblemAndPausePayout,
  retractInvoice,
  sendMessage,
  submitVerifiedReview,
  useDemoFlow,
  type DemoInvoice,
} from "@/lib/demo-flow-store";
import { cn } from "@/lib/utils";

const DISPUTE_REASONS = [
  "Service not delivered / no-show",
  "Not as described",
  "Damaged or missing product",
  "Quality concern — request review",
] as const;

export function MessagesWorkspace({ customerName }: { customerName: string }) {
  const searchParams = useSearchParams();
  const threadParam = searchParams.get("thread");

  const { conversations, invoices, reviews, currentUserId } = useDemoFlow();
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [mobileShowChat, setMobileShowChat] = React.useState(Boolean(threadParam));
  const [perspective, setPerspective] = React.useState<"customer" | "provider">("customer");
  const [draft, setDraft] = React.useState("");
  const [safetyDismissed, setSafetyDismissed] = React.useState(false);

  // Invoice builder dialog state
  const [invoiceOpen, setInvoiceOpen] = React.useState(false);
  const [invTitle, setInvTitle] = React.useState("");
  const [invPriceGBP, setInvPriceGBP] = React.useState("75.00");
  const [invOriginalGBP, setInvOriginalGBP] = React.useState("");
  const [invDiscountNote, setInvDiscountNote] = React.useState("");
  const [invDate, setInvDate] = React.useState("Sat · 10:30");
  const [invLocation, setInvLocation] = React.useState("Hulme, Manchester");

  // Stripe checkout dialog state
  const [checkoutInvoice, setCheckoutInvoice] = React.useState<DemoInvoice | null>(null);
  const [checkoutOpen, setCheckoutOpen] = React.useState(false);

  // Accept order confirmation modal
  const [acceptInvoice, setAcceptInvoice] = React.useState<DemoInvoice | null>(null);

  // Delete chat confirmation modal
  const [confirmDeleteChatId, setConfirmDeleteChatId] = React.useState<string | null>(null);

  // Report issue modal
  const [disputeInvoice, setDisputeInvoice] = React.useState<DemoInvoice | null>(null);
  const [disputeReason, setDisputeReason] = React.useState<string>(DISPUTE_REASONS[0]);
  const [disputeNotes, setDisputeNotes] = React.useState("");

  // Leave feedback / star rating modal
  const [reviewInvoice, setReviewInvoice] = React.useState<DemoInvoice | null>(null);
  const [reviewRating, setReviewRating] = React.useState<1 | 2 | 3 | 4 | 5>(5);
  const [reviewComment, setReviewComment] = React.useState("");

  const effectiveId = selectedId ?? threadParam;
  const activeConversation =
    conversations.find((c) => c.id === effectiveId) ?? conversations[0] ?? null;

  const isRealProviderThread = Boolean(
    currentUserId && activeConversation?.providerUserId === currentUserId,
  );
  const isRealCustomerThread = Boolean(
    currentUserId &&
      activeConversation?.customerUserId === currentUserId &&
      activeConversation?.providerUserId &&
      activeConversation.providerUserId !== currentUserId,
  );
  const effectivePerspective: "customer" | "provider" = isRealProviderThread
    ? "provider"
    : isRealCustomerThread
      ? "customer"
      : perspective;

  const threadInvoices = activeConversation
    ? invoices.filter((inv) => inv.conversationId === activeConversation.id)
    : [];
  const latestInvoice = threadInvoices[0] ?? null;
  const hasActivePaidOrder = threadInvoices.some(
    (inv) =>
      inv.status === "paid_held" ||
      inv.status === "delivered" ||
      inv.status === "disputed",
  );
  const latestReview = latestInvoice
    ? reviews.find((r) => r.invoiceId === latestInvoice.id)
    : undefined;

  function openInvoiceDialog() {
    if (!activeConversation) return;
    setInvTitle(activeConversation.listingTitle);
    setInvPriceGBP(activeConversation.kind === "service" ? "75.00" : "95.00");
    setInvOriginalGBP(activeConversation.kind === "product" ? "120.00" : "");
    setInvDiscountNote(
      activeConversation.kind === "product"
        ? "Agreed bundle discount"
        : "Personal chat discount",
    );
    setInvDate("");
    setInvLocation(activeConversation.area || "Manchester");
    setInvoiceOpen(true);
  }

  function handleSendChat(e: React.FormEvent) {
    e.preventDefault();
    if (!activeConversation || !draft.trim()) return;
    sendMessage(activeConversation.id, effectivePerspective, draft);
    setDraft("");
  }

  function handleCreateInvoice(e: React.FormEvent) {
    e.preventDefault();
    if (!activeConversation) return;
    const parsedPrice = Number.parseFloat(invPriceGBP);
    if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) return;

    const subtotalMinor = Math.round(parsedPrice * 100);
    const parsedOrig = Number.parseFloat(invOriginalGBP);
    const originalAmountMinor =
      Number.isFinite(parsedOrig) && parsedOrig > parsedPrice
        ? Math.round(parsedOrig * 100)
        : undefined;

    createInvoiceAndSend({
      conversationId: activeConversation.id,
      kind: activeConversation.kind,
      providerName: activeConversation.providerName,
      customerName: activeConversation.customerName || customerName,
      title: invTitle.trim() || activeConversation.listingTitle,
      subtotalMinor,
      agreedDate: activeConversation.kind === "service" ? invDate.trim() || undefined : undefined,
      agreedLocation: invLocation.trim() || undefined,
      originalAmountMinor,
      discountNote: invDiscountNote.trim() || undefined,
    });
    setInvoiceOpen(false);
  }

  function handleSubmitDispute(e: React.FormEvent) {
    e.preventDefault();
    if (!disputeInvoice) return;
    const detail = disputeNotes.trim()
      ? `${disputeReason}: ${disputeNotes.trim()}`
      : disputeReason;
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
      authorName: customerName || reviewInvoice.customerName,
    });
    setReviewInvoice(null);
    setReviewComment("");
    setReviewRating(5);
  }

  const previewSubtotalMinor = Math.max(
    0,
    Math.round((Number.parseFloat(invPriceGBP) || 0) * 100),
  );
  const previewFeeMinor = computeServynFeeMinor(previewSubtotalMinor);

  return (
    <div className="grid gap-6 lg:grid-cols-[290px_1fr]">
      {/* Conversation List Rail (hidden on mobile when chat is open) */}
      <aside
        className={cn(
          "flex flex-col justify-between rounded-[18px] bg-leaf-950 p-4 text-cream shadow-lift",
          mobileShowChat ? "hidden lg:flex" : "flex",
        )}
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-gold-200 px-3 py-1 text-[11px] font-bold text-gold-ink">
              <MessageSquare className="size-3.5" aria-hidden="true" />
              <span>Conversations</span>
            </span>
            <Link
              href="/list"
              className="inline-flex items-center gap-1 rounded-full bg-gold-500 px-2.5 py-1 text-[11px] font-bold text-gold-ink"
            >
              <Plus className="size-3" aria-hidden="true" />
              <span>List</span>
            </Link>
          </div>

          <div className="space-y-2">
            {conversations.map((conv) => {
              const isSelected = activeConversation?.id === conv.id;
              const lastMsg = conv.messages[conv.messages.length - 1];
              const convInv = invoices.find((i) => i.conversationId === conv.id);
              const convHasActiveOrder = invoices.some(
                (i) =>
                  i.conversationId === conv.id &&
                  (i.status === "paid_held" ||
                    i.status === "delivered" ||
                    i.status === "disputed"),
              );

              return (
                <div key={conv.id} className="group relative">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedId(conv.id);
                      setMobileShowChat(true);
                    }}
                    className={cn(
                      "w-full cursor-pointer rounded-md border p-3 pr-9 text-left transition-colors",
                      isSelected
                        ? "border-gold-500/70 bg-leaf-800/90 text-cream"
                        : "border-cream/10 bg-leaf-900/50 text-cream-75 hover:border-cream/25 hover:text-cream",
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1 text-[10.5px] font-bold uppercase tracking-wider text-gold-300">
                        {conv.kind === "service" ? (
                          <Wrench className="size-3" aria-hidden="true" />
                        ) : (
                          <ShoppingBag className="size-3" aria-hidden="true" />
                        )}
                        {conv.kind}
                      </span>
                      {convInv ? (
                        <span className="rounded-full bg-gold-500/20 px-2 py-0.5 text-[10px] font-bold text-gold-300">
                          {convInv.status.replace("_", " ")}
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1 truncate font-serif text-sm font-semibold text-cream">
                      {isRealProviderThread ? conv.customerName : conv.providerName}
                    </p>
                    <p className="truncate text-[11.5px] text-cream-75">{conv.listingTitle}</p>
                    {lastMsg ? (
                      <p className="mt-1 truncate text-[11px] text-cream-60">{lastMsg.text}</p>
                    ) : null}
                  </button>

                  {!convHasActiveOrder ? (
                    <button
                      type="button"
                      aria-label={`Delete conversation with ${
                        isRealProviderThread ? conv.customerName : conv.providerName
                      }`}
                      title="Delete conversation"
                      onClick={(e) => {
                        e.stopPropagation();
                        setConfirmDeleteChatId(conv.id);
                      }}
                      className="absolute right-2 bottom-2.5 inline-flex size-7 cursor-pointer items-center justify-center rounded-full text-cream-60 transition-colors hover:bg-blush-d/20 hover:text-blush"
                    >
                      <Trash2 className="size-3.5" aria-hidden="true" />
                    </button>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-6 rounded-md border border-cream/10 bg-leaf-900/60 p-3 text-[11px] leading-relaxed text-cream-75">
          <p className="font-semibold text-gold-300">Protected workflow</p>
          <p className="mt-1">
            Agree price, date, or bundle discount in chat, send an invoice, pay with Stripe, and
            confirm delivery to release funds.
          </p>
        </div>
      </aside>

      {/* Active Chat & Order Timeline Panel */}
      <section
        className={cn(
          "flex min-h-[640px] flex-col overflow-hidden rounded-[18px] border border-line bg-surface shadow-soft",
          mobileShowChat ? "flex" : "hidden lg:flex",
        )}
      >
        {activeConversation ? (
          <>
            {/* Top Thread Header + Mobile Back */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-surface-2 px-4 py-3.5 sm:px-6">
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setMobileShowChat(false)}
                  aria-label="Back to conversations"
                  className="inline-flex size-8 cursor-pointer items-center justify-center rounded-full border border-line-2 bg-surface text-ink lg:hidden"
                >
                  <ArrowLeft className="size-4" aria-hidden="true" />
                </button>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-serif text-lg font-semibold text-ink sm:text-xl">
                      {effectivePerspective === "provider"
                        ? activeConversation.customerName
                        : activeConversation.providerName}
                    </h2>
                    <span className="rounded-full bg-mint px-2.5 py-0.5 text-[11px] font-bold text-mint-d">
                      {activeConversation.area}
                    </span>
                  </div>
                  <p className="text-xs text-mut">{activeConversation.listingTitle}</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {!isRealProviderThread && !isRealCustomerThread ? (
                  <div className="inline-flex rounded-full border border-line-2 bg-surface p-0.5 text-xs font-semibold">
                    <button
                      type="button"
                      onClick={() => setPerspective("customer")}
                      className={cn(
                        "cursor-pointer rounded-full px-3 py-1 transition-colors",
                        perspective === "customer"
                          ? "bg-leaf-900 text-cream"
                          : "text-mut hover:text-ink",
                      )}
                    >
                      Customer
                    </button>
                    <button
                      type="button"
                      onClick={() => setPerspective("provider")}
                      className={cn(
                        "cursor-pointer rounded-full px-3 py-1 transition-colors",
                        perspective === "provider"
                          ? "bg-gold-500 text-gold-ink"
                          : "text-mut hover:text-ink",
                      )}
                    >
                      Vendor / Seller
                    </button>
                  </div>
                ) : null}

                {effectivePerspective === "provider" ? (
                  <button
                    type="button"
                    onClick={openInvoiceDialog}
                    className="inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-linear-to-b from-grad-gold-1 to-grad-gold-2 px-3.5 py-2 text-xs font-semibold text-gold-ink shadow-gold transition-all hover:brightness-105"
                  >
                    <FileText className="size-3.5" aria-hidden="true" />
                    <span>Send agreed invoice</span>
                  </button>
                ) : null}

                <button
                  type="button"
                  disabled={hasActivePaidOrder}
                  onClick={() => setConfirmDeleteChatId(activeConversation.id)}
                  title={
                    hasActivePaidOrder
                      ? "Cannot delete chat while a protected order is active"
                      : "Delete chat"
                  }
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border border-line-2 bg-surface px-3 py-2 text-xs font-semibold transition-colors",
                    hasActivePaidOrder
                      ? "cursor-not-allowed text-mut/50"
                      : "cursor-pointer text-mut hover:border-blush-d hover:text-blush-d",
                  )}
                >
                  <Trash2 className="size-3.5" aria-hidden="true" />
                  <span className="hidden sm:inline">Delete chat</span>
                </button>
              </div>
            </div>

            {/* Sticky Listing & Agreed Price Strip (Vinted-style) */}
            {latestInvoice ? (
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line bg-surface px-4 py-2.5 text-xs sm:px-6">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-ink">{latestInvoice.title}</span>
                  <span className="font-serif text-sm font-semibold tabular-nums text-ink">
                    {formatMinorGBP(latestInvoice.subtotalMinor)}
                  </span>
                  {latestInvoice.originalAmountMinor ? (
                    <span className="text-mut line-through tabular-nums">
                      {formatMinorGBP(latestInvoice.originalAmountMinor)}
                    </span>
                  ) : null}
                  <span className="inline-flex items-center gap-1 font-semibold text-leaf-700">
                    <ShieldCheck className="size-3.5" aria-hidden="true" />
                    {formatMinorGBP(latestInvoice.totalMinor)} incl. Servyn fee
                  </span>
                </div>
                <span className="rounded bg-leaf-900 px-2 py-0.5 text-[10.5px] font-bold text-gold-300">
                  {latestInvoice.refId}
                </span>
              </div>
            ) : null}

            {/* Messages + Inline Order Timeline */}
            <div className="flex-1 space-y-4 overflow-y-auto bg-cream/40 p-4 sm:p-6">
              {activeConversation.messages.map((msg) => {
                const isCustomer = msg.sender === "customer";
                const attachedInvoice = msg.invoiceId
                  ? invoices.find((inv) => inv.id === msg.invoiceId)
                  : undefined;

                return (
                  <div
                    key={msg.id}
                    className={cn(
                      "flex flex-col gap-2",
                      isCustomer ? "items-end" : "items-start",
                    )}
                  >
                    <div
                      className={cn(
                        "group relative max-w-[88%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-soft sm:max-w-[78%]",
                        isCustomer
                          ? "bg-leaf-900 text-cream"
                          : "border border-line bg-surface text-ink",
                      )}
                    >
                      <div className="mb-1 flex items-center justify-between gap-3">
                        <p className="text-[10.5px] font-bold uppercase tracking-wider opacity-70">
                          {isCustomer
                            ? msg.senderName || customerName || activeConversation.customerName
                            : activeConversation.providerName}
                        </p>
                        <button
                          type="button"
                          onClick={() => deleteMessage(activeConversation.id, msg.id)}
                          aria-label="Delete message"
                          title="Delete message"
                          className="cursor-pointer rounded p-0.5 opacity-55 transition-opacity hover:opacity-100"
                        >
                          <Trash2 className="size-3" aria-hidden="true" />
                        </button>
                      </div>
                      <p>{msg.text}</p>
                    </div>

                    {attachedInvoice ? (
                      <div className="w-full max-w-md rounded-xl border border-gold-300 bg-surface p-4 shadow-soft">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="inline-flex items-center gap-1 rounded-full bg-gold-100 px-2.5 py-0.5 text-[11px] font-bold text-butter-d">
                              <FileText className="size-3" aria-hidden="true" />
                              Agreed Invoice
                            </span>
                            <h3 className="mt-1.5 font-serif text-base font-semibold text-ink">
                              {attachedInvoice.title}
                            </h3>
                          </div>
                          <span
                            className={cn(
                              "rounded-full px-2.5 py-0.5 text-[11px] font-bold",
                              attachedInvoice.status === "released"
                                ? "bg-mint text-mint-d"
                                : attachedInvoice.status === "disputed" ||
                                    attachedInvoice.status === "refunded"
                                  ? "bg-blush text-blush-d"
                                  : attachedInvoice.status === "paid_held" ||
                                      attachedInvoice.status === "delivered"
                                    ? "bg-sky text-sky-d"
                                    : "bg-butter text-butter-d",
                            )}
                          >
                            {attachedInvoice.status === "sent"
                              ? "Accepted · Pay now"
                              : attachedInvoice.status === "paid_held"
                                ? "Purchase successful"
                                : attachedInvoice.status === "delivered"
                                  ? attachedInvoice.kind === "service"
                                    ? "Service completed"
                                    : "Delivered"
                                  : attachedInvoice.status === "disputed"
                                    ? "Issue reported · Paused"
                                    : attachedInvoice.status === "refunded"
                                      ? "Refunded"
                                      : "Accepted & Released"}
                          </span>
                        </div>

                        <div className="mt-2.5 space-y-1 text-xs text-ink-2">
                          {attachedInvoice.agreedDate ? (
                            <p>
                              <strong>Agreed date:</strong> {attachedInvoice.agreedDate}
                            </p>
                          ) : null}
                          {attachedInvoice.agreedLocation ? (
                            <p>
                              <strong>Location:</strong> {attachedInvoice.agreedLocation}
                            </p>
                          ) : null}
                          {attachedInvoice.originalAmountMinor ? (
                            <p>
                              <strong>Original price:</strong>{" "}
                              <span className="line-through text-mut">
                                {formatMinorGBP(attachedInvoice.originalAmountMinor)}
                              </span>{" "}
                              {attachedInvoice.discountNote ? (
                                <span className="font-semibold text-mint-d">
                                  ({attachedInvoice.discountNote})
                                </span>
                              ) : null}
                            </p>
                          ) : null}
                          <div className="mt-2 flex items-center justify-between border-t border-line pt-2 font-serif text-sm font-semibold text-ink">
                            <span>Total incl. Servyn fee</span>
                            <span>{formatMinorGBP(attachedInvoice.totalMinor)}</span>
                          </div>
                        </div>

                        <div className="mt-3 flex flex-wrap gap-2">
                          {attachedInvoice.status === "sent" &&
                          effectivePerspective === "customer" ? (
                            <>
                              {attachedInvoice.kind === "service" &&
                              activeConversation.providerSlug ? (
                                <Link
                                  href={`/services/${activeConversation.providerSlug}?offer=${encodeURIComponent(attachedInvoice.id)}`}
                                  className="inline-flex w-full items-center justify-center gap-1.5 rounded-full bg-leaf-800 px-4 py-2.5 text-xs font-bold text-cream shadow-soft hover:bg-leaf-700"
                                >
                                  <span>Choose service, date &amp; time →</span>
                                </Link>
                              ) : null}
                              <button
                                type="button"
                                onClick={() => {
                                  setCheckoutInvoice(attachedInvoice);
                                  setCheckoutOpen(true);
                                }}
                                className={cn(
                                  "inline-flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-full px-4 py-2.5 text-xs font-bold",
                                  attachedInvoice.kind === "service" &&
                                    activeConversation.providerSlug &&
                                    !attachedInvoice.agreedDate
                                    ? "border border-gold-400 bg-gold-50 text-gold-ink hover:bg-gold-100"
                                    : "bg-linear-to-b from-grad-gold-1 to-grad-gold-2 text-gold-ink shadow-gold hover:brightness-105",
                                )}
                              >
                                <CreditCard className="size-3.5" aria-hidden="true" />
                                <span>
                                  Pay {formatMinorGBP(attachedInvoice.totalMinor)} with Stripe
                                </span>
                              </button>
                            </>
                          ) : null}

                          {attachedInvoice.status === "sent" &&
                          effectivePerspective === "provider" ? (
                            <button
                              type="button"
                              onClick={() => retractInvoice(attachedInvoice.id)}
                              className="inline-flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-full border border-blush-d/35 bg-blush/50 px-4 py-2 text-xs font-semibold text-blush-d transition-colors hover:bg-blush"
                            >
                              <Trash2 className="size-3.5" aria-hidden="true" />
                              <span>Retract &amp; delete invoice</span>
                            </button>
                          ) : null}

                          {(attachedInvoice.status === "paid_held" ||
                            (attachedInvoice.status === "delivered" &&
                              !attachedInvoice.providerConfirmedAt)) &&
                          !attachedInvoice.disputed &&
                          effectivePerspective === "provider" ? (
                            <button
                              type="button"
                              onClick={() => markInvoiceDelivered(attachedInvoice.id)}
                              className="inline-flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-full bg-leaf-800 px-4 py-2.5 text-xs font-semibold text-cream hover:bg-leaf-700"
                            >
                              <Sparkles className="size-3.5" aria-hidden="true" />
                              <span>
                                {attachedInvoice.kind === "service"
                                  ? "Confirm service completed"
                                  : "Confirm order delivered"}
                              </span>
                            </button>
                          ) : null}
                        </div>
                      </div>
                    ) : null}
                  </div>
                );
              })}

              {/* Inline Order Progress + Vinted-Style Check / Enjoy Card */}
              {latestInvoice && latestInvoice.status !== "sent" ? (
                <div className="mx-auto w-full max-w-md space-y-3 rounded-xl border border-line bg-surface p-4 shadow-soft">
                  <div className="space-y-1.5 text-xs">
                    <div className="flex items-center justify-between border-b border-line pb-2">
                      <span className="font-semibold text-ink">Purchase successful</span>
                      <span className="text-[11px] text-mut">
                        {latestInvoice.paidAt?.slice(0, 10) ?? "Confirmed"}
                      </span>
                    </div>
                    {latestInvoice.deliveredAt ||
                    latestInvoice.status === "delivered" ||
                    latestInvoice.status === "released" ? (
                      <div className="flex items-center justify-between border-b border-line pb-2">
                        <span className="font-semibold text-ink">
                          {latestInvoice.kind === "service" ? "Service completed" : "Delivered"}
                        </span>
                        <span className="text-[11px] text-mut">
                          {latestInvoice.deliveredAt?.slice(0, 10) ?? "Confirmed"}
                        </span>
                      </div>
                    ) : null}
                  </div>

                  {latestInvoice.status === "delivered" && !latestInvoice.disputed ? (
                    <p className="rounded-lg bg-gold-50 px-3 py-2 text-[11.5px] font-medium text-gold-ink">
                      1 of 2 confirmed — payout releases in 48 hours (with a 24h reminder email),
                      or straight away once both confirm.
                    </p>
                  ) : null}

                  {(latestInvoice.status === "disputed" || latestInvoice.disputed) ? (
                    <p className="rounded-lg bg-blush px-3 py-2 text-[11.5px] font-semibold text-blush-d">
                      Disputed — payout is paused and nothing will be paid out until cleared.
                    </p>
                  ) : null}

                  {(latestInvoice.status === "paid_held" ||
                    (latestInvoice.status === "delivered" &&
                      !latestInvoice.customerConfirmedAt)) &&
                  !latestInvoice.disputed &&
                  effectivePerspective === "customer" ? (
                    <div className="space-y-2.5 pt-1">
                      <p className="font-serif text-sm font-semibold text-ink">
                        Check your {latestInvoice.kind === "service" ? "service" : "order"}
                      </p>
                      <p className="text-xs leading-relaxed text-mut">
                        If everything matches its description, confirm that everything is OK. Report
                        an issue if it never arrived or isn&apos;t what you expected.
                      </p>
                      <div className="flex flex-col gap-2">
                        <button
                          type="button"
                          onClick={() => setAcceptInvoice(latestInvoice)}
                          className="w-full cursor-pointer rounded-full bg-leaf-800 py-2.5 text-xs font-bold text-cream hover:bg-leaf-700"
                        >
                          Everything is OK
                        </button>
                        <button
                          type="button"
                          onClick={() => setDisputeInvoice(latestInvoice)}
                          className="w-full cursor-pointer rounded-full border border-line-2 bg-surface-2 py-2.5 text-xs font-semibold text-ink hover:border-blush-d hover:text-blush-d"
                        >
                          I have an issue
                        </button>
                      </div>
                    </div>
                  ) : null}

                  {latestInvoice.status === "released" && effectivePerspective === "provider" ? (
                    <div className="space-y-2.5 pt-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-serif text-sm font-semibold text-leaf-900">
                          Payment received! +{formatMinorGBP(latestInvoice.subtotalMinor)}
                        </p>
                        <span className="rounded-full bg-mint px-2.5 py-0.5 text-[11px] font-bold text-mint-d">
                          Released
                        </span>
                      </div>
                      <p className="text-xs text-mut">
                        {latestInvoice.customerName} confirmed delivery.{" "}
                        {formatMinorGBP(latestInvoice.subtotalMinor)} is now available in your
                        Servyn earnings.
                      </p>
                      {latestReview ? (
                        <div className="rounded-lg border border-line bg-surface-2 p-2.5 text-xs">
                          <p className="inline-flex items-center gap-1 font-bold text-gold-600">
                            <Star className="size-3.5 fill-current" aria-hidden="true" />
                            <span>
                              Customer rated {latestReview.rating}.0 stars
                            </span>
                          </p>
                          <p className="mt-1 text-ink-2">&ldquo;{latestReview.comment}&rdquo;</p>
                        </div>
                      ) : null}
                      <Link
                        href={latestInvoice.kind === "service" ? "/vendor" : "/seller"}
                        className="flex w-full items-center justify-center rounded-full bg-linear-to-b from-grad-gold-1 to-grad-gold-2 py-2.5 text-xs font-bold text-gold-ink shadow-gold hover:brightness-105"
                      >
                        View earnings &amp; payouts →
                      </Link>
                    </div>
                  ) : null}

                  {latestInvoice.status === "released" && effectivePerspective === "customer" ? (
                    <div className="space-y-2.5 pt-1">
                      <p className="font-serif text-sm font-semibold text-ink">
                        Enjoy your {latestInvoice.kind === "service" ? "service" : "order"}!
                      </p>
                      <p className="text-xs text-mut">
                        Payment ({formatMinorGBP(latestInvoice.subtotalMinor)}) has been released to{" "}
                        {latestInvoice.providerName}.
                      </p>
                      <div className="flex flex-col gap-2">
                        {!latestReview ? (
                          <button
                            type="button"
                            onClick={() => {
                              setReviewInvoice(latestInvoice);
                              setReviewRating(5);
                              setReviewComment("");
                            }}
                            className="w-full cursor-pointer rounded-full border border-leaf-700 bg-surface py-2.5 text-xs font-bold text-leaf-800 hover:bg-mint/40"
                          >
                            Leave feedback
                          </button>
                        ) : (
                          <div className="flex items-center justify-center gap-1.5 rounded-full bg-mint py-2 text-xs font-bold text-mint-d">
                            <Star className="size-3.5 fill-current" aria-hidden="true" />
                            <span>You rated {latestReview.rating}.0 stars</span>
                          </div>
                        )}
                        <Link
                          href="/list"
                          className="flex w-full items-center justify-center rounded-full bg-leaf-800 py-2.5 text-xs font-bold text-cream hover:bg-leaf-700"
                        >
                          List a service or product
                        </Link>
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>

            {/* Safety Notice */}
            {!safetyDismissed ? (
              <div className="flex items-center justify-between gap-2 border-t border-line bg-mint/40 px-4 py-2 text-[11px] text-mint-d sm:px-6">
                <span className="inline-flex items-center gap-1.5">
                  <ShieldCheck className="size-3.5 shrink-0" aria-hidden="true" />
                  <span>
                    Stay safe on Servyn. Keep agreements and payments inside Servyn chat for
                    protected payment coverage.
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => setSafetyDismissed(true)}
                  aria-label="Dismiss safety notice"
                  className="cursor-pointer rounded p-0.5 hover:bg-mint"
                >
                  <X className="size-3.5" aria-hidden="true" />
                </button>
              </div>
            ) : null}

            {/* Quick replies */}
            <div className="flex gap-2 overflow-x-auto border-t border-line bg-surface-2 px-4 py-2.5 sm:px-6">
              {(effectivePerspective === "customer"
                ? [
                    "Does Saturday 10:30 work?",
                    "Can we agree a bundle discount?",
                    "Confirmed — please send the invoice",
                  ]
                : [
                    "Yes, that slot is free — sending invoice now",
                    "Happy to offer a 15% bundle discount!",
                    "Completed — please confirm everything is OK",
                  ]
              ).map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => setDraft(chip)}
                  className="shrink-0 cursor-pointer rounded-full border border-leaf-700/30 bg-surface px-3 py-1 text-[11px] font-semibold text-leaf-800 transition-colors hover:bg-leaf-800 hover:text-cream"
                >
                  {chip}
                </button>
              ))}
            </div>

            {/* Reply composer */}
            <form
              onSubmit={handleSendChat}
              className="flex items-center gap-2 border-t border-line bg-surface px-4 py-3.5 sm:gap-3 sm:px-6 sm:py-4"
            >
              <input
                type="text"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Write a message here..."
                className="min-w-0 flex-1 rounded-full border-[1.5px] border-line-2 bg-surface-2 px-4 py-2.5 text-sm text-ink placeholder:text-mut focus:border-gold-500 focus:bg-surface focus:outline-none"
              />
              <button
                type="submit"
                className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-full bg-leaf-800 px-4 py-2.5 text-xs font-semibold text-cream transition-colors hover:bg-leaf-700 sm:px-5"
              >
                <Send className="size-3.5" aria-hidden="true" />
                <span>Send</span>
              </button>
            </form>
          </>
        ) : null}
      </section>

      {/* Confirm Accept Order Dialog */}
      <Dialog
        open={acceptInvoice !== null}
        onOpenChange={(open) => {
          if (!open) setAcceptInvoice(null);
        }}
      >
        <DialogContent className="max-w-sm border-line bg-surface text-center">
          <DialogHeader>
            <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-mint text-mint-d">
              <CheckCircle2 className="size-6" aria-hidden="true" />
            </div>
            <DialogTitle className="font-serif text-xl text-ink">
              Confirm you accept the {acceptInvoice?.kind === "service" ? "service" : "order"}
            </DialogTitle>
            <DialogDescription className="text-xs leading-relaxed text-mut">
              We&apos;ll release your payment ({acceptInvoice ? formatMinorGBP(acceptInvoice.subtotalMinor) : ""}) to{" "}
              {acceptInvoice?.providerName}, and you won&apos;t be able to refund or return it.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2 pt-2">
            <button
              type="button"
              onClick={() => {
                if (!acceptInvoice) return;
                const inv = acceptInvoice;
                confirmSatisfactionAndRelease(inv.id);
                setAcceptInvoice(null);
                setReviewInvoice(inv);
                setReviewRating(5);
                setReviewComment("");
              }}
              className="w-full cursor-pointer rounded-full bg-leaf-800 py-2.5 text-xs font-bold text-cream hover:bg-leaf-700"
            >
              Accept {acceptInvoice?.kind === "service" ? "service" : "order"}
            </button>
            <button
              type="button"
              onClick={() => setAcceptInvoice(null)}
              className="w-full cursor-pointer rounded-full py-2 text-xs font-semibold text-leaf-700 hover:bg-surface-2"
            >
              No, go back
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Chat Confirmation Dialog */}
      <Dialog
        open={confirmDeleteChatId !== null}
        onOpenChange={(open) => {
          if (!open) setConfirmDeleteChatId(null);
        }}
      >
        <DialogContent className="max-w-sm border-line bg-surface">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl text-ink">
              Delete this chat?
            </DialogTitle>
            <DialogDescription className="text-xs leading-relaxed text-mut">
              This will permanently remove all messages and any unpaid invoices in this
              conversation. Chats with active paid orders cannot be deleted.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <button
              type="button"
              onClick={() => setConfirmDeleteChatId(null)}
              className="cursor-pointer rounded-full border border-line-2 px-4 py-2 text-xs font-semibold text-ink-2"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                if (!confirmDeleteChatId) return;
                deleteConversation(confirmDeleteChatId);
                setConfirmDeleteChatId(null);
                setSelectedId(null);
                setMobileShowChat(false);
              }}
              className="cursor-pointer rounded-full bg-blush-d px-5 py-2 text-xs font-semibold text-cream"
            >
              Delete chat
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Report Issue Dialog */}
      <Dialog
        open={disputeInvoice !== null}
        onOpenChange={(open) => {
          if (!open) setDisputeInvoice(null);
        }}
      >
        <DialogContent className="max-w-md border-line bg-surface">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-serif text-xl text-ink">
              <AlertTriangle className="size-5 text-blush-d" aria-hidden="true" />
              <span>Report an issue &amp; pause payout</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-mut">
              Payout for {disputeInvoice?.refId} will be paused immediately while our team reviews
              your chat and invoice trail.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitDispute} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-ink-2">What went wrong?</label>
              <select
                value={disputeReason}
                onChange={(e) => setDisputeReason(e.target.value)}
                className="w-full rounded-md border-[1.5px] border-line-2 bg-surface-2 px-3 py-2 text-sm text-ink"
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
                placeholder="Tell us what happened..."
                className="w-full rounded-md border-[1.5px] border-line-2 bg-surface-2 px-3 py-2 text-sm text-ink"
              />
            </div>
            <DialogFooter>
              <button
                type="button"
                onClick={() => setDisputeInvoice(null)}
                className="cursor-pointer rounded-full border border-line-2 px-4 py-2 text-xs font-semibold text-ink-2"
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

      {/* Leave Feedback / Star Rating Dialog */}
      <Dialog
        open={reviewInvoice !== null}
        onOpenChange={(open) => {
          if (!open) setReviewInvoice(null);
        }}
      >
        <DialogContent className="max-w-sm border-line bg-surface">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl text-ink">
              Thanks! Rate {reviewInvoice?.providerName}
            </DialogTitle>
            <DialogDescription className="text-xs text-mut">
              Tap a star and write a short verified review.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitReview} className="space-y-4">
            <div className="flex justify-center gap-2">
              {([1, 2, 3, 4, 5] as const).map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setReviewRating(star)}
                  aria-label={`${star} star`}
                  className={cn(
                    "cursor-pointer rounded-lg p-2 transition-colors",
                    reviewRating >= star ? "text-gold-500" : "text-line-2",
                  )}
                >
                  <Star
                    className={cn("size-7", reviewRating >= star && "fill-current")}
                    aria-hidden="true"
                  />
                </button>
              ))}
            </div>
            <textarea
              rows={3}
              required
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              placeholder="Write a review..."
              className="w-full rounded-lg border-[1.5px] border-line-2 bg-surface-2 p-3 text-sm text-ink focus:border-gold-500 focus:outline-none"
            />
            <div className="flex flex-col gap-2">
              <button
                type="submit"
                className="w-full cursor-pointer rounded-full bg-leaf-800 py-2.5 text-xs font-bold text-cream hover:bg-leaf-700"
              >
                Publish review
              </button>
              <button
                type="button"
                onClick={() => setReviewInvoice(null)}
                className="w-full cursor-pointer rounded-full py-2 text-xs font-semibold text-mut hover:text-ink"
              >
                Not now
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Generate Invoice Dialog */}
      <Dialog open={invoiceOpen} onOpenChange={setInvoiceOpen}>
        <DialogContent className="max-w-md border-line bg-surface">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl text-ink">
              Generate &amp; send agreed invoice
            </DialogTitle>
            <DialogDescription className="text-xs text-mut">
              Servyn adds 10% on top for protected payment — you receive 100% of your agreed price
              once the customer accepts delivery.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateInvoice} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-ink-2">
                Service or product description
              </label>
              <input
                type="text"
                required
                value={invTitle}
                onChange={(e) => setInvTitle(e.target.value)}
                className="w-full rounded-md border-[1.5px] border-line-2 bg-surface-2 px-3 py-2 text-sm text-ink focus:border-gold-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-ink-2">
                  Agreed price (£)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  required
                  value={invPriceGBP}
                  onChange={(e) => setInvPriceGBP(e.target.value)}
                  className="w-full rounded-md border-[1.5px] border-line-2 bg-surface-2 px-3 py-2 text-sm text-ink focus:border-gold-500 focus:outline-none"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-ink-2">
                  Original price (£, optional)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={invOriginalGBP}
                  onChange={(e) => setInvOriginalGBP(e.target.value)}
                  placeholder="e.g. 120.00"
                  className="w-full rounded-md border-[1.5px] border-line-2 bg-surface-2 px-3 py-2 text-sm text-ink focus:border-gold-500 focus:outline-none"
                />
              </div>
            </div>

            {activeConversation?.kind === "service" ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-ink-2">
                      Agreed date &amp; time (optional)
                    </label>
                    <input
                      type="text"
                      value={invDate}
                      onChange={(e) => setInvDate(e.target.value)}
                      placeholder="Leave blank so customer picks"
                      className="w-full rounded-md border-[1.5px] border-line-2 bg-surface-2 px-3 py-2 text-sm text-ink focus:border-gold-500 focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-ink-2">
                      Agreed location
                    </label>
                    <input
                      type="text"
                      value={invLocation}
                      onChange={(e) => setInvLocation(e.target.value)}
                      className="w-full rounded-md border-[1.5px] border-line-2 bg-surface-2 px-3 py-2 text-sm text-ink focus:border-gold-500 focus:outline-none"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-ink-2">
                    Discount note (optional)
                  </label>
                  <input
                    type="text"
                    value={invDiscountNote}
                    onChange={(e) => setInvDiscountNote(e.target.value)}
                    placeholder="e.g. Returning customer discount or £10 off"
                    className="w-full rounded-md border-[1.5px] border-line-2 bg-surface-2 px-3 py-2 text-sm text-ink focus:border-gold-500 focus:outline-none"
                  />
                </div>
                <p className="text-[11.5px] leading-snug text-mut">
                  Customers can still pick their service option, day &amp; time on your service page
                  with this discount automatically applied.
                </p>
              </div>
            ) : (
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-ink-2">
                  Discount note (optional)
                </label>
                <input
                  type="text"
                  value={invDiscountNote}
                  onChange={(e) => setInvDiscountNote(e.target.value)}
                  placeholder="e.g. Bulk discount for 10 units"
                  className="w-full rounded-md border-[1.5px] border-line-2 bg-surface-2 px-3 py-2 text-sm text-ink focus:border-gold-500 focus:outline-none"
                />
              </div>
            )}

            <div className="flex items-start gap-2 rounded-md border border-sky-d/20 bg-sky p-3 text-xs text-sky-d">
              <ShieldCheck className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              <span>
                Customer pays{" "}
                <strong>{formatMinorGBP(previewSubtotalMinor + previewFeeMinor)}</strong> (incl.{" "}
                {formatMinorGBP(previewFeeMinor)} fee). You receive{" "}
                <strong>{formatMinorGBP(previewSubtotalMinor)}</strong> on confirmation.
              </span>
            </div>

            <DialogFooter>
              <button
                type="button"
                onClick={() => setInvoiceOpen(false)}
                className="cursor-pointer rounded-full border-[1.5px] border-line-2 px-4 py-2 text-xs font-semibold text-ink-2"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-linear-to-b from-grad-gold-1 to-grad-gold-2 px-5 py-2 text-xs font-semibold text-gold-ink shadow-gold"
              >
                <Lock className="size-3.5" aria-hidden="true" />
                <span>Send invoice to chat</span>
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
