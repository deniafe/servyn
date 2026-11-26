"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import {
  ArrowLeft,
  Boxes,
  Check,
  MessageSquare,
  Minus,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Star,
  Store,
} from "lucide-react";
import { useCart } from "@/components/home/CartProvider";
import { MarketProductIllustration } from "@/components/market/MarketProductIllustration";
import { startOrGetConversation, useDemoFlow } from "@/lib/demo-flow-store";
import { formatGBP, type MarketProduct, type PricingMode } from "@/lib/mock-market";
import { cn } from "@/lib/utils";

export function MarketProductDetail({ product }: { product: MarketProduct }) {
  const router = useRouter();
  const { user } = useUser();
  const { currentUserId } = useDemoFlow();
  const { addToCart, updateQuantity, openCart } = useCart();

  const [selectedPhotoIdx, setSelectedPhotoIdx] = React.useState(0);
  const [pricingMode, setPricingMode] = React.useState<PricingMode>("retail");
  const [qty, setQty] = React.useState(1);
  const [added, setAdded] = React.useState(false);

  const isOwner = Boolean(
    currentUserId && product.ownerUserId && currentUserId === product.ownerUserId,
  );
  const currentUserName =
    user?.fullName ||
    user?.firstName ||
    user?.primaryEmailAddress?.emailAddress ||
    "Customer";

  const photos = product.photos ?? [];
  const activePhoto = photos[selectedPhotoIdx] ?? null;
  const activePrice = pricingMode === "bulk" ? product.bulkPrice : product.retailPrice;
  const minQty = pricingMode === "bulk" ? product.bulkMinQty : 1;
  const effectiveQty = Math.max(minQty, qty);
  const discountPct =
    product.retailPrice > 0
      ? Math.max(0, Math.round(((product.retailPrice - product.bulkPrice) / product.retailPrice) * 100))
      : 0;

  function handleAddToBasket() {
    addToCart(product, pricingMode);
    const extra = effectiveQty - minQty;
    if (extra > 0) {
      updateQuantity(`${product.id}:${pricingMode}`, extra);
    }
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1800);
    openCart();
  }

  function handleChatForDiscount() {
    const conv = startOrGetConversation({
      kind: "product",
      listingId: product.id,
      providerName: product.vendor,
      providerSlug: product.slug ?? product.id,
      providerUserId: product.ownerUserId,
      listingTitle: product.title,
      area: product.vendorArea,
      customerName: currentUserName,
      initialMessage: `Hi ${product.vendor}, I'm interested in ${product.title} — could we discuss a discount or bulk order?`,
    });
    router.push(`/messages?thread=${encodeURIComponent(conv.id)}`);
  }

  return (
    <div className="mx-auto w-full max-w-[1160px] px-4 py-7 sm:px-6 lg:px-8 lg:py-10">
      <nav aria-label="Breadcrumb" className="mb-6 flex flex-wrap items-center gap-2 text-xs text-mut">
        <Link
          href="/market"
          className="inline-flex items-center gap-1.5 font-semibold text-leaf-700 hover:text-leaf-900"
        >
          <ArrowLeft className="size-3.5" aria-hidden="true" />
          <span>Back to African Market</span>
        </Link>
        <span aria-hidden="true">/</span>
        <span>{product.category}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-[1.05fr_1fr] lg:items-start">
        {/* Left: Photo Gallery */}
        <div className="space-y-3">
          <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden rounded-[22px] border border-line bg-linear-to-b from-surface-2 via-gold-50/70 to-butter/55 shadow-soft">
            {activePhoto ? (
              <Image
                src={activePhoto}
                alt={product.name}
                fill
                unoptimized
                className="object-cover"
              />
            ) : (
              <MarketProductIllustration id={product.id} className="scale-125" />
            )}
          </div>

          {photos.length > 1 ? (
            <div className="grid grid-cols-4 gap-2.5">
              {photos.map((src, idx) => (
                <button
                  key={`${idx}-${src.slice(0, 20)}`}
                  type="button"
                  onClick={() => setSelectedPhotoIdx(idx)}
                  className={cn(
                    "relative aspect-square cursor-pointer overflow-hidden rounded-xl border-2 transition-colors",
                    selectedPhotoIdx === idx
                      ? "border-leaf-800"
                      : "border-line hover:border-gold-400",
                  )}
                >
                  <Image
                    src={src}
                    alt={`${product.name} view ${idx + 1}`}
                    fill
                    unoptimized
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
          ) : null}
        </div>

        {/* Right: Details & Purchase */}
        <div className="space-y-5 rounded-[22px] border border-line bg-surface p-5 shadow-soft sm:p-7">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-mint px-2.5 py-0.5 text-[11px] font-bold text-mint-d">
                {product.category}
              </span>
              <span className="rounded-full border border-line bg-surface-2 px-2.5 py-0.5 text-[11px] font-semibold text-ink-2">
                {product.packSize}
              </span>
              {typeof product.stock === "number" ? (
                <span className="rounded-full bg-butter px-2.5 py-0.5 text-[11px] font-semibold text-butter-d">
                  {product.stock} in stock
                </span>
              ) : null}
            </div>

            <h1 className="mt-3 font-serif text-2xl font-semibold text-ink sm:text-3xl">
              {product.name}
            </h1>

            <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-mut">
              <span className="inline-flex items-center gap-1.5 font-medium text-ink-2">
                <Store className="size-3.5 text-leaf-700" aria-hidden="true" />
                {product.vendor} · {product.vendorArea}
              </span>
              <span className="inline-flex items-center gap-1 font-bold text-ink">
                <Star className="size-3.5 fill-gold-500 text-gold-500" aria-hidden="true" />
                {product.rating.toFixed(1)}
              </span>
            </div>
          </div>

          <div className="rounded-xl border border-line bg-surface-2 p-4">
            <h2 className="text-[11px] font-bold uppercase tracking-wider text-mut">
              Product Description
            </h2>
            <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-ink-2">
              {product.originNote}
            </p>
          </div>

          {/* Retail / Bulk Tier */}
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setPricingMode("retail");
                  setQty(1);
                }}
                className={cn(
                  "flex cursor-pointer items-center justify-center gap-1.5 rounded-xl border px-3 py-2.5 text-xs font-semibold transition-colors",
                  pricingMode === "retail"
                    ? "border-leaf-800 bg-leaf-900 text-cream"
                    : "border-line-2 bg-surface-2 text-ink-2",
                )}
              >
                <ShoppingBag className="size-3.5" aria-hidden="true" />
                <span>Retail · {formatGBP(product.retailPrice)}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setPricingMode("bulk");
                  setQty(product.bulkMinQty);
                }}
                className={cn(
                  "flex cursor-pointer items-center justify-center gap-1.5 rounded-xl border px-3 py-2.5 text-xs font-semibold transition-colors",
                  pricingMode === "bulk"
                    ? "border-leaf-800 bg-leaf-900 text-cream"
                    : "border-line-2 bg-surface-2 text-ink-2",
                )}
              >
                <Boxes className="size-3.5" aria-hidden="true" />
                <span>
                  Bulk ({product.bulkMinQty}+) · {formatGBP(product.bulkPrice)}
                  {discountPct > 0 ? ` (-${discountPct}%)` : ""}
                </span>
              </button>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-mut">
                  Total ({effectiveQty} {effectiveQty === 1 ? "unit" : "units"})
                </p>
                <p className="font-serif text-2xl font-semibold tabular-nums text-ink">
                  {formatGBP(activePrice * effectiveQty)}
                </p>
              </div>

              <div className="inline-flex items-center rounded-full border border-line-2 bg-surface-2 p-1">
                <button
                  type="button"
                  onClick={() => setQty((q) => Math.max(minQty, q - 1))}
                  aria-label="Decrease quantity"
                  className="flex size-8 cursor-pointer items-center justify-center rounded-full text-ink hover:bg-surface"
                >
                  <Minus className="size-3.5" aria-hidden="true" />
                </button>
                <span className="min-w-8 text-center text-sm font-bold tabular-nums text-ink">
                  {effectiveQty}
                </span>
                <button
                  type="button"
                  onClick={() => setQty((q) => q + 1)}
                  aria-label="Increase quantity"
                  className="flex size-8 cursor-pointer items-center justify-center rounded-full text-ink hover:bg-surface"
                >
                  <Plus className="size-3.5" aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2.5">
            {isOwner ? (
              <Link
                href="/messages"
                className="inline-flex w-full items-center justify-center rounded-full border border-leaf-200 bg-mint/40 px-5 py-3 text-xs font-bold text-mint-d"
              >
                Your listing · View customer enquiries
              </Link>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleAddToBasket}
                  className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-linear-to-b from-grad-gold-1 to-grad-gold-2 px-5 py-3.5 text-sm font-bold text-gold-ink shadow-gold hover:brightness-105"
                >
                  {added ? (
                    <>
                      <Check className="size-4" aria-hidden="true" />
                      <span>Added to basket</span>
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="size-4" aria-hidden="true" />
                      <span>Add to basket</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleChatForDiscount}
                  className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-full border border-line-2 bg-surface-2 px-5 py-3 text-xs font-semibold text-ink hover:border-leaf-600"
                >
                  <MessageSquare className="size-4 text-leaf-700" aria-hidden="true" />
                  <span>Chat with seller for discount</span>
                </button>
              </>
            )}
          </div>

          <div className="flex items-start gap-2 rounded-lg border border-line bg-surface-2 p-3 text-xs text-mut">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-leaf-700" aria-hidden="true" />
            <span>
              <strong className="text-ink">Protected payment (not escrow):</strong> Processed via
              Stripe and held until you confirm delivery.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
