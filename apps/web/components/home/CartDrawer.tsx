"use client";

import * as React from "react";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import {
  CreditCard,
  Minus,
  Plus,
  ShieldCheck,
  ShoppingCart,
  Trash2,
  X,
} from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useCart } from "@/components/home/CartProvider";
import { StripeCheckoutDialog } from "@/components/demo/StripeCheckoutDialog";
import { MarketProductIllustration } from "@/components/market/MarketProductIllustration";
import {
  createInvoiceAndSend,
  startOrGetConversation,
  type DemoInvoice,
} from "@/lib/demo-flow-store";
import {
  FREE_DELIVERY_THRESHOLD,
  formatGBP,
} from "@/lib/mock-market";

export function CartDrawer() {
  const { user } = useUser();
  const currentUserName =
    user?.fullName ||
    user?.firstName ||
    user?.primaryEmailAddress?.emailAddress ||
    "Customer";
  const shouldReduceMotion = useReducedMotion();
  const {
    items,
    cartCount,
    subtotal,
    deliveryFee,
    total,
    isOpen,
    closeCart,
    updateQuantity,
    removeItem,
    clearCart,
  } = useCart();
  const [checkedOut, setCheckedOut] = React.useState(false);
  const [checkoutInvoice, setCheckoutInvoice] = React.useState<DemoInvoice | null>(null);
  const [stripeOpen, setStripeOpen] = React.useState(false);

  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closeCart();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, closeCart]);

  function handleCheckout() {
    if (items.length === 0) return;
    const first = items[0]!;
    const summaryTitle =
      items.length === 1
        ? `${first.product.title} (x${first.quantity})`
        : `${first.product.title} + ${items.length - 1} more item(s)`;
    const conv = startOrGetConversation({
      kind: "product",
      providerName: first.product.vendor,
      providerSlug: "kofis-kitchen",
      listingTitle: summaryTitle,
      area: first.product.vendorArea,
      customerName: currentUserName,
    });
    const inv = createInvoiceAndSend({
      conversationId: conv.id,
      kind: "product",
      providerName: first.product.vendor,
      customerName: currentUserName,
      title: summaryTitle,
      subtotalMinor: Math.round(total * 100),
      agreedLocation: first.product.vendorArea,
      messageText: `Basket checkout initiated for ${summaryTitle}.`,
    });
    setCheckoutInvoice(inv);
    closeCart();
    setStripeOpen(true);
  }

  function handleClose() {
    setCheckedOut(false);
    closeCart();
  }

  const remainingForFreeDelivery = Math.max(
    0,
    FREE_DELIVERY_THRESHOLD - subtotal,
  );

  return (
    <>
      <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            aria-hidden="true"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            onClick={handleClose}
            className="fixed inset-0 z-[120] bg-leaf-950/45 backdrop-blur-[4px]"
          />

          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-labelledby="basket-drawer-title"
            initial={shouldReduceMotion ? { opacity: 0 } : { x: "100%" }}
            animate={shouldReduceMotion ? { opacity: 1 } : { x: "0%" }}
            exit={shouldReduceMotion ? { opacity: 0 } : { x: "100%" }}
            transition={
              shouldReduceMotion
                ? { duration: 0.18 }
                : { type: "spring", bounce: 0, duration: 0.38 }
            }
            className="fixed top-0 right-0 bottom-0 z-[121] flex w-full max-w-[440px] flex-col bg-surface text-ink shadow-drawer"
          >
            <div className="flex items-center justify-between border-b border-line px-6 py-5">
              <h2
                id="basket-drawer-title"
                className="font-serif text-[18px] font-semibold text-ink tabular-nums"
              >
                Your basket ({cartCount})
              </h2>
              <button
                type="button"
                onClick={handleClose}
                aria-label="Close basket"
                className="flex size-8 cursor-pointer items-center justify-center rounded-full bg-surface-2 text-ink-2 transition-colors hover:bg-cream-2 hover:text-ink"
              >
                <X className="size-4" strokeWidth={2} aria-hidden="true" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5">
              {checkedOut ? (
                <div className="flex flex-col items-center justify-center py-14 text-center">
                  <span className="mb-3 flex size-12 items-center justify-center rounded-full bg-leaf-50 text-leaf-600">
                    <ShieldCheck className="size-6" aria-hidden="true" />
                  </span>
                  <h3 className="font-serif text-[18px] font-semibold text-ink">
                    Demo order confirmed
                  </h3>
                  <p className="mt-1.5 max-w-[30ch] text-[13px] text-mut">
                    Thank you! This demo checkout places no real charge on your
                    card.
                  </p>
                  <button
                    type="button"
                    onClick={handleClose}
                    className="mt-6 cursor-pointer rounded-full bg-leaf-900 px-5 py-2.5 text-[13px] font-semibold text-cream transition-colors hover:bg-leaf-800"
                  >
                    Continue browsing
                  </button>
                </div>
              ) : items.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-14 text-center">
                  <span className="mb-3 flex size-12 items-center justify-center rounded-full bg-surface-2 text-mut">
                    <ShoppingCart className="size-5" aria-hidden="true" />
                  </span>
                  <h3 className="font-serif text-[17px] font-semibold text-ink">
                    Your basket is empty
                  </h3>
                  <p className="mt-1.5 max-w-[28ch] text-[13px] text-mut">
                    Add authentic fabrics, skincare, and pantry staples from
                    local sellers.
                  </p>
                  <Link
                    href="/market"
                    onClick={handleClose}
                    className="mt-5 rounded-full bg-leaf-900 px-5 py-2.5 text-[13px] font-semibold text-cream transition-colors hover:bg-leaf-800"
                  >
                    Browse The Market
                  </Link>
                </div>
              ) : (
                <ul className="flex flex-col divide-y divide-line">
                  {items.map((item) => (
                    <li
                      key={item.key}
                      className="flex items-center gap-3.5 py-4 first:pt-0 last:pb-0"
                    >
                      <div className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-[12px] bg-linear-to-br from-gold-50 via-gold-100/70 to-butter/85 p-1">
                        <MarketProductIllustration
                          id={item.product.id}
                          className="max-w-full"
                        />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <p className="truncate text-[13.5px] font-semibold text-ink">
                            {item.product.title}
                          </p>
                          {item.mode === "bulk" && (
                            <span className="shrink-0 rounded-full bg-leaf-100 px-2 py-0.5 text-[10px] font-bold text-leaf-800">
                              Bulk
                            </span>
                          )}
                        </div>
                        <p className="mt-0.5 text-[12px] text-mut tabular-nums">
                          {formatGBP(item.unitPrice)} each
                        </p>
                      </div>

                      <div className="flex shrink-0 items-center gap-1.5">
                        <div className="inline-flex h-8 items-center rounded-full border border-line-2 bg-surface">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.key, -1)}
                            aria-label={`Decrease quantity of ${item.product.title}`}
                            className="flex size-7 cursor-pointer items-center justify-center rounded-full text-ink-2 transition-colors hover:bg-surface-2 hover:text-ink"
                          >
                            <Minus className="size-3" strokeWidth={2} />
                          </button>
                          <span className="min-w-5 text-center text-[12.5px] font-semibold text-ink tabular-nums">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.key, 1)}
                            aria-label={`Increase quantity of ${item.product.title}`}
                            className="flex size-7 cursor-pointer items-center justify-center rounded-full text-ink-2 transition-colors hover:bg-surface-2 hover:text-ink"
                          >
                            <Plus className="size-3" strokeWidth={2} />
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => removeItem(item.key)}
                          aria-label={`Remove ${item.product.title}`}
                          className="flex size-8 cursor-pointer items-center justify-center rounded-full bg-surface-2 text-mut transition-colors hover:bg-blush/50 hover:text-danger"
                        >
                          <Trash2 className="size-3.5" strokeWidth={1.75} />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {items.length > 0 && !checkedOut && (
              <div className="border-t border-line bg-surface px-6 py-5">
                <div className="flex flex-col gap-2 text-[13.5px]">
                  <div className="flex items-center justify-between text-mut">
                    <span>Subtotal</span>
                    <span className="font-medium text-ink-2 tabular-nums">
                      {formatGBP(subtotal)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-mut">
                    <span>Delivery</span>
                    <span className="font-medium text-ink-2 tabular-nums">
                      {deliveryFee === 0 ? "Free" : formatGBP(deliveryFee)}
                    </span>
                  </div>
                  {remainingForFreeDelivery > 0 && (
                    <p className="text-[11.5px] text-leaf-700 tabular-nums">
                      Add {formatGBP(remainingForFreeDelivery)} more for free
                      delivery
                    </p>
                  )}
                  <div className="mt-1 flex items-baseline justify-between border-t border-line pt-3">
                    <span className="text-[15px] font-semibold text-ink">
                      Total
                    </span>
                    <span className="font-serif text-[22px] font-bold text-ink tabular-nums">
                      {formatGBP(total)}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleCheckout}
                  className="mt-4 inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-linear-to-b from-grad-gold-1 to-grad-gold-2 px-6 py-3.5 text-[14px] font-bold text-gold-ink shadow-gold transition-[transform,filter] hover:brightness-[1.03] active:scale-[0.98]"
                >
                  <CreditCard
                    className="size-4"
                    strokeWidth={2}
                    aria-hidden="true"
                  />
                  <span>Checkout securely</span>
                </button>

                <p className="mt-3 flex items-center justify-center gap-1.5 text-[11.5px] text-mut">
                  <ShieldCheck
                    className="size-3.5 shrink-0 text-leaf-600"
                    strokeWidth={1.75}
                    aria-hidden="true"
                  />
                  <span>
                    Protected payment powered by Stripe.
                  </span>
                </p>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>

      <StripeCheckoutDialog
        invoice={checkoutInvoice}
        open={stripeOpen}
        onOpenChange={setStripeOpen}
        onPaid={() => {
          clearCart();
          setCheckedOut(true);
        }}
      />
    </>
  );
}
