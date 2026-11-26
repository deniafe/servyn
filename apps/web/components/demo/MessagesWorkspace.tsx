"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import {
  CheckCircle2,
  CreditCard,
  FileText,
  Lock,
  MessageSquare,
  Send,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Wrench,
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
  formatMinorGBP,
  markInvoiceDelivered,
  sendMessage,
  useDemoFlow,
  type DemoInvoice,
} from "@/lib/demo-flow-store";
import { cn } from "@/lib/utils";

export function MessagesWorkspace({ customerName }: { customerName: string }) {
  const searchParams = useSearchParams();
  const threadParam = searchParams.get("thread");

  const { conversations, invoices } = useDemoFlow();
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [perspective, setPerspective] = React.useState<"customer" | "provider">("customer");
  const [draft, setDraft] = React.useState("");

  // Invoice builder dialog state
  const [invoiceOpen, setInvoiceOpen] = React.useState(false);
  const [invTitle, setInvTitle] = React.useState("");
  const [invPriceGBP, setInvPriceGBP] = React.useState("75.00");
  const [invOriginalGBP, setInvOriginalGBP] = React.useState("");
  const [invDiscountNote, setInvDiscountNote] = React.useState("");
  const [invDate, setInvDate] = React.useState("Sat 29 Nov · 10:30");
  const [invLocation, setInvLocation] = React.useState("Hulme, Manchester");

  // Stripe checkout dialog state
  const [checkoutInvoice, setCheckoutInvoice] = React.useState<DemoInvoice | null>(null);
  const [checkoutOpen, setCheckoutOpen] = React.useState(false);

  const effectiveId = selectedId ?? threadParam;
  const activeConversation =
    conversations.find((c) => c.id === effectiveId) ?? conversations[0] ?? null;

  function openInvoiceDialog() {
    if (!activeConversation) return;
    setInvTitle(activeConversation.listingTitle);
    setInvPriceGBP(activeConversation.kind === "service" ? "75.00" : "95.00");
    setInvOriginalGBP(activeConversation.kind === "product" ? "120.00" : "");
    setInvDiscountNote(activeConversation.kind === "product" ? "Agreed bulk discount" : "");
    setInvDate(activeConversation.kind === "service" ? "Sat 29 Nov · 10:30" : "");
    setInvLocation(activeConversation.area || "Manchester");
    setInvoiceOpen(true);
  }

  function handleSendChat(e: React.FormEvent) {
    e.preventDefault();
    if (!activeConversation || !draft.trim()) return;
    sendMessage(activeConversation.id, perspective, draft);
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

  const previewSubtotalMinor = Math.max(
    0,
    Math.round((Number.parseFloat(invPriceGBP) || 0) * 100),
  );
  const previewFeeMinor = computeServynFeeMinor(previewSubtotalMinor);

  return (
    <div className="grid gap-6 lg:grid-cols-[290px_1fr]">
      {/* Dark leaf-950 left rail matching uploaded onboarding/workspace UI */}
      <aside className="flex flex-col justify-between rounded-[18px] bg-leaf-950 p-4 text-cream shadow-lift">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-gold-200 px-3 py-1 text-[11.5px] font-bold text-gold-ink">
              <MessageSquare className="size-3.5" aria-hidden="true" />
              <span>Negotiation &amp; Invoices</span>
            </span>
            <span className="text-[11px] text-cream-60">{conversations.length} threads</span>
          </div>

          <div className="space-y-2">
            {conversations.map((conv) => {
              const active = activeConversation?.id === conv.id;
              const latestInv = invoices.find((i) => i.conversationId === conv.id);
              return (
                <button
                  key={conv.id}
                  type="button"
                  onClick={() => setSelectedId(conv.id)}
                  className={cn(
                    "w-full cursor-pointer rounded-md border p-3 text-left transition-all",
                    active
                      ? "border-gold-500/60 bg-leaf-800/90 text-cream"
                      : "border-cream/10 bg-leaf-900/50 text-cream-75 hover:border-cream/25 hover:bg-leaf-900",
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
                    {latestInv ? (
                      <span className="rounded-full bg-cream/10 px-2 py-0.5 text-[10px] font-semibold text-cream">
                        {latestInv.status === "sent"
                          ? "Invoice sent"
                          : latestInv.status === "paid_held"
                            ? "Held"
                            : latestInv.status === "delivered"
                              ? "Delivered"
                              : "Released"}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 truncate text-sm font-semibold text-cream">
                    {conv.providerName}
                  </p>
                  <p className="truncate text-xs text-cream-60">{conv.listingTitle}</p>
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-6 rounded-md border border-cream/12 bg-leaf-900/70 p-3 text-[11.5px] text-cream-75">
          <p className="font-semibold text-gold-300">Demo Tip</p>
          <p className="mt-1 leading-relaxed">
            Switch between <strong>Customer</strong> and <strong>Vendor / Seller</strong> in the
            header above the chat to negotiate and send a live Stripe-payable invoice.
          </p>
        </div>
      </aside>

      {/* Main chat + invoice surface */}
      <section className="flex min-h-[560px] flex-col rounded-[18px] border border-line bg-surface shadow-soft">
        {activeConversation ? (
          <>
            {/* Thread header + Demo Perspective switcher */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-6 py-4">
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-serif text-xl font-semibold text-ink">
                    {activeConversation.providerName}
                  </h1>
                  <span className="rounded-full bg-mint px-2.5 py-0.5 text-[11px] font-bold text-mint-d">
                    {activeConversation.area}
                  </span>
                </div>
                <p className="text-xs text-mut">
                  {activeConversation.listingTitle} · Customer: {activeConversation.customerName}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div
                  role="group"
                  aria-label="Demo perspective"
                  className="inline-flex rounded-full border border-line bg-surface-2 p-1 text-xs font-semibold"
                >
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
                    Customer view
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
                    Vendor / Seller view
                  </button>
                </div>

                {perspective === "provider" ? (
                  <button
                    type="button"
                    onClick={openInvoiceDialog}
                    className="inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-linear-to-b from-grad-gold-1 to-grad-gold-2 px-4 py-2 text-xs font-semibold text-gold-ink shadow-gold transition-all hover:brightness-105"
                  >
                    <FileText className="size-3.5" aria-hidden="true" />
                    <span>Generate &amp; send invoice</span>
                  </button>
                ) : null}
              </div>
            </div>

            {/* Messages list */}
            <div className="flex-1 space-y-4 overflow-y-auto bg-cream/40 p-6">
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
                        "max-w-[82%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-soft",
                        isCustomer
                          ? "bg-leaf-900 text-cream"
                          : "border border-line bg-surface text-ink",
                      )}
                    >
                      <p className="mb-1 text-[10.5px] font-bold uppercase tracking-wider opacity-70">
                        {isCustomer ? activeConversation.customerName : activeConversation.providerName}
                      </p>
                      <p>{msg.text}</p>
                    </div>

                    {attachedInvoice ? (
                      <div className="w-full max-w-md rounded-lg border border-gold-300 bg-surface p-4 shadow-soft">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="inline-flex items-center gap-1 rounded-full bg-gold-100 px-2.5 py-0.5 text-[11px] font-bold text-butter-d">
                              <FileText className="size-3" aria-hidden="true" />
                              Servyn Invoice
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
                                : attachedInvoice.status === "paid_held" ||
                                    attachedInvoice.status === "delivered"
                                  ? "bg-sky text-sky-d"
                                  : "bg-butter text-butter-d",
                            )}
                          >
                            {attachedInvoice.status === "sent"
                              ? "Awaiting payment"
                              : attachedInvoice.status === "paid_held"
                                ? "Paid · Held by Servyn"
                                : attachedInvoice.status === "delivered"
                                  ? "Delivered · Confirm"
                                  : "Released to provider"}
                          </span>
                        </div>

                        {attachedInvoice.agreedDate || attachedInvoice.agreedLocation ? (
                          <p className="mt-1 text-xs text-mut">
                            {[attachedInvoice.agreedDate, attachedInvoice.agreedLocation]
                              .filter(Boolean)
                              .join(" · ")}
                          </p>
                        ) : null}

                        {attachedInvoice.discountNote ? (
                          <p className="mt-1 text-xs font-semibold text-leaf-700">
                            {attachedInvoice.discountNote}
                            {attachedInvoice.originalAmountMinor
                              ? ` (was ${formatMinorGBP(attachedInvoice.originalAmountMinor)})`
                              : ""}
                          </p>
                        ) : null}

                        <div className="mt-3 space-y-1 border-t border-line pt-2.5 text-xs">
                          <div className="flex justify-between text-ink-2">
                            <span>Agreed price</span>
                            <span className="tabular-nums">
                              {formatMinorGBP(attachedInvoice.subtotalMinor)}
                            </span>
                          </div>
                          <div className="flex justify-between text-mut">
                            <span>Servyn protected payment fee (10%)</span>
                            <span className="tabular-nums">
                              {formatMinorGBP(attachedInvoice.feeMinor)}
                            </span>
                          </div>
                          <div className="flex justify-between font-serif text-sm font-semibold text-ink">
                            <span>Total</span>
                            <span className="tabular-nums">
                              {formatMinorGBP(attachedInvoice.totalMinor)}
                            </span>
                          </div>
                        </div>

                        <div className="mt-3 flex flex-wrap gap-2">
                          {attachedInvoice.status === "sent" && perspective === "customer" ? (
                            <button
                              type="button"
                              onClick={() => {
                                setCheckoutInvoice(attachedInvoice);
                                setCheckoutOpen(true);
                              }}
                              className="inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-linear-to-b from-grad-gold-1 to-grad-gold-2 px-4 py-2 text-xs font-semibold text-gold-ink shadow-gold hover:brightness-105"
                            >
                              <CreditCard className="size-3.5" aria-hidden="true" />
                              <span>
                                Pay {formatMinorGBP(attachedInvoice.totalMinor)} with Stripe
                              </span>
                            </button>
                          ) : null}

                          {attachedInvoice.status === "paid_held" && perspective === "provider" ? (
                            <button
                              type="button"
                              onClick={() => markInvoiceDelivered(attachedInvoice.id)}
                              className="inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-leaf-800 px-4 py-2 text-xs font-semibold text-cream hover:bg-leaf-700"
                            >
                              <Sparkles className="size-3.5" aria-hidden="true" />
                              <span>
                                Mark {attachedInvoice.kind === "service" ? "service" : "goods"}{" "}
                                delivered
                              </span>
                            </button>
                          ) : null}

                          {(attachedInvoice.status === "paid_held" ||
                            attachedInvoice.status === "delivered") &&
                          perspective === "customer" ? (
                            <button
                              type="button"
                              onClick={() => confirmSatisfactionAndRelease(attachedInvoice.id)}
                              className="inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-leaf-800 px-4 py-2 text-xs font-semibold text-cream hover:bg-leaf-700"
                            >
                              <CheckCircle2 className="size-3.5" aria-hidden="true" />
                              <span>Confirm satisfaction &amp; release payment</span>
                            </button>
                          ) : null}
                        </div>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>

            {/* Quick replies */}
            <div className="flex gap-2 overflow-x-auto border-t border-line bg-surface-2 px-6 py-2.5">
              {(perspective === "customer"
                ? [
                    "Does Saturday 10:30 work?",
                    "Can we agree a bundle discount?",
                    "Confirmed — please send the invoice",
                  ]
                : [
                    "Yes, that slot is free — sending invoice now",
                    "Happy to offer a 15% bundle discount!",
                    "Service completed — please confirm in Bookings",
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
              className="flex items-center gap-3 border-t border-line bg-surface px-6 py-4"
            >
              <input
                type="text"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder={
                  perspective === "customer"
                    ? "Message provider about price, date, location, or discount..."
                    : "Reply as provider/seller..."
                }
                className="flex-1 rounded-full border-[1.5px] border-line-2 bg-surface-2 px-4 py-2.5 text-sm text-ink placeholder:text-mut focus:border-gold-500 focus:bg-surface focus:outline-none"
              />
              <button
                type="submit"
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-leaf-800 px-5 py-2.5 text-xs font-semibold text-cream transition-colors hover:bg-leaf-700"
              >
                <Send className="size-3.5" aria-hidden="true" />
                <span>Send</span>
              </button>
            </form>
          </>
        ) : null}
      </section>

      {/* Generate Invoice Dialog */}
      <Dialog open={invoiceOpen} onOpenChange={setInvoiceOpen}>
        <DialogContent className="max-w-md border-line bg-surface">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl text-ink">
              Generate &amp; send invoice
            </DialogTitle>
            <DialogDescription className="text-xs text-mut">
              Servyn adds 10% on top for protected payment — you receive 100% of your agreed price
              once the customer confirms delivery.
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
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-ink-2">Agreed date &amp; time</label>
                  <input
                    type="text"
                    value={invDate}
                    onChange={(e) => setInvDate(e.target.value)}
                    className="w-full rounded-md border-[1.5px] border-line-2 bg-surface-2 px-3 py-2 text-sm text-ink focus:border-gold-500 focus:outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-ink-2">Agreed location</label>
                  <input
                    type="text"
                    value={invLocation}
                    onChange={(e) => setInvLocation(e.target.value)}
                    className="w-full rounded-md border-[1.5px] border-line-2 bg-surface-2 px-3 py-2 text-sm text-ink focus:border-gold-500 focus:outline-none"
                  />
                </div>
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
