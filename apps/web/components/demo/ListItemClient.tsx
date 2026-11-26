"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import {
  CheckCircle2,
  ImagePlus,
  Lock,
  ShieldCheck,
  ShoppingBag,
  Trash2,
  Wrench,
} from "lucide-react";
import {
  computeServynFeeMinor,
  formatMinorGBP,
  publishLiveListing,
} from "@/lib/demo-flow-store";
import { cn } from "@/lib/utils";

const SERVICE_CATEGORIES = [
  "Hair & Beauty",
  "Barbering & Grooming",
  "Events & Celebrations",
  "Event Decoration",
  "Event Rentals",
  "DJs & MCs",
  "Catering & Food",
  "Cakes & Baking",
  "Childcare & Family",
  "Fashion & Tailoring",
  "Home Services",
] as const;

const PRODUCT_CATEGORIES = [
  "Food & Pantry",
  "Beauty & Care",
  "Fashion & Textiles",
  "Homeware & Craft",
] as const;

const MANCHESTER_AREAS = [
  "Hulme",
  "Salford",
  "Cheetham Hill",
  "Levenshulme",
  "Moss Side",
  "Chorlton",
  "Trafford",
  "Oldham",
] as const;

export function ListItemClient() {
  const searchParams = useSearchParams();
  const initialKind = searchParams.get("kind") === "product" ? "product" : "service";
  const { isLoaded, isSignedIn } = useUser();

  const [kind, setKind] = React.useState<"service" | "product">(initialKind);
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [category, setCategory] = React.useState<string>(
    initialKind === "product" ? PRODUCT_CATEGORIES[0] : SERVICE_CATEGORIES[0],
  );
  const [area, setArea] = React.useState<string>("Hulme");
  const [address, setAddress] = React.useState("");
  const [priceGBP, setPriceGBP] = React.useState(initialKind === "product" ? "14.00" : "45.00");
  const [durationMins, setDurationMins] = React.useState("90");
  const [bulkPriceGBP, setBulkPriceGBP] = React.useState("11.00");
  const [minBulkQty, setMinBulkQty] = React.useState("10");
  const [stock, setStock] = React.useState("25");
  const [unit, setUnit] = React.useState("pack");
  const [photos, setPhotos] = React.useState<string[]>([]);

  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [publishedSlug, setPublishedSlug] = React.useState<string | null>(null);

  function switchKind(nextKind: "service" | "product") {
    setKind(nextKind);
    setCategory(nextKind === "product" ? PRODUCT_CATEGORIES[0] : SERVICE_CATEGORIES[0]);
    setPriceGBP(nextKind === "product" ? "14.00" : "45.00");
    setError(null);
    setPublishedSlug(null);
  }

  function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    const url = URL.createObjectURL(file);
    const img = new window.Image();
    img.onload = () => {
      const maxPx = 700;
      const scale = Math.min(1, maxPx / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(img.width * scale));
      canvas.height = Math.max(1, Math.round(img.height * scale));
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.78);
        setPhotos((prev) => [...prev, dataUrl].slice(0, 4));
      }
      URL.revokeObjectURL(url);
    };
    img.onerror = () => URL.revokeObjectURL(url);
    img.src = url;
    e.target.value = "";
  }

  const priceMinor = Math.max(0, Math.round((Number.parseFloat(priceGBP) || 0) * 100));
  const feeMinor = computeServynFeeMinor(priceMinor);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !description.trim() || priceMinor < 100) {
      setError("Please add a title, description, and a price of at least £1.00.");
      return;
    }

    setSubmitting(true);
    setError(null);

    const parsedBulkMinor = Math.round((Number.parseFloat(bulkPriceGBP) || 0) * 100);
    const res = await publishLiveListing({
      kind,
      title: title.trim(),
      category,
      area,
      address: address.trim() || undefined,
      description: description.trim(),
      priceMinor,
      durationMins:
        kind === "service" ? Math.max(15, Number.parseInt(durationMins, 10) || 60) : undefined,
      bulkPriceMinor:
        kind === "product" && parsedBulkMinor >= 100 ? parsedBulkMinor : undefined,
      minBulkQty:
        kind === "product" ? Math.max(2, Number.parseInt(minBulkQty, 10) || 10) : undefined,
      stock: kind === "product" ? Math.max(1, Number.parseInt(stock, 10) || 20) : undefined,
      unit: kind === "product" ? unit.trim() || "item" : undefined,
      photos,
    });

    setSubmitting(false);
    if (!res.ok) {
      setError(res.message);
      return;
    }

    setPublishedSlug(res.listing.slug);
    setTitle("");
    setDescription("");
    setAddress("");
    setPhotos([]);
  }

  return (
    <div className="mx-auto max-w-[720px] space-y-6 px-4 py-8 sm:px-6 sm:py-10">
      <div className="text-center">
        <span className="inline-block rounded-full bg-gold-100 px-3 py-1 text-[11px] font-bold text-butter-d">
          Publish Live to Servyn
        </span>
        <h1 className="mt-2 font-serif text-2xl font-semibold text-ink sm:text-3xl">
          {kind === "service" ? "List a service" : "Sell a product"}
        </h1>
        <p className="mt-1 text-xs text-mut sm:text-sm">
          Your listing goes live in the Manchester directory immediately so customers can discover,
          message, and pay you safely.
        </p>
      </div>

      {/* Mode Switcher */}
      <div className="grid grid-cols-2 gap-2 rounded-full border border-line bg-surface p-1.5 shadow-soft">
        <button
          type="button"
          onClick={() => switchKind("service")}
          className={cn(
            "inline-flex cursor-pointer items-center justify-center gap-2 rounded-full px-4 py-2.5 text-xs font-semibold transition-colors sm:text-sm",
            kind === "service" ? "bg-leaf-900 text-cream" : "text-ink-2 hover:text-leaf-700",
          )}
        >
          <Wrench className="size-4" aria-hidden="true" />
          <span>List a Service</span>
        </button>
        <button
          type="button"
          onClick={() => switchKind("product")}
          className={cn(
            "inline-flex cursor-pointer items-center justify-center gap-2 rounded-full px-4 py-2.5 text-xs font-semibold transition-colors sm:text-sm",
            kind === "product" ? "bg-leaf-900 text-cream" : "text-ink-2 hover:text-leaf-700",
          )}
        >
          <ShoppingBag className="size-4" aria-hidden="true" />
          <span>Sell a Product</span>
        </button>
      </div>

      {isLoaded && !isSignedIn ? (
        <div className="space-y-4 rounded-[18px] border border-line bg-surface p-6 text-center shadow-soft">
          <Lock className="mx-auto size-8 text-leaf-700" aria-hidden="true" />
          <h2 className="font-serif text-xl font-semibold text-ink">
            Sign in to publish your listing
          </h2>
          <p className="mx-auto max-w-md text-xs text-mut">
            Listings are linked to your Servyn account so customer enquiries, agreed invoices, and
            protected payouts route directly to you.
          </p>
          <div className="flex flex-wrap justify-center gap-2.5">
            <Link
              href={`/sign-in?redirect_url=${encodeURIComponent(`/list?kind=${kind}`)}`}
              className="rounded-full bg-leaf-800 px-5 py-2.5 text-xs font-semibold text-cream hover:bg-leaf-700"
            >
              Sign in
            </Link>
            <Link
              href={`/sign-up?intent=${kind === "service" ? "vendor" : "seller"}`}
              className="rounded-full bg-linear-to-b from-grad-gold-1 to-grad-gold-2 px-5 py-2.5 text-xs font-semibold text-gold-ink shadow-gold"
            >
              Create account
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-5">
          {publishedSlug ? (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-leaf-300 bg-mint p-4 text-xs text-mint-d">
              <span className="inline-flex items-center gap-2 font-semibold">
                <CheckCircle2 className="size-4 shrink-0" aria-hidden="true" />
                <span>Published live to Servyn!</span>
              </span>
              <Link
                href={kind === "service" ? `/services/${publishedSlug}` : "/market"}
                className="rounded-full bg-leaf-900 px-3.5 py-1.5 font-semibold text-cream"
              >
                {kind === "service" ? "View live listing →" : "View on Market →"}
              </Link>
            </div>
          ) : null}

          {/* Photos */}
          <section className="space-y-3 rounded-[18px] border border-line bg-surface p-5 shadow-soft">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-base font-semibold text-ink">
                Photos ({photos.length}/4)
              </h2>
              <span className="text-[11px] text-mut">Optional · Resized automatically</span>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {photos.map((src, idx) => (
                <div
                  key={`${idx}-${src.slice(0, 24)}`}
                  className="relative size-20 overflow-hidden rounded-lg border border-line"
                >
                  <Image
                    src={src}
                    alt={`Upload ${idx + 1}`}
                    width={80}
                    height={80}
                    unoptimized
                    className="size-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => setPhotos((prev) => prev.filter((_, i) => i !== idx))}
                    aria-label="Remove photo"
                    className="absolute top-1 right-1 cursor-pointer rounded-full bg-leaf-950/85 p-1 text-cream"
                  >
                    <Trash2 className="size-3" aria-hidden="true" />
                  </button>
                </div>
              ))}
              {photos.length < 4 ? (
                <label className="flex h-20 flex-1 min-w-[160px] cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-line-2 bg-surface-2 px-4 text-xs font-semibold text-leaf-700 transition-colors hover:border-gold-400">
                  <ImagePlus className="size-4" aria-hidden="true" />
                  <span>+ Upload photos</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="sr-only"
                  />
                </label>
              ) : null}
            </div>
          </section>

          {/* About */}
          <section className="space-y-4 rounded-[18px] border border-line bg-surface p-5 shadow-soft">
            <h2 className="font-serif text-base font-semibold text-ink">
              {kind === "service" ? "About your service" : "About your item"}
            </h2>
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-ink-2">Title</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={
                  kind === "service"
                    ? "e.g. Medium Knotless Braids (Home or Studio)"
                    : "e.g. Grade A Unrefined Shea Butter (500g)"
                }
                className="w-full rounded-lg border-[1.5px] border-line-2 bg-surface-2 px-3.5 py-2.5 text-sm text-ink focus:border-gold-500 focus:outline-none"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-ink-2">Description</label>
              <textarea
                rows={4}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={
                  kind === "service"
                    ? "Tell customers what is included, prep notes, and travel options..."
                    : "Tell buyers about origin, weight, freshness, and Manchester delivery/pickup..."
                }
                className="w-full rounded-lg border-[1.5px] border-line-2 bg-surface-2 px-3.5 py-2.5 text-sm text-ink focus:border-gold-500 focus:outline-none"
              />
            </div>
          </section>

          {/* Details & Pricing */}
          <section className="space-y-4 rounded-[18px] border border-line bg-surface p-5 shadow-soft">
            <h2 className="font-serif text-base font-semibold text-ink">Details &amp; Pricing</h2>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-ink-2">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full rounded-lg border-[1.5px] border-line-2 bg-surface-2 px-3 py-2.5 text-sm text-ink focus:border-gold-500 focus:outline-none"
                >
                  {(kind === "service" ? SERVICE_CATEGORIES : PRODUCT_CATEGORIES).map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-ink-2">Manchester Area</label>
                <select
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  className="w-full rounded-lg border-[1.5px] border-line-2 bg-surface-2 px-3 py-2.5 text-sm text-ink focus:border-gold-500 focus:outline-none"
                >
                  {MANCHESTER_AREAS.map((a) => (
                    <option key={a} value={a}>
                      {a}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-ink-2">
                Address or Postcode{" "}
                <span className="font-normal text-mut">(optional — shown on map)</span>
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g. 42 Stretford Road, Hulme, M15 5ED"
                className="w-full rounded-lg border-[1.5px] border-line-2 bg-surface-2 px-3.5 py-2.5 text-sm text-ink focus:border-gold-500 focus:outline-none"
              />
              <p className="text-[11px] text-mut">
                Add a studio/shop address or postcode so customers can preview your location on the
                interactive map.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-ink-2">
                  {kind === "service" ? "Starting Price (£)" : "Retail Price (£)"}
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  required
                  value={priceGBP}
                  onChange={(e) => setPriceGBP(e.target.value)}
                  className="w-full rounded-lg border-[1.5px] border-line-2 bg-surface-2 px-3.5 py-2.5 text-sm text-ink focus:border-gold-500 focus:outline-none"
                />
              </div>

              {kind === "service" ? (
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-ink-2">Duration (mins)</label>
                  <input
                    type="number"
                    min="15"
                    step="15"
                    value={durationMins}
                    onChange={(e) => setDurationMins(e.target.value)}
                    className="w-full rounded-lg border-[1.5px] border-line-2 bg-surface-2 px-3.5 py-2.5 text-sm text-ink focus:border-gold-500 focus:outline-none"
                  />
                </div>
              ) : (
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-ink-2">
                    Bulk Price (£, optional)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    value={bulkPriceGBP}
                    onChange={(e) => setBulkPriceGBP(e.target.value)}
                    className="w-full rounded-lg border-[1.5px] border-line-2 bg-surface-2 px-3.5 py-2.5 text-sm text-ink focus:border-gold-500 focus:outline-none"
                  />
                </div>
              )}
            </div>

            {kind === "product" ? (
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-ink-2">Min Bulk Qty</label>
                  <input
                    type="number"
                    min="2"
                    value={minBulkQty}
                    onChange={(e) => setMinBulkQty(e.target.value)}
                    className="w-full rounded-lg border-[1.5px] border-line-2 bg-surface-2 px-3 py-2 text-sm text-ink"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-ink-2">Stock</label>
                  <input
                    type="number"
                    min="1"
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    className="w-full rounded-lg border-[1.5px] border-line-2 bg-surface-2 px-3 py-2 text-sm text-ink"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-ink-2">Unit</label>
                  <input
                    type="text"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full rounded-lg border-[1.5px] border-line-2 bg-surface-2 px-3 py-2 text-sm text-ink"
                  />
                </div>
              </div>
            ) : null}

            <div className="flex items-start gap-2 rounded-lg border border-line bg-surface-2 p-3 text-xs text-ink-2">
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-leaf-700" aria-hidden="true" />
              <span>
                Customer pays <strong>{formatMinorGBP(priceMinor + feeMinor)}</strong> (incl. 10%
                Servyn protected payment fee). You receive{" "}
                <strong>{formatMinorGBP(priceMinor)}</strong> on confirmation.
              </span>
            </div>
          </section>

          {error ? (
            <p
              role="alert"
              className="rounded-lg bg-blush px-4 py-2.5 text-xs font-semibold text-blush-d"
            >
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={submitting}
            className="w-full cursor-pointer rounded-full bg-linear-to-b from-grad-gold-1 to-grad-gold-2 py-3.5 text-sm font-bold text-gold-ink shadow-gold transition-all hover:brightness-105 disabled:opacity-60"
          >
            {submitting
              ? "Publishing to Servyn..."
              : kind === "service"
                ? "Publish service live"
                : "Publish product live"}
          </button>
        </form>
      )}
    </div>
  );
}
